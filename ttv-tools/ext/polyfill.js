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

/**
 * @file Defines all polyfill logic for the extension. Used on most pages.
 * <style>[\.pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[\.good]{background:#e8f0fe66;color:#174ea6}[\.bad]{background:#fce8e666;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.io/ephellon @ephellon})
 * @module
 */

;

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
/** Parses a URL and returns its constituent components
 * @simply parseURL(url:string) → object
 *
 * @param {string<URL>} url The URL to parse
 *
 * @returns {{ href:string }}
 *
 * @example // Parsing a URL
 * let url = parseURL("https://user:pass@example.com:56/action?login=true#news");
 * // url.href → "https://user:pass@example.com:56/action.html?login=true#news"
 * // url.origin → "https://"
 * // url.protocol → "https:"
 * // url.scheme → "https"
 * // url.username → "user"
 * // url.password → "pass"
 * // url.host → "example.com:56"
 * // url.hostname → "example.com"
 * // url.port → "56"
 * // url.pathname → "/action.html"
 * // url.filename → "action.html"
 * // url.search → "?login=true"
 * // url.hash → "#news"
 */
function parseURL(url) {
    if(nullish(url))
        return {};

    url = url.toString();

    let {
        href = '',
        origin = '',
        protocol = '',
        scheme = '',
        username = '',
        password = '',
        host = '',
        hostname = '',
        port = '',
        pathname = '',
        filename = '',
        search = '',
        hash = '',
    } = parseURL.pattern
        .exec(url)
        ?.groups ?? {};

    if(href.length < 2)
        return {};

    origin += host;

    return {
        href, origin, protocol, scheme, username, password, host, hostname, port, pathname, search, hash,

        filename: pathname.split('/').pop(),

        domainPath: hostname.split('.').reverse(),
        searchParameters: (data => {
            let results = {};

            parsing:
            for(let query of data) {
                let [name, value] = query.split('=', 2);

                if(nullish(name || value))
                    continue;
                name ??= '';
                value ??= '';

                results[name] = (
                    defined(results[name])?
                        results[name] instanceof Array?
                            results[name].concat(value):
                        [results[name], value]:
                    value
                );
            }

            return results;
        })(search.slice(1).split('&')),

        addSearch(parameters, overwrite = false) {
            if(typeof url == 'string')
                url = parseURL(url);

            let { href, searchParameters } = url,
                params = {};

            if(parameters instanceof Array) {
                for(let key of parameters)
                    params[key] = key;

                parameters = params;
            }

            if(overwrite)
                searchParameters = Object.entries({ ...searchParameters, ...parameters });
            else
                searchParameters = [searchParameters, parameters].map(Object.entries).flat();

            return parseURL(href.replace(/(?:\?[^#]*)?(#.*)?$/, `?${ searchParameters.map(parameter => parameter.join('=')).join('&') }$1`));
        },

        delSearch(parameters) {
            if(typeof url == 'string')
                url = parseURL(url);

            let { href, searchParameters } = url;

            for(let parameter of parameters)
                delete searchParameters[parameter];

            return parseURL(href.replace(/(?:\?[^#]*)?(#.*)?$/, `?${ Object.entries({ ...searchParameters }).map(parameter => parameter.join('=')).join('&') }$1`));
        },
    };
}

Object.defineProperties(parseURL, {
    pattern: {
        value: /(?<href>(?<origin>(?<protocol>(?<scheme>[a-z][\w\-]{2,}):)?(?:\/\/)?)?(?:(?<username>[^:\s]*):(?<password>[^@\s]*)@)?(?<host>(?<hostname>[^\.]+(?:\.[^\.:\/?#\s][^:\/?#\s]+|(?=\/))|\B\.{1,2}\B)(?:\:(?<port>\d+))?)(?<pathname>\/[^?#\s]*)?(?<search>\?[^#\s]*)?(?<hash>#[^\s]*)?)/i
    },
});

// Go to a page
    // goto(url:string<URL>, target:string?, pass:object?) → undefined
function goto(url, target = '_self', pass = {}) {
    // DVR save
    top.beforeleaving?.(pass);

    open(url, target);
}

// Create elements
    // furnish(tagname:string?, attributes:object?, ...children<Element>) → Element
function furnish(tagname = 'div', attributes = null, ...children) {
    let options = (attributes ??= {}).is === true? { is: true }: null;

    delete attributes.is;

    let esc = false,
        name = '',
        value = '';

    let context, climate, element;

    parsing:
    for(let index = 0, length = tagname?.length | 0; index <= length; ++index) {
        let char = tagname[index] || '',
            last = index == length;

        if(last || (climate != context)) {
            if((defined(context) && nullish(climate)) || (context?.startsWith?.(climate) === false)) {
                name = '';
                value = '';
            }

            climate = context;
        }

        switch(context) {
            case 'attribute': {
                if(char == '=') {
                    context = 'attribute-value';
                    continue;
                } else if(char == ']') {
                    attributes[name] = value;

                    context = null;
                    continue;
                }

                name += char;

                if(last)
                    attributes[name] = value;
            } break;

            case 'attribute-value': {
                if(esc || char == '\\') {
                    esc = !esc;

                    if(esc)
                        continue;

                    let escs = { 'b': '\b', 'c': '\c', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t', 'v': '\v' };

                    if(char in escs) {
                        value += escs[char];
                        continue;
                    }
                } else if(!esc) {
                    if(char == ']') {
                        attributes[name] = value;

                        context = null;
                        continue;
                    } else if(char == '"') {
                        if(value.length > 0) {
                            attributes[name] = value;

                            context = 'attribute';
                        }

                        continue;
                    }
                }

                value += char;

                if(last)
                    attributes[name] = value;
            } break;

            case 'class': {
                if(esc || char == '\\') {
                    esc = !esc;

                    if(esc)
                        continue;
                } else if(!esc) {
                    if(char == '#') {
                        element.classList.add(value.trim());

                        context = 'id';
                        continue;
                    } if(char == '.') {
                        element.classList.add(value.trim());

                        value = '';
                        continue;
                    } if(char == '[') {
                        element.classList.add(value.trim());

                        context = 'attribute';
                        continue;
                    }
                }

                value += char;

                if(last)
                    element.classList.add(value.trim());
            } break;

            case 'id': {
                if(esc || char == '\\') {
                    esc = !esc;

                    if(esc)
                        continue;
                } else if(!esc) {
                    if(char == '.') {
                        element.setAttribute(context, value.trim());

                        context = 'class';
                        continue;
                    } if(char == '[') {
                        element.setAttribute(context, value.trim());

                        context = 'attribute';
                        continue;
                    }
                }

                value += char;

                if(last)
                    element.setAttribute(context, value.trim());
            } break;

            default: {
                if(nullish(element)) {
                    // https://www.w3.org/TR/2011/WD-html5-20110525/syntax.html#syntax-tag-name
                    if(/[0-9a-zA-Z]/.test(char)) {
                        name += char;
                    } else {
                        if(char == '#')
                            context = 'id';
                        if(char == '.')
                            context = 'class';
                        if(char == '[')
                            context = 'attribute';

                        if(last || defined(context))
                            element = document.createElement((name || 'div'), options);
                    }
                } else {
                    if(char == '#')
                        context = 'id';
                    if(char == '.')
                        context = 'class';
                    if(char == '[')
                        context = 'attribute';
                }
            } break;
        }
    }

    Object.entries(attributes)
        .filter(([name, value]) => name?.length)
        .forEach(([name, value]) => {
            name = name?.trim();

            return (/^(@|data-|on|(?:(?:inner|outer)(?:HTML|Text)|textContent|class(?:List|Name)|value)$)/.test(name) || typeof value == 'function')?
                (/^on/.test(name))?
                    element.addEventListener(name.replace(/^on/, ''), value):
                (/^(@|data-)/.test(name))?
                    element.dataset[name.replace(/^(@|data-)/, '').replace(/-(\w)/g, ($0, $1, $$, $_) => $1.toUpperCase())] = value:
                element[name] = value:
            element.setAttribute(name, value);
    });

    children
        .filter(defined)
        .forEach(child => element.append(child));

    /* furnish('div').and('figure').with('svg').and('figure').with('svg') → div > figure > svg ~ figure > svg */
    Object.defineProperties(element, {
        // Add a child; chains down the tree
        // Returns the last accessed child
        and: {
            value: function(...children) {
                let last;
                for(let child of children)
                    this.append(last = child);

                return last;
            },

            writable: false,
            enumerable: true,
            configurable: false,
        },

        // Alters the element's styling
        // Returns `this` | string<CSS>
        css: {
            value: function(...parameters) {
                if(nullish(parameters))
                    return this.getAttribute('style') ?? '';
                this.modStyle.apply(this, parameters);

                return this;
            },

            writable: false,
            enumerable: true,
            configurable: false,
        },

        // Shorthand to set the element's innerHTML
        // Returns `this` | string<HTML>
        html: {
            value: function(innerHTML) {
                if(nullish(innerHTML))
                    return this.outerHTML;
                this.innerHTML = innerHTML;

                return this;
            },

            writable: false,
            enumerable: true,
            configurable: false,
        },

        // Shorthand to set the element's innerText
        // Returns `this` | string
        text: {
            value: function(innerText) {
                if(nullish(innerText))
                    return this.innerText;
                this.innerText = innerText;

                return this;
            },

            writable: false,
            enumerable: true,
            configurable: false,
        },

        // Add a child; immediately after the root `this`
        // Returns `this`
        with: {
            value: function(...children) {
                for(let child of children)
                    this.append(child);

                return this;
            },

            writable: false,
            enumerable: true,
            configurable: false,
        },
    });

    element.and?.bind?.(element);
    element.with?.bind?.(element);

    return element;
}

// https://developer.mozilla.org/en-US/docs/Web/HTML/Element
Object.defineProperties(furnish, {
    a: { value: function Anchor(...children) { return furnish('a', null, ...children) } },
    abbr: { value: function Abbreviation(...children) { return furnish('abbr', null, ...children) } },
    address: { value: function Address(...children) { return furnish('address', null, ...children) } },
    area: { value: function Area(attributes) { return furnish('area', attributes) } },
    article: { value: function Article(...children) { return furnish('article', null, ...children) } },
    aside: { value: function Aside(...children) { return furnish('aside', null, ...children) } },
    audio: { value: function Audio(...children) { return furnish('audio', null, ...children) } },
    b: { value: function Bold(...children) { return furnish('b', null, ...children) } },
    base: { value: function Base(attributes) { return furnish('base', attributes) } },
    bdi: { value: function BidirectionalTextInsertion(...children) { return furnish('bdi', null, ...children) } },
    bdo: { value: function BidirectionalTextOverride(...children) { return furnish('bdo', null, ...children) } },
    blockquote: { value: function BlockQuote(...children) { return furnish('blockquote', null, ...children) } },
    body: { value: function Body(...children) { return furnish('body', null, ...children) } },
    br: { value: function Break(...children) { return furnish('br', null, ...children) } },
    button: { value: function Button(...children) { return furnish('button', null, ...children) } },
    canvas: { value: function Canvas(...children) { return furnish('canvas', null, ...children) } },
    caption: { value: function Caption(...children) { return furnish('caption', null, ...children) } },
    cite: { value: function Cite(...children) { return furnish('cite', null, ...children) } },
    code: { value: function Code(...children) { return furnish('code', null, ...children) } },
    col: { value: function Column(attributes) { return furnish('col', attributes) } },
    colgroup: { value: function ColumnGroup(...children) { return furnish('colgroup', null, ...children) } },
    data: { value: function Data(...children) { return furnish('data', null, ...children) } },
    datalist: { value: function DataList(...children) { return furnish('datalist', null, ...children) } },
    dd: { value: function Description(...children) { return furnish('dd', null, ...children) } },
    del: { value: function Deleted(...children) { return furnish('del', null, ...children) } },
    details: { value: function Details(...children) { return furnish('details', null, ...children) } },
    dfn: { value: function Definition(...children) { return furnish('dfn', null, ...children) } },
    dialog: { value: function Dialog(...children) { return furnish('dialog', null, ...children) } },
    div: { value: function Divider(...children) { return furnish('div', null, ...children) } },
    dl: { value: function DescriptionList(...children) { return furnish('dl', null, ...children) } },
    dt: { value: function DescriptionTerm(...children) { return furnish('dt', null, ...children) } },
    em: { value: function Emphasis(...children) { return furnish('em', null, ...children) } },
    embed: { value: function Embed(attributes) { return furnish('embed', attributes) } },
    fieldset: { value: function Fieldset(...children) { return furnish('fieldset', null, ...children) } },
    figcaption: { value: function FigureCaption(...children) { return furnish('figcaption', null, ...children) } },
    figure: { value: function Figure(...children) { return furnish('figure', null, ...children) } },
    footer: { value: function Footer(...children) { return furnish('footer', null, ...children) } },
    form: { value: function Form(...children) { return furnish('form', null, ...children) } },
    h1: { value: function HeaderSize1(...children) { return furnish('h1', null, ...children) } },
    h2: { value: function HeaderSize2(...children) { return furnish('h2', null, ...children) } },
    h3: { value: function HeaderSize3(...children) { return furnish('h3', null, ...children) } },
    h4: { value: function HeaderSize4(...children) { return furnish('h4', null, ...children) } },
    h5: { value: function HeaderSize5(...children) { return furnish('h5', null, ...children) } },
    h6: { value: function HeaderSize6(...children) { return furnish('h6', null, ...children) } },
    head: { value: function Head(...children) { return furnish('head', null, ...children) } },
    header: { value: function Header(...children) { return furnish('header', null, ...children) } },
    hr: { value: function Horizontal(...children) { return furnish('hr', null, ...children) } },
    html: { value: function HTML(...children) { return furnish('html', null, ...children) } },
    i: { value: function Italics(...children) { return furnish('i', null, ...children) } },
    iframe: { value: function Iframe(...children) { return furnish('iframe', null, ...children) } },
    img: { value: function Image(attributes) { return furnish('img', attributes) } },
    input: { value: function Input(attributes) { return furnish('input', attributes) } },
    ins: { value: function Insertion(...children) { return furnish('ins', null, ...children) } },
    kbd: { value: function Keyboard(...children) { return furnish('kbd', null, ...children) } },
    label: { value: function Label(...children) { return furnish('label', null, ...children) } },
    legend: { value: function Legend(...children) { return furnish('legend', null, ...children) } },
    li: { value: function ListItem(...children) { return furnish('li', null, ...children) } },
    link: { value: function Link(attributes) { return furnish('link', attributes) } },
    main: { value: function Main(...children) { return furnish('main', null, ...children) } },
    map: { value: function Map(...children) { return furnish('map', null, ...children) } },
    mark: { value: function Mark(...children) { return furnish('mark', null, ...children) } },
    menu: { value: function Menu(...children) { return furnish('menu', null, ...children) } },
    meta: { value: function Metadata(attributes) { return furnish('meta', attributes) } },
    meter: { value: function Meter(...children) { return furnish('meter', null, ...children) } },
    nav: { value: function Navigation(...children) { return furnish('nav', null, ...children) } },
    noscript: { value: function Noscript(...children) { return furnish('noscript', null, ...children) } },
    object: { value: function Object(...children) { return furnish('object', null, ...children) } },
    ol: { value: function OrderedList(...children) { return furnish('ol', null, ...children) } },
    optgroup: { value: function OptionGroup(...children) { return furnish('optgroup', null, ...children) } },
    option: { value: function Option(...children) { return furnish('option', null, ...children) } },
    output: { value: function Output(...children) { return furnish('output', null, ...children) } },
    p: { value: function Paragraph(...children) { return furnish('p', null, ...children) } },
    picture: { value: function Picture(...children) { return furnish('picture', null, ...children) } },
    portal: { value: function Portal(...children) { return furnish('portal', null, ...children) } },
    pre: { value: function Preformatted(...children) { return furnish('pre', null, ...children) } },
    progress: { value: function Progress(...children) { return furnish('progress', null, ...children) } },
    q: { value: function Quote(...children) { return furnish('q', null, ...children) } },
    rp: { value: function RubyParenthesis(...children) { return furnish('rp', null, ...children) } },
    rt: { value: function RubyText(...children) { return furnish('rt', null, ...children) } },
    ruby: { value: function Ruby(...children) { return furnish('ruby', null, ...children) } },
    s: { value: function Strikethrough(...children) { return furnish('s', null, ...children) } },
    samp: { value: function Sample(...children) { return furnish('samp', null, ...children) } },
    script: { value: function Script(...children) { return furnish('script', null, ...children) } },
    section: { value: function Section(...children) { return furnish('section', null, ...children) } },
    select: { value: function Select(...children) { return furnish('select', null, ...children) } },
    slot: { value: function Slot(...children) { return furnish('slot', null, ...children) } },
    small: { value: function Small(...children) { return furnish('small', null, ...children) } },
    source: { value: function Source(attributes) { return furnish('source', attributes) } },
    span: { value: function Span(...children) { return furnish('span', null, ...children) } },
    strong: { value: function Strong(...children) { return furnish('strong', null, ...children) } },
    style: { value: function Style(...children) { return furnish('style', null, ...children) } },
    sub: { value: function Subscript(...children) { return furnish('sub', null, ...children) } },
    summary: { value: function Summary(...children) { return furnish('summary', null, ...children) } },
    sup: { value: function Superscript(...children) { return furnish('sup', null, ...children) } },
    svg: { value: function SVG(...children) { return furnish('svg', null, ...children) } },
    table: { value: function Table(...children) { return furnish('table', null, ...children) } },
    tbody: { value: function TableBody(...children) { return furnish('tbody', null, ...children) } },
    td: { value: function TableData(...children) { return furnish('td', null, ...children) } },
    template: { value: function Template(...children) { return furnish('template', null, ...children) } },
    textarea: { value: function Textarea(...children) { return furnish('textarea', null, ...children) } },
    tfoot: { value: function TableFooter(...children) { return furnish('tfoot', null, ...children) } },
    th: { value: function TableHeaderCell(...children) { return furnish('th', null, ...children) } },
    thead: { value: function TableHeader(...children) { return furnish('thead', null, ...children) } },
    time: { value: function Time(...children) { return furnish('time', null, ...children) } },
    title: { value: function Title(...children) { return furnish('title', null, ...children) } },
    tr: { value: function TableRow(...children) { return furnish('tr', null, ...children) } },
    track: { value: function Track(attributes) { return furnish('track', attributes) } },
    u: { value: function Underline(...children) { return furnish('u', null, ...children) } },
    ul: { value: function UnorderedList(...children) { return furnish('ul', null, ...children) } },
    var: { value: function Variable(...children) { return furnish('var', null, ...children) } },
    video: { value: function Video(...children) { return furnish('video', null, ...children) } },
    wbr: { value: function WBR(attributes) { return furnish('wbr', attributes) } },
});

// Gets the X and Y offset (in pixels)
    // getOffset(element:Element) → Object<{ height:number, width:number, left:number, top:number, right:number, bottom:number }>
function getOffset(element) {
    let bounds = element.getBoundingClientRect(),
        { offsetHeight, scrollHeight, offsetWidth, scrollWidth } = element,
        { height, width } = bounds;

    let offset = {
        height, width,

        center: [bounds.left + (width / 2), bounds.top + (height / 2)],

        left:   bounds.left + (window.pageXOffset ?? document.documentElement.scrollLeft ?? 0) | 0,
        top:    bounds.top  + (window.pageYOffset ?? document.documentElement.scrollTop  ?? 0) | 0,

        right:  bounds.right  + (window.pageXOffset ?? document.documentElement.scrollLeft ?? 0) | 0,
        bottom: bounds.bottom + (window.pageYOffset ?? document.documentElement.scrollTop  ?? 0) | 0,

        // https://stackoverflow.com/a/41988106/4211612
        textOverflow: (offsetWidth < scrollWidth || offsetHeight < scrollHeight),
        textOverflowX: (offsetWidth < scrollWidth),
        textOverflowY: (offsetHeight < scrollHeight),
    };

    Object.defineProperties(offset, {
        screenOverflowX: { value: (offset.left < 0 || offset.right > innerWidth) },
        screenCorrectX: { value: (offset.left < 0? offset.left: offset.right > innerWidth? innerWidth - offset.right: 0) },
        screenOverflowY: { value: (offset.top < 0 || offset.bottom > innerHeight) },
        screenCorrectY: { value: (offset.top < 0? offset.top: offset.bottom > innerHeight? innerHeight - offset.bottom: 0) },
    });

    return Object.defineProperties(offset, {
        screenOverflow: { value: offset.screenOverflowX || offset.screenOverflowY },
        screenCorrect: { value: [offset.screenCorrectX, offset.screenCorrectY] },
    });
}

// Convert milliseconds into a human-readable string
    // toTimeString(milliseconds:number?, format:string?) → string
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

        default: {
            switch(format) {
                case 'clock': {
                    format = '!hour:!minute:!second';
                } break;

                case 'readable': {
                    format = '&hour_h &minute_m &second_s';
                } break;

                case 'short': {
                    format = '&hour_h&minute_m&second_s';
                } break;
            }

            joining_symbol = '';

            for(let [name, value] of times)
                if(milliseconds >= value) {
                    let amount = (milliseconds / value) | 0;

                    time.push(time[name] = (amount + ''));

                    milliseconds -= amount * value;
                }

            times.set('millisecond', milliseconds);

            result = format
                // Replace the text
                .split(/(<?[&!?~](?:year|day|hour|minute|(?:milli)?second)s?(?:_|=[^>]+?>|\b))/g)
                .filter(str => str.length)
                .map($1 => {
                    let [command, ...argument] = $1.split(/\b/);

                    argument = argument.join('');

                    if(command[0] == '<') {
                        let [arg, ...ret] = argument.split('=');
                        let clk = toTimeString(originalTime, command[1] + arg);

                        ret = ret.join('');
                        ret = ret.substr(0, ret.length - 1);

                        if(parseFloat(clk) > 0)
                            return [clk, ret].join('');
                        return '';
                    }

                    // Example: 61 minutes, 20 seconds
                        // SYNTAX:  TOTAL, ROUNDED                  | TOTAL, NOT ROUNDED                            | REMAINDER, LEADING ZERO   | REMAINDER, NO LEADING ZERO    | IF TOTAL (ROUNDED) > 0; append the value then the text following the `=`
                        // INPUT:   ~hour_h ~minutes_m ~seconds_s   | ?hour_h ?minutes_m ?seconds_s                 | !hour:!minutes:!seconds   | &hour:&minutes:&seconds       | <~days=d, ><~hours=h, ><~minutes=m, ><~seconds=s >
                        // OUTPUT:  1h 61m 3680s                    | 1.0222222222222221h 61.333333333333336m 3680s | 01:01:20                  | 1:1:20                        | 1h, 61m, 3680s
                    switch(command) {
                        // Total amount (rounded)
                        case '~': {
                            for(let [name, value] of times)
                                if(argument.contains('millisecond'))
                                    return milliseconds;
                                else if(argument.contains(name))
                                    return Math.round(originalTime / times.get(name));
                        } break;

                        // Total amount (not rounded)
                        case '?': {
                            for(let [name, value] of times)
                                if(argument.contains('millisecond'))
                                    return milliseconds;
                                else if(argument.contains(name))
                                    return originalTime / times.get(name);
                        } break;

                        // Remaining amount (left over) with leading zero
                        case '!': {
                            for(let [name, value] of times)
                                if(argument.contains('millisecond'))
                                    return milliseconds;
                                else if(argument.contains(name))
                                    return time[name]?.padStart(2, '00') ?? '00';
                        } break;

                        // Remaining amount (left over) without leading zero
                        case '&': {
                            for(let [name, value] of times)
                                if(argument.contains('millisecond'))
                                    return milliseconds;
                                else if(argument.contains(name))
                                    return time[name] ?? '0';
                        } break;
                    }

                    return $1;
                });
        } break;
    }

    return sign + result.join(joining_symbol);
}

// Convert a time-formatted string into its corresponding millisecond value
    // parseTime(time:string, type:string?) → number
function parseTime(time = '', type = null) {
    let ms = 0;

    if(defined(type)) {
        switch(type.slice(0, 3).toLowerCase()) {
            case 'mil':
                ms = parseInt(time);
                break;

            case 'sec':
                ms = parseInt(time) * 1000;
                break;

            case 'min':
                ms = parseInt(time) * 1000 * 60;
                break;

            case 'hou':
                ms = parseInt(time) * 1000 * 60 * 60;
                break;

            case 'day':
                ms = parseInt(time) * 1000 * 60 * 60 * 24;
                break;
        }
    } else {
        let units = [1000, 60, 60, 24, 365].map((unit, index, array) => (array.slice(0, index).map(u => unit *= u), unit));

        if(parseTime.pattern.test(time))
            time = time.replace(/(\d+\s*d\w*)?(\s*\d+\s*h\w*)?(\s*\d+\s*m\w*)?(\s*\d+\s*s\w*)?/i, ($0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $$, $_) => [$1, $2, $3, $4].join(':'));

        for(let unit of time.split(':').reverse())
            ms += parseInt(unit) * units.splice(0,1)[0];
    }

    return ms;
}

Object.defineProperties(parseTime, {
    pattern: { value: /(\b\d\s*(?:d(?:ay)?|h(?:our)?|m(?:in(?:ute)?)?|s(?:ec(?:ond)?)?)s?\b)/i }
});

// Convert boolean values
    // parseBool(value:any) → boolean
function parseBool(value = null) {
    let stringified;
    try {
        stringified = JSON.stringify(value);
    } catch(error) {
        stringified = value.toString();
    }

    stringified = (stringified || typeof stringified).trim().replace(/^"([^"]*?)"$/, '$1');

    switch(stringified) {
        case undefined:
        case 'false':
        case 'null':
        case '[]':
        case '{}':
        case '0':
        case '':
            return false;

        default:
            return (["bigint","number"].contains(typeof value)? !Number.isNaN(value): true);
    }
}

// Returns the DOM path of an element
    // getDOMPath(element:Element, length:number?<int>) → string
        // getDOMPath(element, +2) → Adds ids, classes, and non-spaced attributes to the path
            // html>body>div#root.root[data-a-page-loaded-name="ChannelWatchPage"][data-a-page-loaded="1686805563781"][data-a-page-events-submitted="1686805565437"]>div>div:nth-child(2)>div>main>div>div:nth-child(3)>div>div>div>div>div:nth-child(2)>div>div>div>div:nth-child(3)>div:nth-child(3)>div>div>div:nth-child(7)>div>div>div>div>p:nth-child(5)>a
        // getDOMPath(element, +1) → Adds ids and classes to the path
            // html>body>div#root.root>div>div:nth-child(2)>div>main>div>div:nth-child(3)>div>div>div>div>div:nth-child(2)>div>div>div>div:nth-child(3)>div:nth-child(3)>div>div>div:nth-child(7)>div>div>div>div>p:nth-child(5)>a
        // getDOMPath(element, +0) → Adds ids to the path
            // html>body>div#root>div>div:nth-child(2)>div>main>div>div:nth-child(3)>div>div>div>div>div:nth-child(2)>div>div>div>div:nth-child(3)>div:nth-child(3)>div>div>div:nth-child(7)>div>div>div>div>p:nth-child(5)>a
        // getDOMPath(element, -1) → Finds the first id and stops, or traverses up the entire tree. Removes single-tag generations ("div>div>div>div..." → "div div")
            // #root>div>div:nth-child(2)>div>main>div>div:nth-child(3) div div:nth-child(2) div div:nth-child(3)>div:nth-child(3) div div:nth-child(7) div p:nth-child(5)>a
// https://stackoverflow.com/a/16742828/4211612
function getDOMPath(element, length = 0) {
    if(nullish(element))
        throw 'Unable to get path of non-Node';

    let path = [];
    while(defined(element.parentNode)) {
        let parent = element.parentNode,
            siblings = parent.children;

        let nthChild = 1, sameTag = false;
        nth: for(let sibling of siblings)
            if(sibling === element)
                break nth;
            else if(sameTag ||= (sibling.nodeName.equals(element.nodeName)))
                ++nthChild;

        let nodeName = element.nodeName.toLowerCase();
        let attributes = [...element.attributes].filter(attr => !/\s/.test(attr.value) && !/^(id|class)$/i.test(attr.name)).map(attr => `[${ attr.name }="${ attr.value }"]`).join('');

        if(element.id.length) {
            path.unshift(`${
                (length < 0? '': nodeName)
                    }#${
                element.id
                    }${
                (length > 0? ['', ...element.classList].join('.'): '')
                    }${
                (length > 1? attributes: '')
            }`);

            if(length < 0)
                break;
        } else if(nthChild > 1) {
            path.unshift(`${ nodeName }${ (length > 1? attributes: '') }:nth-child(${ nthChild })`);
        } else {
            path.unshift(`${ nodeName }${ (length > 1? attributes: '') }`);
        }

        element = parent;
    }

    path = path.join('>').replace(/#([^\a-z][^>\s]*)/ig, '[id="$1"]');
    for(let regexp = /[> ](?:(\w+)[> ]\1[^#:\[\]])+/; length < 0 && regexp.test(path);)
        path = path.replace(regexp, ' $1 ');

    return path;
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

// Filters an object by its keys using any number of iterable sources
    // Object.filter(target, ...sources) → Object<target - #>
Object.filter ??= function filter(target, ...sources) {
    for(let source of sources)
        if(source?.constructor?.prototype?.[Symbol.iterator]) // iterables only
            for(let rule of source)
                if(!(rule in target))
                    delete target[rule];

    return target;
};

// Binds the function the same way as `Function..bind` but uses an `argument array` instead of an `argument spread`
    // Function..wrap(thisArg:object|null, argArray:array?<any>) → Function
Function.prototype.wrap ??= function wrap(thisArg, argArray = []) {
    return this.bind.apply(this, [thisArg].concat(argArray));
};

// Finds the last index using the same format as `Array..findIndex`
    // Array..findLastIndex(predicate:function, thisArg:object?) → number<integer>
Array.prototype.findLastIndex ??= function findLastIndex(predicate, thisArg = null) {
    let index = this.reverse().findIndex(predicate, thisArg);

    return !!~index? (this.length - index) - 1: index;
};

// Determines if the array contains any of the value(s)
    // Array..contains(...values:any) → boolean
Array.prototype.contains ??= function contains(...values) {
    for(let value of values)
        if(false
            || (true
                && typeof value == 'function'
                && !!this.filter(value).length
            )
            || !!~this.indexOf(value)
        )
            return true;

    return false;
};

// Determines if the array is missing all of the value(s)
    // Array..missing(...values:any) → boolean
Array.prototype.missing ??= function missing(...values) {
    return !this.contains(...values);
};

// Returns an array of purely unique elements
    // Array..isolate(against:array?) → Set[]
Array.prototype.isolate ??= function isolate(against = []) {
    return [...new Set(this)].filter(value => against.missing(value));
};

// (Randomly) Shuffles the array
    // Array..shuffle() → array
Array.prototype.shuffle ??= function shuffle() {
    let { random } = Math;

    return [...this].sort(() => random() < 0.5? -(random() * this.length): +(random() * this.length));
};

// Returns a random item from the array
    // Array..random() → any
Array.prototype.random ??= function random() {
    let [item] = this.shuffle();

    return item;
};

// https://stackoverflow.com/a/6117889/4211612
// Returns the current week of the year
    // Date..getWeek() → number<integer>
Date.prototype.getWeek = function getWeek() {
    let now = new Date(Date.UTC(
        this.getFullYear(),
        this.getMonth(),
        this.getDate()
    )),
    day = now.getUTCDay() || 7;

    now.setUTCDate(now.getUTCDate() + 4 - day);

    let year = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    return Math.ceil((((now - year) / 86_400_000) + 1) / 7);
};

// https://stackoverflow.com/a/8619946/4211612
// Returns the current day of the year
    // Date..getAbsoluteDay() → number<integer>
Date.prototype.getAbsoluteDay ??= function getAbsoluteDay() {
    let start = new Date(this.getFullYear(), 0, 0);
    let day = 86_400_000,
        offset = (this - start) + ((start.getTimezoneOffset() - this.getTimezoneOffset()) * 60_000);

    return (offset / day).floor();
};

// Returns the current meridiem
    // Date..getMeridiem() → string<{ "AM" | "PM" }>
Date.prototype.getMeridiem ??= function getMeridiem() {
    return this.getHours() > 11? 'PM': 'AM';
};

// https://stackoverflow.com/a/11888430/4211612
// Returns whether or not Daylight Savings Time is in effect
    // Date.isDST() → boolean
Date.isDST ??= function isDST() {
    let now = new Date;
    let Jan = new Date(now.getFullYear(), 0, 1),
        Jul = new Date(now.getFullYear(), 6, 1);

    return now.getTimezoneOffset() < Math.max(Jan.getTimezoneOffset(), Jul.getTimezoneOffset());
};

// Returns the milliseconds since an event
    // Date.since(event:Date|number) → number<integer>
Date.since ??= function since(event) {
    return (+new Date) - +event;
};

// Strips the HTML body from a document
    // DOMParser.stripBody(html:string?) → string<html>
DOMParser.stripBody ??= function stripBody(html = '') {
    return html
        .replace(/[^]*(<head\W[^]*?<\/head>)[^]*/i, '<html>$1<body></body></html>')
        .replace(/(<\w+\s+([^>]+?)>)/g, ($0, $1, $2 = '', $$, $_) => {
            let attributes = {};

            let attr = '', val = '',
                isVal = false, delim = null,
                skip = false;

            for(let char of $2) {
                if(!isVal) {
                    if(isVal = (char == '='))
                        continue;

                    attr += char;
                } else {
                    if(skip) {
                        val += char;
                        skip = false;
                        continue;
                    }

                    if(char == '\\') {
                        val += char;
                        skip = true;
                        continue;
                    }

                    if(nullish(delim)) {
                        delim = (
                            /["']/.test(char)?
                                char:
                            ' '
                        );

                        continue;
                    }

                    if(char == delim) {
                        attributes[attr.trim()] ??= `"${ val }"`;

                        isVal = false;
                        delim = null;
                        skip = false;
                        attr = '';
                        val = '';
                        continue;
                    }

                    val += char;
                }
            }

            let defaults = {
                crossorigin: 'anonymous',
            };

            for(let [name, value] of Object.entries(attributes))
                attributes[name] ??= JSON.stringify(defaults[name]);

            return $1.replace($2, Object.entries(attributes).map(([name, value]) => [name, value].join('=')).join(' '));
        });
};

// Gets meta properties by name
    // Document..get(property:string) → string|null
Document.prototype.get ??= function get(property) {
    return this.querySelector(`[name$="${ property }"i], [property$="${ property }"i], [name$="og:${ property }"i], [property$="og:${ property }"i]`)?.getAttribute('content');
};

/** Finds and returns an element based on its textual content. A shortcut for <b><code>document.getElementByText</code></b>.
 * @simply Element..getElementByText(searchText:string|regexp|array, flags:string?) → Element | null
 *
 * @param {(string|regexp|array<(string|regexp)>)} searchText   The text to search for
 * @param {string} [flags = ""]                                 Optional flags to be added to the search: <strong>i</strong> → case-insensitive; <strong>u</strong> → Unicode
 *
 * @return {Element}
 */
Element.prototype.getElementByText ??= function getElementByText(searchText, flags = '') {
    let searchType = (searchText instanceof RegExp? 'regexp': searchText instanceof Array? 'array': typeof searchText),
        UNICODE_FLAG = false;

    if(!(searchText?.length ?? searchText?.source))
        throw 'Can not search for empty text';

    let container = this,
        owner = null,
        thisIsOwner = true;
    let { innerText } = this;

    function normalize(string = '', unicode = UNICODE_FLAG) {
        return (unicode? string.normalize('NFKD'): string);
    }

    switch(searchType) {
        case 'array': {
            searching:
            for(let search of searchText)
                if(defined(owner ??= this.getElementByText(search, flags)))
                    break searching;
        } break;

        case 'regexp': {
            searchText = RegExp(searchText.source, searchText.flags || flags);
            UNICODE_FLAG = searchText.flags.contains('u');

            // Replace special characters...
            innerText = normalize(innerText);

            // See if the element contains the text...
            if(!searchText.test(innerText))
                return null;

            searching:
            while(nullish(owner)) {
                for(let child of container.children)
                    if([...child.children].filter(element => searchText.test(normalize(element.innerText))).length) {
                        // A sub-child is the text container
                        container = child;
                        thisIsOwner = false;

                        continue searching;
                    } else if(searchText.test(normalize(child.innerText))) {
                        // This is the text container
                        owner = child;
                        thisIsOwner = false;

                        break searching;
                    }

                // None of the children contain the text...
                if(thisIsOwner)
                    owner = this;
            }
        } break;

        default: {
            // Convert to a string...
            searchText += '';
            UNICODE_FLAG = flags.contains('u');

            // Replace special characters...
            innerText = normalize(innerText);

            if(flags.contains('i')) {
                // Ignore-case mode
                searchText = searchText.toLowerCase();

                // See if the element contains the text...
                if(innerText.toLowerCase().missing(searchText))
                    return null;

                searching:
                while(nullish(owner)) {
                    for(let child of container.children)
                        if([...child.children].filter(element => normalize(element.innerText).toLowerCase().contains(searchText)).length) {
                            // A sub-child is the text container
                            container = child;
                            thisIsOwner = false;

                            continue searching;
                        } else if(normalize(child.innerText).toLowerCase().contains(searchText)) {
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
                if(innerText.missing(searchText))
                    return null;

                searching:
                while(nullish(owner)) {
                    for(let child of container.children)
                        if([...child.children].filter(element => normalize(element.innerText).contains(searchText)).length) {
                            // A sub-child is the text container
                            container = child;
                            thisIsOwner = false;

                            continue searching;
                        } else if(normalize(child.innerText).contains(searchText)) {
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
        } break;
    }

    return owner;
};

/** Finds and returns multiple elements based on their textual content. A shortcut for <b><code>document.getElementsByText</code></b>.
 * @simply Element..getElementsByInnerText(searchText:string|regexp|array, flags:string?) → [Element...]
 *
 * @param {(string|regexp|array<(string|regexp)>)} searchText   The text to search for
 * @param {string} [flags = ""]                                 Optional flags to be added to the search: <strong>i</strong> → case-insensitive; <strong>u</strong> → Unicode
 *
 * @returns {Element[]}
 */
Element.prototype.getElementsByInnerText ??= function getElementsByInnerText(searchText, flags = '') {
    let searchType = (searchText instanceof RegExp? 'regexp': searchText instanceof Array? 'array': typeof searchText),
        UNICODE_FLAG = false;

    if(nullish(searchText?.length ?? searchText?.source))
        throw 'Can not search for empty text';

    let containers = [];
    let { innerText } = this;

    function normalize(string = '', unicode = UNICODE_FLAG) {
        return (unicode? string.normalize('NFKD'): string);
    }

    switch(searchType) {
        case 'array': {
            for(let search of searchText)
                containers.push(...this.getElementsByInnerText(search, flags));
        } break;

        case 'regexp': {
            searchText = RegExp(searchText.source, searchText.flags || flags);
            UNICODE_FLAG = searchText.flags.contains('u');

            // Replace special characters...
            innerText = normalize(innerText);

            // See if the element contains the text...
            if(!searchText.test(innerText))
                break;
            containers.push(this);

            let children = [...this.children],
                child;

            collecting:
            while(child = children.pop())
                if([...child.children].filter(element => searchText.test(normalize(element.innerText))).length) {
                    // A sub-child contains the text
                    containers.push(child);
                    children = [...children, ...child.children].isolate();
                } else if(searchText.test(normalize(child.innerText))) {
                    // This contains the text
                    containers.push(child);
                }
        } break;

        default: {
            // Convert to a string...
            searchText += '';
            UNICODE_FLAG = flags.contains('u');

            // Replace special characters...
            innerText = normalize(innerText);

            if(flags.contains('i')) {
                // Ignore-case mode
                searchText = searchText.toLowerCase();

                // See if the element contains the text...
                if(innerText.toLowerCase().missing(searchText))
                    break;
                containers.push(this);

                let children = [...this.children],
                    child;

                collecting:
                while(child = children.pop())
                    if([...child.children].filter(element => normalize(element.innerText).toLowerCase().contains(searchText)).length) {
                        // A sub-child contains the text
                        containers.push(child);
                        children = [...children, ...child.children].isolate();
                    } else if(normalize(child.innerText).toLowerCase().contains(searchText)) {
                        // This contains the text
                        containers.push(child);
                    }
            } else {
                // Normal (perfect-match) mode
                // See if the element contains the text...
                if(innerText.missing(searchText))
                    break;
                containers.push(this);

                let children = [...this.children],
                    child;

                collecting:
                while(child = children.pop())
                    if([...child.children].filter(element => normalize(element.innerText).contains(searchText)).length) {
                        // A sub-child contains the text
                        containers.push(child);
                        children = [...children, ...child.children].isolate();
                    } else if(normalize(child.innerText).contains(searchText)) {
                        // This contains the text
                        containers.push(child);
                    }
            }
        } break;
    }

    return containers.isolate();
};

// Gets the DOM path of an element
    // Element..getPath(length:number?<int>) → string
Element.prototype.getPath ??= function getPath(length = 0) {
    return getDOMPath(this, length);
};

// https://stackoverflow.com/a/41698614/4211612
// Determines if the element is visible to the user or not
    // Element..isVisible() → boolean
Element.prototype.isVisible ??= function isVisible() {
    // Styling...
    let style = getComputedStyle(this),
        { display = 'none', visibility = 'hidden', opacity = 0 } = style;

    if(false
        || (display.equals('none'))
        || (visibility.unlike('visible'))
        || (opacity < 0.1)
    ) return false;

    // Positioning...
    let { height, width, center, left, top, right, bottom } = getOffset(this),
        [x, y] = center,
        w = (document.documentElement.clientWidth ?? window.innerWidth ?? 0) | 0,
        h = (document.documentElement.clientHeight ?? window.innerHeight ?? 0) | 0;

    if(false
        // right-most edge off-screen
        || (x + (width / 2) < 0)
        // left-most edge off-screen
        || (x - (width / 2) > w)
        // bottom edge off-screen
        || (y + (height / 2) < 0)
        // top edge off-screen
        || (y - (height / 2) > h)
        // non-dimensional (no height, width, padding, margin, or border)
        || !(0
            + this.offsetWidth
            + this.offsetHeight
            + height
            + width
        )
    ) return false;

    return document.elementsFromPoint(x, y).contains(this);
};

/** Finds and returns an array of elements in the order they were queried.
 * @simply Element..queryBy(selectors:string|array|Element, container:Node?) → Element
 *
 * @param {(string|array|Element)} selectors    The selection criteria for the query
 * @param {Element} [container = document]      The contaier (parent) to perform the query in
 *
 * @example
 * // Example HTML
 * // html > head + body > div + div + div
 * let [div, head, html, body] = $.queryBy('div, head, html, body'); // → [HTMLDivElement, HTMLHeadElement, HTMLDocumentElement, HTMLBodyElement]
 * let [last, first] = $.queryBy('div:last-child, div'); // → [:last-child, :first-child]
 * // This guarantees that all found elements stay in their preferred query order
 */
Element.prototype.queryBy ??= function queryBy(selectors, container = document) {
	let properties = { writable: false, enumerable: false, configurable: false },
		media;

	if(selectors instanceof Element) {
		media = selectors;

		for(let key of 'first last child parent empty'.split(' '))
			if(key in media && media[key] instanceof Function)
				return media;

		Object.defineProperties(media, {
			first: {
				value: media,
				...properties
			},
			last: {
				value: media,
				...properties
			},
			child: {
				value: index => [...media.children][index - 1],
				...properties
			},
			parent: {
				value: selector => media.closest(selector),
				...properties
			},
			empty: {
				value: !media.length,
				...properties
			},
		});
	} else if(selectors instanceof Array) {
		media = selectors.map(object => container.queryBy(object));

		Object.defineProperties(media, {
			first: {
				value: media[0],
				...properties
			},
			last: {
				value: media[media.length - 1],
				...properties
			},
			child: {
				value: index => media[index - 1],
				...properties
			},
			parent: {
				value: selector => media.closest(selector),
				...properties
			},
			empty: {
				value: !media.length,
				...properties
			},
		});
	} else {
		// Helpers
		let copy  = array => [...array],
			query = (SELECTORS, CONTAINER = container) => (CONTAINER instanceof Array? CONTAINER.map(C => C.querySelectorAll(SELECTORS)) : CONTAINER.querySelectorAll(SELECTORS));

		// Get rid of enclosing syntaxes: [...] and (...)
		let regexp = /(\([^\(\)]+?\)|\[[^\[\]]+?\])/g,
			pulled = [],
			index, length;

		media = [];

		// The index shouldn't be longer than the length of the selector's string
		// Keep this to prevent infinite loops
		for(index = 0, length = selectors.length; index++ < length && regexp.test(selectors);)
			selectors = selectors.replace(regexp, ($0, $1, $$, $_) => '\b--' + pulled.push($1) + '\b');

		let order	    = selectors.split(','),
			dummy	    = copy(order),
			output	    = [],
			generations = 0,
			cousins		= 0;

		// Replace those syntaxes (they were ignored)
		for(index = 0, length = dummy.length, order = [], regexp = /[\b]--(\d+)[\b]/gi; index < length; index++)
			order.push(dummy[index].replace(regexp, ($0, $1, $$, $_) => pulled[+$1 - 1]));

		// Make sure to put the elements in order
		// Handle the :parent (pseudo) selector
		for(index = 0, length = order.length; index < length; generations = 0, cousins = 0, index++) {
			let selector = order[index], ancestor, cousin;

			selector = selector
			// siblings
				.replace(/\:nth-sibling\((\d+)\)/gi, ($0, $1, $$, $_) => (cousins += +$1, ''))
				.replace(/(\:{1,2}(next-|previous-)?sibling)/gi, ($0, $1, $2, $$, $_) => (cousins += ($2 == 'next'? 1: -1), ''))
			// parents
				.replace(/\:nth-parent\((\d+)\)/gi, ($0, $1, $$, $_) => (generations -= +$1, ''))
				.replace(/(\:{1,2}parent\b|<\s*(\s*(,|$)))/gi, ($0, $$, $_) => (--generations, ''))
				.replace(/<([^<,]+)?/gi, ($0, $1, $$, $_) => (ancestor = $1, --generations, ''))
			// miscellaneous
				.replace(/^\s+|\s+$/gi, '');

			let elements = [].slice.call(query(selector)),
				parents = [], parent,
				siblings = [], sibling;

			// Parents
			for(; generations < 0; generations++)
				elements = elements.map(element => {
					let P = element, Q = (P? P.parentElement: {}), R = (Q? Q.parentElement: {}),
						E = C => [...query(ancestor, C)],
						F, G;

					for(let I = 0, L = -generations; ancestor && !!R && !!Q && !!P && I < L; I++)
						parent = E(R).contains(Q)? Q: G;

					for(let I = 0, L = -generations; !ancestor && !!Q && !!P && I < L; I++)
						Q = (parent = P = Q).parentElement;

					if((generations === 0 || /\*$/.test(ancestor)) && parents.missing(parent))
						parents.push(parent);

					return parent;
				});

			// Siblings
			if(cousins === 0)
				/* Do nothing */;
			else if(cousins < 0)
				for(; cousins < 0; cousins++)
					elements = elements.map(element => {
						let P = element, Q = (P? P.previousElementSibling: {}),
							F, G;

						for(let I = 0, L = -cousins; !!Q && !!P && I < L; I++)
							Q = (sibling = P = Q).previousElementSibling;

						if(cousins === 0 && siblings.missing(sibling))
							siblings.push(sibling);

						return sibling;
					});
			else
				for(; cousins > 0; cousins--)
					elements = elements.map(element => {
						let P = element, Q = (P? P.nextElementSibling: {}),
							F, G;

						for(let I = 0, L = -cousins; !!Q && !!P && I > L; I--)
							Q = (sibling = P = Q).nextElementSibling;

						if(cousins === 0 && siblings.missing(sibling))
							siblings.push(sibling);

						return sibling;
					});

			media.push(parents.length? parents: elements);
			media.push(siblings.length? siblings: elements);
			order.splice(index, 1, selector);
		}

		// Create a continuous array from the sub-arrays
		for(index = 1, length = media.length; index < length; index++)
			media.splice(0, 1, copy(media[0]).concat( copy(media[index]) ));
		output = [].slice.call(media[0]).filter( value => value );

		// Remove repeats
		for(index = 0, length = output.length, media = []; index < length; index++)
			if(media.missing(output[index]))
				media.push(output[index]);

		Object.defineProperties(media, {
			first: {
				value: media[0],
				...properties
			},
			last: {
				value: media[media.length - 1],
				...properties
			},
			child: {
				value: index => media[index - 1],
				...properties
			},
			parent: {
				value: selector => media.closest(selector),
				...properties
			},
			empty: {
				value: !media.length,
				...properties
			},
		});
	}

	return media;
};

// Modifies an attribute (combines get + set)
    // Element..modAttribute(attribute:string, value:any?) → undefined
Element.prototype.modAttribute ??= function modAttribute(attribute, value = '') {
    this.setAttribute(attribute, [this.getAttribute(attribute), value].join(''));
}

// Modifies an element's style attribute
    // Element..modStyle(value:string?, important:boolean?, deleted:boolean?, innate:boolean?) → undefined
Element.prototype.modStyle ??= function modStyle(value = '', important = false, deleted = false, innate = false) {
    let _old = this.modStyle.destruct(this.getAttribute('style')),
        _new = this.modStyle.destruct(value);

    let final = [], innated = [];
    for(let [property, _o] of _old) {
        let _n = _new.get(property);

        if((_n?.value === 0) || (defined(_n) && (_n.deleted || deleted))) {
            continue;
        } else if(defined(_n) && +_o.important <= +(_n.important || important)) {
            let declaration = [property,_n.value].join(':') + (_n.important || important? '!important': '');

            final.push(declaration);

            if(_n.innate || innate)
                innated.push(declaration);
        } else {
            let declaration = [property,_o.value].join(':') + (_o.important? '!important': '');

            final.push(declaration);
        }

        _new.delete(property);
    }

    for(let [property, _n] of _new) {
        let declaration = [property,_n.value].join(':') + (_n.important || important? '!important': '');

        final.push(declaration);

        if(_n.innate || innate)
            innated.push(declaration);
    }

    this.setAttribute('style', final.join(';'));

    innation: if(innated.length) {
        let parent = this.parentElement;
        let uuid = new UUID().value;

        function inn(innated) {
            let parent = this.parentElement;

            this.setAttribute('innated-style', innated.join(';'));

            let interval = setInterval(parent => {
                $.all('[innated-style]', parent).map(child => parent.modStyle(child.getAttribute('innated-style')));
            }, 100, parent);

            when(([parent, interval]) => (defined(parent?.attributes?.style?.value)? [parent, interval]: false), 50, [parent, interval]).then(([parent, interval]) => {
                clearInterval(interval);

                $.all('[innated-style]', parent).map(child => {
                    child.removeAttribute('innated-style');
                    child.removeAttribute('innated-uuid');
                });
            });
        }

        this.setAttribute('innated-uuid', uuid);

        if(nullish(parent))
            when(([uuid, innated]) => {
                let self = $(`[innated-uuid="${ uuid }"i]`);

                return defined(self.parentElement)? [self, innated]: false
            }, 50, [uuid, innated]).then(([self, innated]) => inn.call(self, innated));
        else
            inn.call(this, innated);
    }
}

Object.defineProperties(Element.prototype.modStyle, {
    destruct: {
        value(string) {
            let css = new Map;

            (string || '')
                .split(';')
                .map(declaration => declaration.trim())
                .filter(declaration => declaration.length > 4)
                    // Shortest possible declaration → `--n:0`
                .map(declaration => {
                    let [property, value = ''] = declaration.split(/^([^:]+):/).filter(string => string.length).map(string => string.trim()),
                        important = value.toLowerCase().contains('!important'),
                        deleted = value.toLowerCase().contains('!delete'),
                        innate = value.toLowerCase().contains('!innate');

                    value = value.replace(/!(important|delete|innate)\b/gi, '');

                    css.set(property, { value, important, deleted, innate });
                });

            return css;
        }
    },
});

// Simply gives back the attributes of the elemenet
    // Element..attr
try {
    Object.defineProperties(Element.prototype, {
        attr: {
            get() {
                return this[Symbol.toPrimitive] ??= new Proxy(this.attributes, {
                    get(real, key) {
                        return real.getNamedItem(key.replace(/[A-Z]/g, $0 => '-' + $0.toLowerCase()))?.value ?? null;
                    },

                    set(real, key, value) {
                        key = key.replace(/[A-Z]/g, $0 => '-' + $0.toLowerCase());

                        let node;
                        if(!real.hasOwnProperty(key))
                            node = document.createAttribute(key);
                        else
                            node = real.getNamedItem(key);

                        node.value = value;
                        real.setNamedItem(node);

                        return value;
                    },

                    ownKeys(real) {
                        return Object.keys(real);
                    },

                    has(real, key) {
                        return real.getNamedItem(key.replace(/[A-Z]/g, $0 => '-' + $0.toLowerCase())) != null;
                    },

                    defineProperty(real, key, descriptor) {
                        if('value' in descriptor) {
                            key = key.replace(/[A-Z]/g, $0 => '-' + $0.toLowerCase());

                            let node;
                            if(!real.hasOwnProperty(key))
                                node = document.createAttribute(key);
                            else
                                node = real.getNamedItem(key);

                            node.value = descriptor.value;
                            real.setNamedItem(node);

                            return true;
                        }

                        return false;
                    },

                    deleteProperty(real, key) {
                        return real.removeNamedItem(key.replace(/[A-Z]/g, $0 => '-' + $0.toLowerCase()));
                    },
                });
            },
        },
    });

    // https://github.com/MaxArt2501/base64-js
    Object.defineProperties(top, {
        "atоb": {
            get() {
                return (function atob(string) {
                    string = String(string).replace(/[\t\n\f\r ]+/g, "");

                    if(!this.regexp.test(string))
                        throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");

                    string += "==".slice(2 - (string.length & 3));

                    let bm, r1, r2,
                        i = 0, R = "",
                        k = this.key;

                    for(; i< string.length;) {
                        bm = k.indexOf(string.charAt(i++)) << 18
                            | k.indexOf(string.charAt(i++)) << 12
                            | (r1 = k.indexOf(string.charAt(i++))) << 6
                            | (r2 = k.indexOf(string.charAt(i++)))

                        R += r1 == 64?
                            String.fromCharCode(bm >> 16 & 255):
                        r2 == 64?
                            String.fromCharCode(bm >> 16 & 255, bm >> 8 & 255):
                        String.fromCharCode(bm >> 16 & 255, bm >> 8 & 255, bm & 255);
                    }

                    return R.replace(/\0+$/, '');
                }).bind({
                    key: top['atob']("RExOR0NTUU9YSDRJeEFKamJrVUVadmVnekJ3RllXdXlSNXBNY0ttMnRUK1ZuZHJpZmxQOThocW82cy8wN2ExMw"),
                    regexp: /^(?:[A-Z\d+\/\=]{4})*?(?:[A-Z\d+\/]{2}(?:==)?|[A-Z\d+\/]{3}=?)?$/i,
                });
            }
        },

        "btоa": {
            get() {
                return (function btoa(string) {
                    string = String(string);

                    let bm, a, b, c,
                        R = "", i = 0,
                        r = string.length % 3,
                        k = this.key;

                    for(; i < string.length;) {
                        if(false
                            || (a = string.charCodeAt(i++)) > 255
                            || (b = string.charCodeAt(i++)) > 255
                            || (c = string.charCodeAt(i++)) > 255
                        ) throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");

                        bm = (a << 16) | (b << 8) | c;
                        R += k.charAt(bm >> 18 & 63)
                            + k.charAt(bm >> 12 & 63)
                            + k.charAt(bm >> 6 & 63)
                            + k.charAt(bm & 63);
                    }

                    return R;
                }).bind({
                    key: top['atob']("RExOR0NTUU9YSDRJeEFKamJrVUVadmVnekJ3RllXdXlSNXBNY0ttMnRUK1ZuZHJpZmxQOThocW82cy8wN2ExMw"),
                });
            }
        },
    });
} catch(error) {/* Do nothing */}

// Returns a function's name as a formatted title
    // Function..toTitle() → string
Function.prototype.toTitle ??= function toTitle() {
    return (this?.name || '')
        .replace(/\$\$/g, ' | ')
        .replace(/\$/g, '/')
        .replace(/__/g, ' - ')
        .replace(/_/g, ' ')
        .trim();
};

// Returns a string as a formatted title
    // String..toTitle() → string
String.prototype.toTitle ??= function toTitle() {
    return this
        .replace(/\$\$/g, ' | ')
        .replace(/\$/g, '/')
        .replace(/__/g, ' - ')
        .replace(/_/g, ' ')
        .trim();
};

// Counts the number of elements in the string
    // String..count(...searches:string) → number<integer>
String.prototype.count ??= function count(...searches) {
    let count = 0;
    for(let search of searches)
        count += this.split(search).length - 1;
    return count;
};

// Compares strings (space dependent)
    // String..equals(value:any, caseSensitive:boolean?) → boolean
String.prototype.equals ??= function equals(value = '', caseSensitive = false) {
    value = value?.toString() || '';

    if(!caseSensitive)
        return this.normalize('NFKD').trim().toLowerCase() == value.normalize('NFKD').trim().toLowerCase();
    return this.normalize('NFKD').trim() == value.normalize('NFKD').trim();
};

// Compares strings (space dependent)
    // String..unlike(value:any, caseSensitive:boolean?) → boolean
String.prototype.unlike ??= function unlike(value, caseSensitive = false) {
    return !this.equals(value, caseSensitive);
};

// Replaces text in the string
    // String..replaceAll(search:any, replacer:string|function) → string
String.prototype.replaceAll ??= function replaceAll(search, replacer) {
    let before = this,
        after = before.replace(search, replacer);

    if(after.unlike(before))
        return after.replaceAll(search, replacer);
    return after;
};

// Replaces spaces in the string
    // String..sheer() → string
String.prototype.sheer ??= function sheer() {
    return this.replace(/\s+/g, '');
};

// Removess spaces and makes the string all lowercase
    // String..mutilate(normalize:boolean?) → string
String.prototype.mutilate ??= function mutilate(normalize = false) {
    let results = this.sheer().toLowerCase();

    if(parseBool(normalize))
        results = results.normalize('NFKD');

    return results;
};

// Matches two strings and returns a comparison of how much text matched
    // String..errs(string:string, positionDependent:boolean?) → number<float>
String.prototype.errs ??= function errs(string, positionDependent = false) {
    let [B, A] = [this, string?.toString() || ''].map(s => s.sheer().normalize('NFKD').toLowerCase()).sort((a, b) => a.length - b.length),
        C = '';

    if(positionDependent) {
        for(let i = 0, l = Math.min(A.length, B.length); i < l; ++i)
            if(A[i] == B[i])
                C += A[i];
    } else {
        for(let char of A)
            if(B.contains(char)) {
                C += char;
                B.replace(char, '');
            }
    }

    return 1 - C.length / A.length
};

// Compares strings - Calculates the Levenshtein's distance between two strings
    // String..distanceFrom(that:any) → number<integer>
String.prototype.distanceFrom ??= function distanceFrom(that = '') {
    let A = this,
        B = that?.toString?.() || '';

    let a = A.length,
        b = B.length;

    let track = Array(b + 1).fill(null).map(() => Array(a + 1).fill(null));

    for(let i = 0; i <= a; ++i)
        track[0][i] = i;

    for(let j = 0; j <= b; ++j)
        track[j][0] = j;

    for(let j = 1; j <= b; ++j)
        for(let i = 1; i <= a; ++i)
            track[j][i] = Math.min(
                // Deletion
                track[j][i - 1] + 1,

                // Insertion
                track[j - 1][i] + 1,

                // Substitution
                track[j - 1][i - 1] + +(A[i - 1] !== B[j - 1]),
            );

    return track[b][a];
};

// Add Array methods to HTMLCollection
HTMLCollection.prototype.contains       ??= Array.prototype.contains;
HTMLCollection.prototype.at             ??= Array.prototype.at;
HTMLCollection.prototype.concat         ??= Array.prototype.concat;
HTMLCollection.prototype.copyWithin     ??= Array.prototype.copyWithin;
HTMLCollection.prototype.entries        ??= Array.prototype.entries;
HTMLCollection.prototype.every          ??= Array.prototype.every;
HTMLCollection.prototype.fill           ??= Array.prototype.fill;
HTMLCollection.prototype.filter         ??= Array.prototype.filter;
HTMLCollection.prototype.find           ??= Array.prototype.find;
HTMLCollection.prototype.findIndex      ??= Array.prototype.findIndex;
HTMLCollection.prototype.findLast       ??= Array.prototype.findLast;
HTMLCollection.prototype.findLastIndex  ??= Array.prototype.findLastIndex;
HTMLCollection.prototype.flat           ??= Array.prototype.flat;
HTMLCollection.prototype.flatMap        ??= Array.prototype.flatMap;
HTMLCollection.prototype.forEach        ??= Array.prototype.forEach;
HTMLCollection.prototype.includes       ??= Array.prototype.includes;
HTMLCollection.prototype.indexOf        ??= Array.prototype.indexOf;
HTMLCollection.prototype.join           ??= Array.prototype.join;
HTMLCollection.prototype.keys           ??= Array.prototype.keys;
HTMLCollection.prototype.lastIndexOf    ??= Array.prototype.lastIndexOf;
HTMLCollection.prototype.map            ??= Array.prototype.map;
HTMLCollection.prototype.pop            ??= Array.prototype.pop;
HTMLCollection.prototype.push           ??= Array.prototype.push;
HTMLCollection.prototype.reduce         ??= Array.prototype.reduce;
HTMLCollection.prototype.reduceRight    ??= Array.prototype.reduceRight;
HTMLCollection.prototype.reverse        ??= Array.prototype.reverse;
HTMLCollection.prototype.shift          ??= Array.prototype.shift;
HTMLCollection.prototype.slice          ??= Array.prototype.slice;
HTMLCollection.prototype.some           ??= Array.prototype.some;
HTMLCollection.prototype.sort           ??= Array.prototype.sort;
HTMLCollection.prototype.splice         ??= Array.prototype.splice;
HTMLCollection.prototype.unshift        ??= Array.prototype.unshift;
HTMLCollection.prototype.values         ??= Array.prototype.values;

// https://learnersbucket.com/examples/interview/promise-any-polyfill/
// Resovles to a non-empty Promise
    // Promise.anySettled(promises:Promise[]) → Promise
Promise.anySettled = function anySettled(promises) {
    let errors = new Array(promises.length);
    let errd = 0;

    return new Promise((resolve, reject) => {
        promises.map((promise, index) => {
            Promise.resolve(promise)
                // Resolve the promise to a non-empty value
                .then(result => {
                    if(nullish(result))
                        throw result;
                    resolve(result);
                })
                // Reject the value, immediately
                .catch(error => {
                    errors[index] = error;

                    // All promises rejected; reject parent
                    if(++errd == promises.length)
                        reject(errors);
                });
        });
    });
};

// https://stackoverflow.com/a/35859991/4211612
// Captures the current frame from a video element
    // HTMLVideoElement..captureFrame(imageType:string?, returnType:string?) → string<dataURL> | object | HTMLImageElement
        // imageType = "image/jpeg" | "image/png" | "image/webp"
        // returnType = "img" | "element" | "HTMLImageElement"
            // → HTMLImageElement
        // returnType = "json" | "object"
            // → Object<{ type=imageType, data:string, height:number<integer>, width:number<integer> }>
        // returnType = "dataURI" | "dataURL" | ...
            // → string<dataURL>
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

// Records a video element
    // new Recording(video:HTMLVideoElement|HTMLAudioElement|HTMLCanvasElement, options:object?) → Promise
class Recording {
    static __BLOBS__ = new Map;
    static __LINKS__ = new Map;
    static __RECORDERS__ = new Map;

    static ANY = Symbol('Any');
    static ALL = Symbol('All');

    static #statusUpdater = setInterval(() => {
        let active = false;
        for(let [guid, recorder] of Recording.__RECORDERS__)
            if(active ||= recorder.state.equals("recording"))
                break;

        $('[data-a-player-state]')?.setAttribute('data-recording-status', active);
    }, 1_000);

    constructor(streamable, options = { name: 'DEFAULT_RECORDING', as: new ClipName, maxTime: Infinity, mimeType: 'video/webm;codecs=vp9', hidden: false, chunksPerSecond: 1 }) {
        if(['HTMLVideoElement', 'HTMLAudioElement', 'HTMLCanvasElement'].missing(streamable?.constructor?.name))
            throw `new Recording(...) must be called on a streamable element: <video>, <audio>, or <canvas>`;

        const configurable = false, writable = false, enumerable = false;

        let { name = 'DEFAULT_RECORDING', as = new ClipName, maxTime = Infinity, mimeType = 'video/webm;codecs=vp9', hidden = false, chunksPerSecond = 1 } = options;
        let guid = `${ name } [${ (new UUID).toStamp() }]`;
        let uuid = UUID.from(guid).value;

        for(let key of ['name', 'key', 'hidden', 'maxTime', 'chunksPerSecond'])
            delete options[key];

        let recorder = new MediaRecorder(streamable.captureStream(), options);
        let blobs = new Array;

        let controller = new AbortController;
        let { signal } = controller;

        streamable.recorders ??= new Map;
        streamable.recorders.set(name, recorder);

        Object.defineProperties(recorder, {
            controller: { value: controller, configurable, writable, enumerable },

            name: { value: name, configurable, writable },
            data: {
                get() {
                    return this.blobs.slice(this.slice);
                },

                set(value) {
                    return this.blobs.slice(this.slice = value);
                },
            },

            guid: { value: guid, configurable, writable },
            uuid: { value: uuid, configurable, writable },
            blobs: { value: blobs },
            slice: { value: blobs.length },
            hidden: { value: hidden, configurable, writable },
            source: { value: streamable, configurable, writable },
            creationTime: { value: +new Date, configurable, writable },
            recordingLength: {
                get() {
                    return (new Date) - this.blobs.creationTime;
                },

                set(value) {
                    return new Date(value) - this.blobs.creationTime;
                },
            },
        });

        Object.defineProperties(blobs, {
            controller: { value: controller, configurable, writable, enumerable },

            name: { value: name, configurable, writable },

            guid: { value: guid, configurable, writable },
            uuid: { value: uuid, configurable, writable },
            hidden: { value: hidden, configurable, writable },
            source: { value: streamable, configurable, writable },
            creationTime: { value: +new Date, configurable, writable },
            recordingLength: {
                get() {
                    return (new Date) - this.creationTime;
                },

                set(value) {
                    return new Date(value) - this.creationTime;
                },
            },
        });

        Recording.__RECORDERS__.set(guid, recorder);
        Recording.__BLOBS__.set(guid, blobs);

        // Actually record the data...
        recorder.ondataavailable = (async function(event) {
            this.mimeType ??= recorder.mimeType;

            Recording.__BLOBS__.get(event.target.guid).push(event.data);
        }).bind(streamable);

        // Chunks per second: 1k → 1cps | 42 → 24cps | 33 → 30cps | 17 → 60cps
        when(streamable => streamable.videoTracks?.length, 100, streamable)
            .then(length => {
                recorder.start((1000 / chunksPerSecond).round().clamp(1, 1000));
                streamable.closest('[data-a-player-state]')?.setAttribute('data-recording-status', !hidden);
            });

        // Define stopping conditions
        // HALT
        let halted = new Promise((resolve, reject) => {
            recorder.onstop =
                event => resolve(event);

            recorder.onerror =
            signal.onabort =
                event => reject(event);
        });

        // STOP
        let stopped;

        if(Number.isFinite(maxTime))
            stopped = wait(maxTime, recorder).then(recorder => recorder.stop());
        else
            stopped = when(() => top.WINDOW_STATE == "unloading").then(unloading => recorder.stop());

        // ABORT
        let aborted = when(() => recorder.controller.signal.aborted).then(aborted => recorder.stop());

        // Return the object
        let self = Promise.anySettled([halted, stopped, aborted]);

        Object.defineProperties(recorder, {
            recording: { value: self },
        });

        Object.defineProperties(blobs, {
            recording: { value: self },
        });

        Object.defineProperties(self, {
            controller: { value: controller, configurable, writable, enumerable },

            name: { value: name, configurable, writable },
            as: { value: as, configurable, writable },

            guid: { value: guid, configurable, writable },
            uuid: { value: uuid, configurable, writable },
            blobs: { value: blobs },
            hidden: { value: hidden, configurable, writable },
            source: { value: streamable, configurable, writable },
            recorder: { value: recorder, configurable, writable },
            creationTime: { value: +new Date, configurable, writable },
            completionTime: { value: null, configurable, writable: true },

            pause: {
                value(resumeAfter = Infinity) {
                    this.recorder.pause();

                    if(Number.isFinite(resumeAfter))
                        wait(resumeAfter, this.recorder).then(recorder => recorder.resume());

                    return this;
                },

                configurable, writable
            },

            resume: {
                value() {
                    this.recorder.resume();

                    return this;
                },

                configurable, writable
            },

            stop: {
                value() {
                    let recorder = this.recorder,
                        source = this.source ?? recorder?.source,
                        stream = this.stream ?? recorder?.stream,
                        signal = this.controller?.signal;

                    if(nullish(stream))
                        throw `The stream is unavailable`;

                    try {
                        recorder.stop();

                        for(let track of stream.getTracks())
                            track.stop();
                    } catch(error) {
                        // MediaRecorder probably inactive
                    }

                    source.recorders.delete(this.name);
                    source.recorders.set(`[[${ this.name }]]`, this);

                    this.completionTime ??= +new Date;

                    Object.freeze(this);
                    Object.freeze(recorder);

                    return this;
                },

                configurable, writable
            },

            save: {
                value(as = null) {
                    let recorder = this.recorder,
                        source = recorder.source,
                        blobs = this.blobs ?? recorder?.blobs,
                        signal = recorder.controller?.signal;

                    if(signal?.aborted)
                        return signal;

                    as ??= this.as ?? new ClipName;

                    // NOTICE(`Saving recording (Recording.save): "${ as }"`, { recorder, source, blobs, signal, download: [as, MIME_Types.find(source.mimeType)] });

                    if(Recording.__LINKS__.has(this.guid))
                        return Recording.__LINKS__.get(this.guid);

                    let chunks = blobs ?? [];

                    if(chunks.length < 1)
                        throw `Unable to save clip. No recording data available.`;

                    let blob = new Blob(chunks, { type: chunks[0].type });
                    let link = furnish('a', { href: URL.createObjectURL(blob), download: [as, MIME_Types.find(source.mimeType)].join('.') }, as);

                    link.click();

                    Recording.__LINKS__.set(this.guid, link);

                    return link;
                },

                configurable, writable
            },
        });

        return Object.assign(self, this);
    }
}

// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element
// Records a video element
    // HTMLVideoElement..startRecording(options:object?<{ name:string, maxTime:number<integer>, mimeType:string, audioBitsPerSecond:number<integer>, bitsPerSecond:number<integer>, chunksPerSecond:number<integer>, videoBitsPerSecond:number<integer> }>) → Promise
HTMLVideoElement.prototype.startRecording ??= function startRecording(options = { name: 'DEFAULT_RECORDING', maxTime: Infinity, mimeType: 'video/webm;codecs=vp9', hidden: false, chunksPerSecond: 1 }) {
    return new Recording(this, options);
};

// Gets a recording of a video element
    // HTMLVideoElement..getRecording(key:string?) → MediaRecorder
HTMLVideoElement.prototype.getRecording ??= function getRecording(key = 'DEFAULT_RECORDING') {
    this.recorders ??= new Map;

    if(key == Recording.ANY)
        for(let [key, recorder] of this.recorders)
            if(defined(recorder.recording) && nullish(recorder.recording.completionTime))
                return recorder;

    if(key == Recording.ALL)
        return this.recorders;

    return this.recorders.get(key);
};

// Determines if there is a recording of a video element
    // HTMLVideoElement..hasRecording(key:string?) → boolean
HTMLVideoElement.prototype.hasRecording ??= function hasRecording(key = 'DEFAULT_RECORDING') {
    this.recorders ??= new Map;

    if(key == Recording.ANY) {
        for(let [key, recorder] of this.recorders)
            if(defined(recorder.recording) && nullish(recorder.recording.completionTime))
                return true;
        return false;
    }

    return this.recorders.has(key);
};

// Removes a recording of a video element
    // HTMLVideoElement..removeRecording(key:string?) → HTMLVideoElement
HTMLVideoElement.prototype.removeRecording ??= function removeRecording(key = 'DEFAULT_RECORDING') {
    this.recorders ??= new Map;

    if(key == Recording.ALL)
        for(let [key, recorder] of this.recorders)
            this.recorders.delete(key);
    else
        this.recorders.delete(key);

    return this;
};

// Pauses a recording of a video element
    // HTMLVideoElement..pauseRecording(key:string?) → HTMLVideoElement
HTMLVideoElement.prototype.pauseRecording ??= function pauseRecording(key = 'DEFAULT_RECORDING') {
    if(key == Recording.ALL) {
        for(let [key, recorder] of this.recorders)
            if(nullish(recorder.recording.completionTime))
                recorder.recording.pause();
    } else {
        this.getRecording(key)?.pause();
    }

    return this;
};

// Resumes a recording of a video element
    // HTMLVideoElement..resumeRecording(key:string?) → HTMLVideoElement
HTMLVideoElement.prototype.resumeRecording ??= function resumeRecording(key = 'DEFAULT_RECORDING') {
    if(key == Recording.ALL) {
        for(let [key, recorder] of this.recorders)
            if(nullish(recorder.recording.completionTime))
                recorder.recording.resume();
    } else {
        this.getRecording(key)?.resume();
    }

    return this;
};

// Cancels a recording of a video element
    // HTMLVideoElement..cancelRecording(key:string?) → HTMLVideoElement
HTMLVideoElement.prototype.cancelRecording ??= function cancelRecording(key = 'DEFAULT_RECORDING', reason = 'Canceled') {
    if(key == Recording.ALL) {
        for(let [key, recorder] of this.recorders)
            if(nullish(recorder.recording.completionTime))
                recorder.recording.controller.abort(reason);
    } else {
        this.getRecording(key)?.controller?.abort(reason);
    }

    return this;
};

// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element
// Stops recording a video element
    // HTMLVideoElement..stopRecording(key:string?) → HTMLVideoElement
HTMLVideoElement.prototype.stopRecording ??= function stopRecording(key = 'DEFAULT_RECORDING') {
    if(key == Recording.ALL) {
        for(let [key, recorder] of this.recorders)
            if(nullish(recorder.recording.completionTime))
                recorder.recording.stop();
    } else {
        this.getRecording(key)?.stop();
    }

    return this;
};

// Saves a video element recording
    // HTMLVideoElement..saveRecording(key:string?, name:string?) → HTMLAnchorElement | HTMLAnchorElement[]
HTMLVideoElement.prototype.saveRecording ??= function saveRecording(key = null, name = null) {
    key ??= 'DEFAULT_RECORDING';

    let saves = [], count = 0;

    if(key == Recording.ALL)
        for(let [key, recorder] of this.recorders)
            saves.push(recorder.recording.save(count++? `${ name } (${ count })`: name ??= new ClipName));
    else
        return this.getRecording(key)?.recording?.save(name);

    return saves;
};

// Returns the confidence level of the machine's ability to play the specified media type
    // HTMLVideoElement..supports(MIMEType:string?) → number<{ 0 | 0.5 | 1 }>
HTMLVideoElement.prototype.supports ??= function supports(MIMEType = '') {
    return (this.canPlayType(MIMEType).length / 6).floorToNearest(0.5);
}

// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write#example_of_copying_canvas_contents_to_the_clipboard
// Copies the current frame from a video element to the clipboard
    // HTMLVideoElement..copyFrame() → Promise<boolean>
HTMLVideoElement.prototype.copyFrame ??= function copyFrame() {
    let { height, width, videoHeight, videoWidth } = this;

    let canvas = furnish('canvas', { height: height ||= videoHeight, width: width ||= videoWidth }),
        context = canvas.getContext('2d');

    context.drawImage(this, 0, 0);

    let promise = new Promise((resolve, reject) =>
        canvas.toBlob(blob =>
            navigator.clipboard
                .write([ new ClipboardItem({ [blob?.type ?? 'image/png']: blob }) ])
                .then(resolve)
                .catch(reject)
                .finally(() => canvas?.remove())
        )
    );

    return promise;
};

// Copies the current image to the clipboard
    // HTMLImageElement..copy() → Promise<boolean>
    // HTMLPictureElement..copy() → Promise<boolean>
HTMLImageElement.prototype.copy =
HTMLPictureElement.prototype.copy ??= function copy() {
    let { naturalHeight, naturalWidth } = this;
    let canvas = furnish('canvas', { height: naturalHeight, width: naturalWidth }),
        context = canvas.getContext('2d');

    let copy = new Image;

    copy.crossOrigin = "anonymous";
    copy.alt = this.alt;
    copy.src = this.src;

    let promise = new Promise((resolve, reject) => {
        copy.addEventListener('load', event => {
            context.drawImage(copy, 0, 0);

            canvas.toBlob(blob =>
                navigator.clipboard
                    .write([ new ClipboardItem({ [blob?.type]: blob }) ])
                    .then(resolve)
                    .catch(reject)
                    .finally(() => {
                        copy?.remove();
                        canvas?.remove();
                    })
            );
        });
    });

    return promise;
};

// Returns a promises status
    // https://stackoverflow.com/a/35820220/4211612
Promise.prototype.status ??= function status() {
    let pending = Symbol(Promise.PENDING);

    return Promise.race([this, pending]).then(response => response === pending? Promise.PENDING: Promise.FULFILLED, () => Promise.REJECTED);
};

Object.defineProperties(Promise, {
    PENDING: { value: 'pending' },
    FULFILLED: { value: 'fulfilled' },
    REJECTED: { value: 'rejected' },
});

// https://stackoverflow.com/a/45205645/4211612
// Creates a CSS object that can be used to easily transform an object to a CSS string, JSON, or object
    // new CSSObject({ ...css-properties }, important:boolean?) → Object<CSSObject>
class CSSObject {
    constructor(properties = {}, important = false) {
        switch (typeof properties) {
            case 'string': {
                let destructed = CSSObject.destruct(properties);

                properties = {};
                for(let [key, { value, important, deleted }] of destructed)
                    properties[key] = (deleted? 'initial': value) + (important || deleted? '!important': '');
            } break;
        }

        return Object.assign(this, { ...properties, '!important': important });
    }

    static destruct(string) {
        let css = new Map;

        (string || '')
            .split(';')
            .map(declaration => declaration.trim())
            .filter(declaration => declaration.length > 4)
                // Shortest possible declaration → `--n:0`
            .map(declaration => {
                let [property, value = ''] = declaration.split(/^([^:]+):/).filter(string => string.length).map(string => string.trim()),
                    important = value.toLowerCase().endsWith('!important'),
                    deleted = value.toLowerCase().endsWith('!delete');

                value = value.replace(/!(important|delete)\b/i, '');

                css.set(property, { value, important, deleted });
            });

        return css;
    }

    toRule(selector = '*', vendors, stylized = false) {
        return `${ selector } {${ this.toString(vendors, stylized).replace(/^|$/g, $0 => stylized? '\n': '') }}`;
    }

    toJSON(vendors, replacer = null, spaces = '') {
        return JSON.stringify(this.toObject(vendors), replacer, spaces);
    }

    toString(vendors, stylized = false) {
        let $important = this['!important'] ?? false,
            $delete = this['!delete'] ?? false;

        for(let key of ['!important', '!delete'])
            delete this[key];

        if(stylized) {
            let partitions = [
                ['Meta', 'container-* counter-* user-* view-* will-change writing-*'],
                ['Animation', 'animation-* transition-*'],
                ['Content', 'accent-* all break-* caret-* content-*'],
                ['Appearance', 'appearance backdrop-* backface-* background-* break-* border-* box-* clear color-* contain-* cursor direction display filter font forced-* hanging-* hyphenate-* hyphens image-* initial-* justify-* letter-* line-* mask-* math-* mix-blend-mode opacity outline-* overflow-* overscroll-* page-* paint-* pointer-* print-* quotes text-* touch-* visibility white-space word-*'],
                ['Position', 'align-* bottom break-* clear flex-* float grid-* inset-* isolation left margin-* masonry-* object-* offset-* order orphans padding-* perspective-* place-* position right rotate ruby-* scroll-* scrollbar-* top transform-* translate vertical-* widows z-index'],
                ['Size', 'aspect-ratio block-size height inline-* max-* min-* resize scale shape-* width zoom'],
                ['List', 'list-*'],
                ['Table', 'caption-* column-* columns empty-cells gap row-gap tab-size table-*'],
            ].map(([partition, subjects]) => [partition, subjects.split(/\s+/).map(subject => RegExp('^(-\\w+-|-{2,})?' + subject.replace('-*', '(-[\\w-]+)?')))]);

            return Object.entries(this.toObject(vendors)).map(([property, value]) => {
                property = property.replace(/[A-Z]/g, $0 => '-' + $0.toLowerCase());

                let position = partitions.length;

                search: for(let index = 0; index < partitions.length; ++index) {
                    let [partition, subjects] = partitions[index];

                    for(let subject of subjects)
                        if(subject.test(property)) {
                            position = index;
                            break search;
                        }
                }

                return [position, `\t${ property }: ${ ($delete? 'initial': value) }${ ($important || $delete)? ' !important': '' };`];
            })
            // Alphabetical sort
            .sort(([,A], [,B]) => {
                let C = [A, B].sort();

                return C.indexOf(A) - C.indexOf(B);
            })
            // Property-class sort
            .sort(([A], [B]) => A - B)
            // Property-class separation
            .map(([position, declaration], index, array) => (position != array[index + 1]?.[0])? declaration + '\n': declaration)
            .join('\n');
        } else {
            return Object.entries(this.toObject(vendors)).map(([property, value]) => {
                property = property.replace(/[A-Z]/g, $0 => '-' + $0.toLowerCase());

                return [property, `${ ($delete? 'initial': value) }${ ($important || $delete? '!important': '') }`].join(':');
            })
            .join(';');
        }
    }

    toObject(vendors = []) {
        let object = {};

        if(vendors.equals?.('all'))
            vendors = 'ms moz o webkit khtml';
        if(typeof vendors == 'string')
            vendors = vendors.split(/[^\w-]+/).filter(string => string.length);

        let $delete = this['!delete'] ?? false,
            $important = this['!important'] || $delete;

        for(let key of ['!important', '!delete'])
            delete this[key];

        $important = ($important? '!important': '');
        $delete = ($delete? 'initial': '');

        for(let key in this) {
            let properKey = key.replace(/[A-Z]/g, $0 => '-' + $0.toLowerCase());

            this[key] = $delete || this[key];

            for(let vendor of vendors)
                switch(vendor.toLowerCase().replace(/^-+|-+$/g, '')) {
                    case 'ms':
                    case 'microsoft':
                    case 'internet-explorer':
                    case 'edge': {
                        let keys = ["animation", "animation-delay", "animation-direction", "animation-duration", "animation-fill-mode", "animation-iteration-count", "animation-name", "animation-play-state", "animation-timing-function", "backface-visibility", "background", "background-image", "border-bottom-left-radius", "border-bottom-right-radius", "border-image", "border-radius", "border-top-left-radius", "border-top-right-radius", "content", "list-style", "list-style-image", "mask", "mask-image", "transform-style", "transition", "transition-delay", "transition-duration", "transition-property", "transition-timing-function"];

                        if(keys.contains(properKey))
                            object[`-ms-${ properKey }`] = this[key] + $important;
                    } break;

                    case 'moz':
                    case 'gecko':
                    case 'mozilla':
                    case 'firefox': {
                        let keys = ["animation", "animation-delay", "animation-direction", "animation-duration", "animation-fill-mode", "animation-iteration-count", "animation-name", "animation-play-state", "animation-timing-function", "appearance", "backface-visibility", "background-clip", "background-inline-policy", "background-origin", "background-size", "border-end", "border-end-color", "border-end-style", "border-end-width", "border-image", "border-start", "border-start-color", "border-start-style", "border-start-width", "box-align", "box-direction", "box-flex", "box-ordinal-group", "box-orient", "box-pack", "box-sizing", "column-count", "column-fill", "column-gap", "column-rule", "column-rule-color", "column-rule-style", "column-rule-width", "column-width", "float-edge", "font-feature-settings", "font-language-override", "force-broken-image-icon", "hyphens", "image-region", "margin-end", "margin-start", "opacity", "orient", "osx-font-smoothing", "outline", "outline-color", "outline-offset", "outline-style", "outline-width", "padding-end", "padding-start", "perspective", "perspective-origin", "tab-size", "text-align-last", "text-decoration-color", "text-decoration-line", "text-decoration-style", "text-size-adjust", "transform", "transform-origin", "transform-style", "transition", "transition-delay", "transition-duration", "transition-property", "transition-timing-function", "user-focus", "user-input", "user-modify", "user-select"];
                        let supers = {
                            "box-decoration-break": "background-inline-policy",
                            "border-inline-end": "border-end",
                            "border-inline-end-color": "border-end-color",
                            "border-inline-end-style": "border-end-style",
                            "border-inline-end-width": "border-end-width",
                            "border-inline-start": "border-start",
                            "border-inline-start-color": "border-start-color",
                            "border-inline-start-style": "border-start-style",
                            "border-inline-start-width": "border-start-width",
                            "margin-inline-end": "margin-end",
                            "margin-inline-start": "margin-start",
                            "padding-inline-end": "padding-end",
                            "padding-inline-start": "padding-start",
                        };

                        if(keys.contains(properKey))
                            object[`-moz-${ properKey }`] = this[key] + $important;
                        else if(properKey in supers)
                            object[`-moz-${ supers[properKey] }`] = this[key] + $important;
                    } break;

                    case 'o':
                    case 'opera': {
                        let keys = ["backface-visibility", "border-bottom-left-radius", "border-bottom-right-radius", "border-radius", "border-top-left-radius", "border-top-right-radius", "replace", "set-link-source", "transform-style", "use-link-source"];

                        if(keys.contains(properKey))
                            object[`-o-${ properKey }`] = this[key] + $important;
                    } break;

                    case 'webkit':
                    case 'apple':
                    case 'safari':
                    case 'google':
                    case 'chrome':
                    case 'chromium': {
                        let keys = ["align-content", "align-items", "align-self", "alt", "animation", "animation-delay", "animation-direction", "animation-duration", "animation-fill-mode", "animation-iteration-count", "animation-name", "animation-play-state", "animation-timing-function", "animation-trigger", "app-region", "appearance", "aspect-ratio", "backdrop-filter", "backface-visibility", "background-clip", "background-composite", "background-origin", "background-size", "border-after", "border-after-color", "border-after-style", "border-after-width", "border-before", "border-before-color", "border-before-style", "border-before-width", "border-bottom-left-radius", "border-bottom-right-radius", "border-end", "border-end-color", "border-end-style", "border-end-width", "border-fit", "border-horizontal-spacing", "border-image", "border-radius", "border-start", "border-start-color", "border-start-style", "border-start-width", "border-top-left-radius", "border-top-right-radius", "border-vertical-spacing", "box-align", "box-decoration-break", "box-direction", "box-flex", "box-flex-group", "box-lines", "box-ordinal-group", "box-orient", "box-pack", "box-reflect", "box-shadow", "box-sizing", "clip-path", "color-correction", "column-axis", "column-break-after", "column-break-before", "column-break-inside", "column-count", "column-fill", "column-gap", "column-progression", "column-rule", "column-rule-color", "column-rule-style", "column-rule-width", "column-span", "column-width", "columns", "cursor-visibility", "dashboard-region", "device-pixel-ratio", "filter", "flex", "flex-basis", "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap", "flow-from", "flow-into", "font-feature-settings", "font-kerning", "font-size-delta", "font-smoothing", "font-variant-ligatures", "grid", "grid-area", "grid-auto-columns", "grid-auto-flow", "grid-auto-rows", "grid-column", "grid-column-end", "grid-column-gap", "grid-column-start", "grid-gap", "grid-row", "grid-row-end", "grid-row-gap", "grid-row-start", "grid-template", "grid-template-areas", "grid-template-columns", "grid-template-rows", "highlight", "hyphenate-character", "hyphenate-charset", "hyphenate-limit-after", "hyphenate-limit-before", "hyphenate-limit-lines", "hyphens", "image-set", "initial-letter", "justify-content", "justify-items", "justify-self", "line-align", "line-box-contain", "line-break", "line-clamp", "line-grid", "line-snap", "locale", "logical-height", "logical-width", "margin-after", "margin-after-collapse", "margin-before", "margin-before-collapse", "margin-bottom-collapse", "margin-collapse", "margin-end", "margin-start", "margin-top-collapse", "marquee", "marquee-direction", "marquee-increment", "marquee-repetition", "marquee-speed", "marquee-style", "mask", "mask-attachment", "mask-box-image", "mask-box-image-outset", "mask-box-image-repeat", "mask-box-image-slice", "mask-box-image-source", "mask-box-image-width", "mask-clip", "mask-composite", "mask-image", "mask-origin", "mask-position", "mask-position-x", "mask-position-y", "mask-repeat", "mask-repeat-x", "mask-repeat-y", "mask-size", "mask-source-type", "match-nearest-mail-blockquote-color", "max-logical-height", "max-logical-width", "min-logical-height", "min-logical-width", "nbsp-mode", "opacity", "order", "overflow-scrolling", "padding-after", "padding-before", "padding-end", "padding-start", "perspective", "perspective-origin", "perspective-origin-x", "perspective-origin-y", "print-color-adjust", "region-break-after", "region-break-before", "region-break-inside", "region-fragment", "rtl-ordering", "ruby-position", "scroll-snap-type", "shape-image-threshold", "shape-inside", "shape-margin", "shape-outside", "svg-shadow", "tap-highlight-color", "text-color-decoration", "text-combine", "text-decoration", "text-decoration-line", "text-decoration-skip", "text-decoration-style", "text-decorations-in-effect", "text-emphasis", "text-emphasis-color", "text-emphasis-position", "text-emphasis-style", "text-fill-color", "text-justify", "text-orientation", "text-security", "text-size-adjust", "text-stroke", "text-stroke-color", "text-stroke-width", "text-underline-position", "text-zoom", "touch-action", "transform", "transform-2d", "transform-3d", "transform-origin", "transform-origin-x", "transform-origin-y", "transform-origin-z", "transform-style", "transition", "transition-delay", "transition-duration", "transition-property", "transition-timing-function", "user-drag", "user-modify", "user-select", "word-break", "writing-mode"];

                        if(keys.contains(properKey))
                            object[`-webkit-${ properKey }`] = this[key] + $important;
                    } break;

                    case 'khtml':
                    case 'konqueror': {
                        let keys = ["animation", "animation-delay", "animation-direction", "animation-duration", "animation-fill-mode", "animation-iteration-count", "animation-name", "animation-play-state", "animation-timing-function", "border-bottom-left-radius", "border-bottom-right-radius", "border-radius", "border-top-left-radius", "border-top-right-radius", "box-shadow", "transition", "transition-delay", "transition-duration", "transition-property", "transition-timing-function", "user-select"];

                        if(keys.contains(properKey))
                            object[`-khtml-${ properKey }`] = this[key] + $important;
                    } break;
                }

            object[properKey] = this[key] + $important;
        }

        return object;
    }
}

// CSS-Tricks - Jon Kantner 26 JAN 2021
    // https://css-tricks.com/converting-color-spaces-in-javascript/
// Creates a Color object
class Color {
    static LOW_CONTRAST     = "LOW";
    static NORMAL_CONTRAST  = "NORMAL";
    static HIGH_CONTRAST    = "HIGH";
    static PERFECT_CONTRAST = "PERFECT";

    static CONTRASTS = [Color.LOW_CONTRAST, Color.NORMAL_CONTRAST, Color.HIGH_CONTRAST, Color.PERFECT_CONTRAST];

    // https://www.w3schools.com/lib/w3color.js
    static aliceblue            = [0xF0,0xF8,0xFF];
    static antiquewhite         = [0xFA,0xEB,0xD7];
    static aqua                 = [0x00,0xFF,0xFF];
    static aquamarine           = [0x7F,0xFF,0xD4];
    static azure                = [0xF0,0xFF,0xFF];
    static beige                = [0xF5,0xF5,0xDC];
    static bisque               = [0xFF,0xE4,0xC4];
    static black                = [0x00,0x00,0x00];
    static blanchedalmond       = [0xFF,0xEB,0xCD];
    static blue                 = [0x00,0x00,0xFF];
    static blueviolet           = [0x8A,0x2B,0xE2];
    static brown                = [0xA5,0x2A,0x2A];
    static burlywood            = [0xDE,0xB8,0x87];
    static cadetblue            = [0x5F,0x9E,0xA0];
    static chartreuse           = [0x7F,0xFF,0x00];
    static chocolate            = [0xD2,0x69,0x1E];
    static coral                = [0xFF,0x7F,0x50];
    static cornflowerblue       = [0x64,0x95,0xED];
    static cornsilk             = [0xFF,0xF8,0xDC];
    static crimson              = [0xDC,0x14,0x3C];
    static cyan                 = [0x00,0xFF,0xFF];
    static darkblue             = [0x00,0x00,0x8B];
    static darkcyan             = [0x00,0x8B,0x8B];
    static darkgoldenrod        = [0xB8,0x86,0x0B];
    static darkgray             = [0xA9,0xA9,0xA9];
    static darkgreen            = [0xA9,0xA9,0xA9];
    static darkgrey             = [0x00,0x64,0x00];
    static darkkhaki            = [0xBD,0xB7,0x6B];
    static darkmagenta          = [0x8B,0x00,0x8B];
    static darkolivegreen       = [0x55,0x6B,0x2F];
    static darkorange           = [0xFF,0x8C,0x00];
    static darkorchid           = [0x99,0x32,0xCC];
    static darkred              = [0x8B,0x00,0x00];
    static darksalmon           = [0xE9,0x96,0x7A];
    static darkseagreen         = [0x8F,0xBC,0x8F];
    static darkslateblue        = [0x48,0x3D,0x8B];
    static darkslategray        = [0x2F,0x4F,0x4F];
    static darkslategrey        = [0x2F,0x4F,0x4F];
    static darkturquoise        = [0x00,0xCE,0xD1];
    static darkviolet           = [0x94,0x00,0xD3];
    static deeppink             = [0xFF,0x14,0x93];
    static deepskyblue          = [0x00,0xBF,0xFF];
    static dimgray              = [0x69,0x69,0x69];
    static dimgrey              = [0x69,0x69,0x69];
    static dodgerblue           = [0x1E,0x90,0xFF];
    static firebrick            = [0xB2,0x22,0x22];
    static floralwhite          = [0xFF,0xFA,0xF0];
    static forestgreen          = [0x22,0x8B,0x22];
    static fuchsia              = [0xFF,0x00,0xFF];
    static gainsboro            = [0xDC,0xDC,0xDC];
    static ghostwhite           = [0xF8,0xF8,0xFF];
    static gold                 = [0xFF,0xD7,0x00];
    static goldenrod            = [0xDA,0xA5,0x20];
    static gray                 = [0x80,0x80,0x80];
    static green                = [0x80,0x80,0x80];
    static greenyellow          = [0x00,0x80,0x00];
    static grey                 = [0xAD,0xFF,0x2F];
    static honeydew             = [0xF0,0xFF,0xF0];
    static hotpink              = [0xFF,0x69,0xB4];
    static indianred            = [0xCD,0x5C,0x5C];
    static indigo               = [0x4B,0x00,0x82];
    static ivory                = [0xFF,0xFF,0xF0];
    static khaki                = [0xF0,0xE6,0x8C];
    static lavender             = [0xE6,0xE6,0xFA];
    static lavenderblush        = [0xFF,0xF0,0xF5];
    static lawngreen            = [0x7C,0xFC,0x00];
    static lemonchiffon         = [0xFF,0xFA,0xCD];
    static lightblue            = [0xAD,0xD8,0xE6];
    static lightcoral           = [0xF0,0x80,0x80];
    static lightcyan            = [0xE0,0xFF,0xFF];
    static lightgoldenrodyellow = [0xFA,0xFA,0xD2];
    static lightgray            = [0xD3,0xD3,0xD3];
    static lightgreen           = [0xD3,0xD3,0xD3];
    static lightgrey            = [0x90,0xEE,0x90];
    static lightpink            = [0xFF,0xB6,0xC1];
    static lightsalmon          = [0xFF,0xA0,0x7A];
    static lightseagreen        = [0x20,0xB2,0xAA];
    static lightskyblue         = [0x87,0xCE,0xFA];
    static lightslategray       = [0x77,0x88,0x99];
    static lightslategrey       = [0x77,0x88,0x99];
    static lightsteelblue       = [0xB0,0xC4,0xDE];
    static lightyellow          = [0xFF,0xFF,0xE0];
    static lime                 = [0x00,0xFF,0x00];
    static limegreen            = [0x32,0xCD,0x32];
    static linen                = [0xFA,0xF0,0xE6];
    static magenta              = [0xFF,0x00,0xFF];
    static maroon               = [0x80,0x00,0x00];
    static mediumaquamarine     = [0x66,0xCD,0xAA];
    static mediumblue           = [0x00,0x00,0xCD];
    static mediumorchid         = [0xBA,0x55,0xD3];
    static mediumpurple         = [0x93,0x70,0xDB];
    static mediumseagreen       = [0x3C,0xB3,0x71];
    static mediumslateblue      = [0x7B,0x68,0xEE];
    static mediumspringgreen    = [0x00,0xFA,0x9A];
    static mediumturquoise      = [0x48,0xD1,0xCC];
    static mediumvioletred      = [0xC7,0x15,0x85];
    static midnightblue         = [0x19,0x19,0x70];
    static mintcream            = [0xF5,0xFF,0xFA];
    static mistyrose            = [0xFF,0xE4,0xE1];
    static moccasin             = [0xFF,0xE4,0xB5];
    static navajowhite          = [0xFF,0xDE,0xAD];
    static navy                 = [0x00,0x00,0x80];
    static oldlace              = [0xFD,0xF5,0xE6];
    static olive                = [0x80,0x80,0x00];
    static olivedrab            = [0x6B,0x8E,0x23];
    static orange               = [0xFF,0xA5,0x00];
    static orangered            = [0xFF,0x45,0x00];
    static orchid               = [0xDA,0x70,0xD6];
    static palegoldenrod        = [0xEE,0xE8,0xAA];
    static palegreen            = [0x98,0xFB,0x98];
    static paleturquoise        = [0xAF,0xEE,0xEE];
    static palevioletred        = [0xDB,0x70,0x93];
    static papayawhip           = [0xFF,0xEF,0xD5];
    static peachpuff            = [0xFF,0xDA,0xB9];
    static peru                 = [0xCD,0x85,0x3F];
    static pink                 = [0xFF,0xC0,0xCB];
    static plum                 = [0xDD,0xA0,0xDD];
    static powderblue           = [0xB0,0xE0,0xE6];
    static purple               = [0x80,0x00,0x80];
    static rebeccapurple        = [0x66,0x33,0x99];
    static red                  = [0xFF,0x00,0x00];
    static rosybrown            = [0xBC,0x8F,0x8F];
    static royalblue            = [0x41,0x69,0xE1];
    static saddlebrown          = [0x8B,0x45,0x13];
    static salmon               = [0xFA,0x80,0x72];
    static sandybrown           = [0xF4,0xA4,0x60];
    static seagreen             = [0x2E,0x8B,0x57];
    static seashell             = [0xFF,0xF5,0xEE];
    static sienna               = [0xA0,0x52,0x2D];
    static silver               = [0xC0,0xC0,0xC0];
    static skyblue              = [0x87,0xCE,0xEB];
    static slateblue            = [0x6A,0x5A,0xCD];
    static slategray            = [0x70,0x80,0x90];
    static slategrey            = [0x70,0x80,0x90];
    static snow                 = [0xFF,0xFA,0xFA];
    static springgreen          = [0x00,0xFF,0x7F];
    static steelblue            = [0x46,0x82,0xB4];
    static tan                  = [0xD2,0xB4,0x8C];
    static teal                 = [0x00,0x80,0x80];
    static thistle              = [0xD8,0xBF,0xD8];
    static tomato               = [0xFF,0x63,0x47];
    static turquoise            = [0x40,0xE0,0xD0];
    static violet               = [0xEE,0x82,0xEE];
    static wheat                = [0xF5,0xDE,0xB3];
    static white                = [0xFF,0xFF,0xFF];
    static whitesmoke           = [0xF5,0xF5,0xF5];
    static yellow               = [0xFF,0xFF,0x00];
    static yellowgreen          = [0x9A,0xCD,0x32];

    constructor(...args) {
        return Object.assign(this, Color.destruct.apply(null, args));
    }

    // Converts Hex color values to a color-object
        // Color.HEXtoColor(hex:string<String#CSS-Color>) → Object<Color>
    static HEXtoColor(hex = '#000') {
        hex = hex.replace('#', '');

        let [R, G, B, A = 255] = (
            (hex.length == 3 || hex.length == 4)?
                hex.split(/([\da-f])/i):
            (hex.length == 6 || hex.length == 8)?
                hex.split(/([\da-f]{2})/i):
            hex.split(/([\da-f]{1,2}?)/i)
        ).filter(char => char.length).map(char => parseInt(char.repeat(3 - char.length), 16));

        return Color.RGBtoHSL(R, G, B, A / 255);
    }

    // https://stackoverflow.com/a/9493060/4211612 →
        // https://www.rapidtables.com/convert/color/rgb-to-hsl.html
    // Converts RGB to HSL
        // Color.RGBtoHSL(red:number?<uint8>, green:number?<uint8>, blue:number?<uint8>, alpha:number?<Percentage>) → Object<{ RGB, R, G, B, red, green, blue, HSL, H, S, L, hue, saturation, lightness }>
    static RGBtoHSL(R = 0, G = 0, B = 0, A = 1) {
        // Convert RGB to fractions of 1
        let r = R / 255,
            g = G / 255,
            b = B / 255;

        // Find channel values
        let Cmin = Math.min(r, g, b),
            Cmax = Math.max(r, g, b),
            delta = Cmax - Cmin;

        let H = 0, S = 0, L = 0;

        // Calculate the hue
        if(delta == 0)
            H = 0;
        else if(r == Cmax)
            H = ((g - b) / delta) % 6;
        else if (g == Cmax)
            H = ((b - r) / delta) + 2;
        else
            H = ((r - g) / delta) + 4;

        H = Math.round(H * 60);

        if(H < 0)
            H += 360;

        // Calculate lightness
        L = (Cmax + Cmin) / 2;

        // Calculate saturation
        S = (delta == 0? 0: delta / (1 - Math.abs(2 * L - 1)));

        H = +(H * 1/1).round();
        S = +(S * 100).round();
        L = +(L * 100).round();
        A = A.clamp(0, 1);

        return {
            H, S, L, A,
            hue: H, saturation: S, lightness: L, alpha: A,
            HSL: `hsl(${ H }deg,${ S }%,${ L }%)`,
            HSLA: `hsla(${ H }deg,${ S }%,${ L }%,${ A.toFixed(1) })`,

            R, G, B,
            red: R, green: G, blue: B,
            RGB: `rgb(${ [R, G, B].map(v => v.toString(16)) })`,
            RGBA: `rgb(${ [R, G, B, A.toFixed(1)].map(v => v.toString(16)) })`,

            HEX: `#${ [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('') }`,
            HEXA: `#${ [R, G, B, A * 255].map(v => v.toString(16).padStart(2, '0')).join('') }`,
        };
    }

    // https://stackoverflow.com/a/9493060/4211612 →
        // https://www.rapidtables.com/convert/color/hsl-to-rgb.html
    // Converts HSL to RGB
        // Color.HSLtoRGB(hue:number?<Degrees>, saturation:number?<Percentage>, lightness:number?<Percentage>, alpha:number?<Percentage>) → Object<{ RGB, R, G, B, red, green, blue, HSL, H, S, L, hue, saturation, lightness }>
    static HSLtoRGB(hue = 0, saturation = 0, lightness = 0, alpha = 1) {
        let H = (hue % 360),
            S = (saturation / 100),
            L = (lightness / 100),
            A = alpha.clamp(0, 1);

        let { abs } = Math;
        let C = (1 - abs(2*L - 1)) * S,
            X = C * (1 - abs(((H / 60) % 2) - 1)),
            m = L - C/2;

        let [r, g, b] =
        (H >= 0 && H < 60)?
            [C, X, 0]:
        (H >= 60 && H < 120)?
            [X, C, 0]:
        (H >= 120 && H < 180)?
            [0, C, X]:
        (H >= 180 && H < 240)?
            [0, X, C]:
        (H >= 240 && H < 300)?
            [X, 0, C]:
        (H >= 300 && H < 360)?
            [C, 0, X]:
        [0, 0, 0];

        let [R, G, B] = [(r+m)*255, (g+m)*255, (b+m)*255].map(v => v.abs().round().clamp(0, 255));

        H = +(H * 1/1).round();
        S = +(S * 100).round();
        L = +(L * 100).round();

        return {
            H, S, L, A,
            hue, saturation, lightness, alpha: A,
            HSL: `hsl(${ H }deg,${ S }%,${ L }%)`,
            HSLA: `hsla(${ H }deg,${ S }%,${ L }%,${ A.toFixed(1) })`,

            R, G, B,
            red: R, green: G, blue: B,
            RGB: `rgb(${ [R, G, B].map(v => v.toString(16)) })`,
            RGBA: `rgb(${ [R, G, B, A.toFixed(1)].map(v => v.toString(16)) })`,

            HEX: `#${ [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('') }`,
            HEXA: `#${ [R, G, B, A * 255].map(v => v.toString(16).padStart(2, '0')).join('') }`,
        };
    }

    // https://www.w3schools.com/lib/w3color.js
    static RGBtoHWB(R = 0, G = 0, B = 0, A = 1) {
        // Similar to .RGBtoHSL
        // Convert RGB to fractions of 1
        let r = R / 255,
            g = G / 255,
            b = B / 255;

        // Find channel values
        let Cmin = Math.min(r, g, b),
            Cmax = Math.max(r, g, b),
            delta = Cmax - Cmin;

        let H = 0, W = 0, K = 0;

        // Calculate the hue
        if(delta == 0)
            H = 0;
        else if(r == Cmax)
            H = (((g - b) / delta) % 6) * 360;
        else if (g == Cmax)
            H = (((b - r) / delta) + 2) * 360;
        else
            H = (((r - g) / delta) + 4) * 360;

        W = Cmin;
        K = 1 - Cmax;

        return {
            H, W, K,
            hue: H, white: W, black: K, alpha: A,
            HWK: `hwb(${ H }deg,${ W }%,${ K }%)`,

            R, G, B, A,
            red: R, green: G, blue: B,
            RGB: `rgb(${ [R, G, B].map(v => v.toString(16)) })`,
            RGBA: `rgb(${ [R, G, B, A.toFixed(1)].map(v => v.toString(16)) })`,

            HEX: `#${ [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('') }`,
            HEXA: `#${ [R, G, B, A * 255].map(v => v.toString(16).padStart(2, '0')).join('') }`,
        };
    }

    // Converts HWB to RGB → https://www.w3schools.com/lib/w3color.js
        // Color.HWBtoRGB(hue:number?<Degrees>, white:number?<Percentage>, black:number?<Percentage>) → Object<{ RGB, R, G, B, red, green, blue, HWB, H, W, K, hue, white, black }>
    static HWBtoRGB(hue = 0, white = 0, black = 0, alpha = 1) {
        let { R, G, B } = Color.HSLtoRGB(hue, 1, .5);
        let E = white + black;

        if(E > 1) {
            white = Number((white / E).toFixed(2));
            black = Number((black / E).toFixed(2));
        }

        let f = c => (
            c *= (1 - white - black),
            c += white,
            c *= 255
        );

        R = f(R);
        G = f(G);
        B = f(B);

        return {
            H: hue, W: white, K: black,
            hue, white, black, alpha,
            HWK: `hwb(${ H }deg,${ W }%,${ K }%)`,

            R, G, B, A: alpha,
            red: R, green: G, blue: B,
            RGB: `rgb(${ [R, G, B].map(v => v.toString(16)) })`,
            RGBA: `rgb(${ [R, G, B, alpha.toFixed(1)].map(v => v.toString(16)) })`,

            HEX: `#${ [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('') }`,
            HEXA: `#${ [R, G, B, alpha * 255].map(v => v.toString(16).padStart(2, '0')).join('') }`,
        };
    }

    // https://www.w3schools.com/lib/w3color.js
    static RGBtoCMYK(R = 0, G = 0, B = 0, A = 1) {
        // Similar to .RGBtoHSL
        // Convert RGB to fractions of 1
        let r = R / 255,
            g = G / 255,
            b = B / 255;

        // Find channel values
        let Cmax = Math.max(r, g, b),
            K = 1 - Cmax,
            k = 1 - K;

        let C = 0, M = 0, Y = 0;

        // Calculate the hue
        if(K > 0) {
            C = (1 - R - K) / k;
            M = (1 - G - K) / k;
            Y = (1 - B - K) / k;
        }

        return {
            C, M, Y, K,
            cyan: C, magenta: M, yellow: Y, black: K, alpha: A,
            CMYK: `cmyk(${ C }%,${ M }%,${ Y }%,${ K }%)`,

            R, G, B, A,
            red: R, green: G, blue: B,
            RGB: `rgb(${ [R, G, B].map(v => v.toString(16)) })`,
            RGBA: `rgb(${ [R, G, B, A.toFixed(1)].map(v => v.toString(16)) })`,

            HEX: `#${ [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('') }`,
            HEXA: `#${ [R, G, B, A * 255].map(v => v.toString(16).padStart(2, '0')).join('') }`,
        };
    }

    // https://www.w3schools.com/lib/w3color.js
    static CMYKtoRGB(C = 0, M = 0, Y = 0, K = 0) {
        let R = 255 - ((Math.min(1, C * (1 - K) + K)) * 255),
            G = 255 - ((Math.min(1, M * (1 - K) + K)) * 255),
            B = 255 - ((Math.min(1, Y * (1 - K) + K)) * 255),
            A = 1;

        return {
            C, M, Y, K,
            cyan: C, magenta: M, yellow: Y, black: K, alpha: A,
            CMYK: `cmyk(${ C }%,${ M }%,${ Y }%,${ K }%)`,

            R, G, B, A,
            red: R, green: G, blue: B,
            RGB: `rgb(${ [R, G, B].map(v => v.toString(16)) })`,
            RGBA: `rgb(${ [R, G, B, A.toFixed(1)].map(v => v.toString(16)) })`,

            HEX: `#${ [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('') }`,
            HEXA: `#${ [R, G, B, A * 255].map(v => v.toString(16).padStart(2, '0')).join('') }`,
        };
    }

    toRGB() {
        return `rgb(${ this.R },${ this.G },${ this.B })`;
    }

    toHEX() {
        return this.HEX;
    }

    toHSL() {
        return this.HSL;
    }

    toHWB() {
        return Color.RGBtoHWB(this.R, this.G, this.B, this.A).HSL;
    }

    toCMYK() {
        return Color.RGBtoCMYK(this.R, this.G, this.B, this.A).CMYK;
    }

    // https://stackoverflow.com/a/9733420/4211612
    // Gets the luminance of a color
        // Color.luminance(red:number<uint8>, green:number<uint8>, blue:number<uint8>) → number<[0, 1]>
    static luminance(R = 0, G = 0, B = 0) {
        let l = [R, G, B].map(c => {
            c /= 255;

            return (
                c <= 0.03928?
                    c / 12.92:
                ((c + 0.055) / 1.055)**2.4
            );
        });

        return l[0] * 0.2126 + l[1] * 0.7152 + l[2] * 0.0722;
    }

    isDarkerThan(color) {
        if(!color instanceof Color)
            throw TypeError(`The opposing color argument must be a Color object. Use "new Color(color:string)"`);

        let { K = .5 } = Color.RGBtoCMYK(color.R, color.G, color.B);

        return ((this.R * 299 + this.G * 587 + this.B * 114) / 1e3) < (K * 255);
    }

    isLighterThan(color) {
        if(!color instanceof Color)
            throw TypeError(`The opposing color argument must be a Color object. Use "new Color(color:string)"`);

        let { W = .5 } = Color.RGBtoCMYK(color.R, color.G, color.B);

        return ((this.R * 299 + this.G * 587 + this.B * 114) / 1e3) > (W * 255);
    }

    // https://stackoverflow.com/a/9733420/4211612
    // Gets the contrast of two colors
        // Color.contrast(C1:array<[number<uint8>, number<uint8>, number<uint8>]>, C2:array<[number<uint8>, number<uint8>, number<uint8>]>) → number<[0, 21]>
    static contrast(C1, C2) {
        let L1 = Color.luminance(...C1),
            L2 = Color.luminance(...C2),
            L = Math.max(L1, L2),
            D = Math.min(L1, L2);

        let value = new Number((L + 0.05) / (D + 0.05));

        Object.defineProperties(value, {
            toString: {
                value() {
                    return Color.CONTRASTS[(3 * (this / 21)) | 0];
                },
            },
        });

        return value;
    }

    // Gets the distance between two RGB colors
    // https://tomekdev.com/posts/sorting-colors-in-js
        // Color.distance(C1:array<[R, G, B]>, C2:array<[R, G, B]>) → number
    static distance(C1, C2) {
        let [R, G, B] = C1,
            [r, g, b] = C2;

        return Math.sqrt( (R - r)**2 + (G - g)**2 + (B - b)**2 );
    }

    // Returns a Color object
        // Color.destruct(color:string<Color>) → Color
    static destruct(color) {
        color = (color || '#000').toString().trim();

        if(/^(\w+)$/.test(color) && color in Color && Color[color].length == 3)
            return Color.HEXtoColor(Color[color].map(c => c.toString(16).padStart(2, '00')).join(''));

        let colorRegExps = [
            // #RGB #RRGGBB
            /^([#]?)(?<red>[\da-f]{1,2}?)(?<green>[\da-f]{1,2}?)(?<blue>[\da-f]{1,2}?)(?<alpha>[\da-f]{1,2}?)?$/i,

            // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/rgb
            // rgb(red, green, blue) rgb(red green blue) rgba(red, green, blue, alpha) rgba(red green blue / alpha)
            /^(rgba?)\((?<red>\d+)[\s,]+(?<green>\d+)[\s,]+(?<blue>\d+)(?:[\s,\/]+(?<alpha>[\d\.]+))?\)$/i,

            // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl
            // hsl(hue, saturation, lightness) hsl(hue saturation lightness) hsla(hue, saturation, lightness, alpha) hsla(hue saturation lightness / alpha)
            /^(hsla?)\((?<hue>[\d\.]+)(?:deg(?:rees?)?)?[\s,]+(?<saturation>[\d\.]+)(?:[%])?[\s,]+(?<lightness>[\d\.]+)(?:[%])?(?:[\s,\/]+(?<alpha>[\d\.]+))?\)$/i,

            // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hwb
            // hwb(hue, white, black) hwb(hue white black)
            /^(hwb)\((?<hue>[\d\.]+)(?:deg(?:rees?)?)?[\s,]+(?<white>[\d\.]+)(?:[%])?[\s,]+(?<black>[\d\.]+)(?:[%])?\)$/i,

            // cmyk(cyan, magenta, yellow, black) cmyk(cyan magenta yellow black)
            /^(cmyk)\((?<cyan>[\d\.]+)(?:[%])?[\s,]+(?<magenta>[\d\.]+)(?:[%])?[\s,]+(?<yellow>[\d\.]+)(?:[%])?[\s,]+(?<black>[\d\.]+)(?:[%])?\)$/i,
        ];

        for(let regexp of colorRegExps)
            if(regexp.test(color)) {
                let computed;
                color.replace(regexp, ($0, $1, $2, $3, $4, $5 = null) => {
                    if(/\b[\da-f]{3,8}$/i.test($0))
                        $1 ||= '#';

                    switch($1.toLowerCase()) {
                        case '#': {
                            computed = Color.HEXtoColor([$1, $2, $3, $4, $5 ?? 'ff'].join(''));
                        } break;

                        case 'rgb':
                        case 'rgba': {
                            computed = Color.RGBtoHSL(...[$2, $3, $4, $5 ?? 1].map(parseFloat));
                        } break;

                        case 'hsl':
                        case 'hsla': {
                            computed = Color.HSLtoRGB(...[$2, $3, $4, $5 ?? 1].map(parseFloat));
                        } break;

                        case 'hwb': {
                            computed = Color.HWBtoRGB(...[$2, $3, $4].map(parseFloat));
                        } break;

                        case 'cmyk': {
                            computed = Color.CMYKtoRGB(...[$2, $3, $4, $5].map(parseFloat));
                        } break;

                        default: return;
                    }

                    return computed;
                });

                return computed;
            }
    }

    // Retrns a color's name
        // Color.getName(color:string<Color>) → string
    static getName(color = '#000') {
        color = Color.destruct(color);

        if(nullish(color))
            return '';

        // TODO: Add more colors &/ better detection...
        let { H, S, L, R, G, B } = color;
        let maxDist = Color.distance([0,0,0],[255,255,255]),
            colorDifference = (C1, C2) => Color.distance(C1, C2) / maxDist;

        let colors = {
            // Extremes
            white: ({ R, G, B, L }) => (false
                || (colorDifference([255, 255, 255], [R, G, B]) < 0.05)
                || (true
                    && colors.grey({ R, G, B, S, L })
                    && (L > 90)
                )
            ),
            light: ({ S, L }) => (false
                || (L > 80)
                || (S < 15)
            ),

            black: ({ R, G, B, S, L }) => (false
                || (colorDifference([0, 0, 0], [R, G, B]) < 0.05)
                || (true
                    && colors.grey({ R, G, B, S })
                    && (L < 5)
                )
                || (true
                    && colors.green({ R, G, B, S })
                    && (L < 5)
                )
                || (true
                    && colors.brown({ S, L })
                    && (L <= 1)
                )
            ),
            dark: ({ S, L }) => (L < 15),

            grey: ({ R, G, B, S }) => (false
                || (colorDifference([B, R, G].map(C => C.floorToNearest(8)), [R, G, B]) < 0.05)
                || (S < 5)
            ),

            // Reds {130°} → (0° < Hue ≤ 60°) U (290° < Hue ≤ 360°)
            red: ({ H, S }) => (true
                && (S >= 5)
                && (false
                    || (H > 345)
                    || (H <= 10)
                )
            ),
            pink: ({ H, S, L }) => (false
                || (true
                    && (S >= 5)
                    && (H > 290 && H <= 345)
                )
                || (true
                    && colors.light({ S, L })
                    && colors.red({ H, S })
                )
            ),
            orange: ({ H, S }) => (false
                || (true
                    && (S >= 5)
                    && (H > 10 && H <= 45)
                )
                || (true
                    && colors.red({ H, S })
                    && colors.yellow({ H, S })
                )
            ),
            yellow: ({ H, S }) => (true
                && (S >= 5)
                && (H > 45 && H <= 60)
            ),
            brown: ({ H, S, L }) => (true
                && (false
                    || colors.yellow({ H, S })
                    || colors.orange({ H, S })
                    || colors.red({ H, S })
                )
                && (false
                    || (S > 10 && S <= 30)
                    || (L > 10 && L <= 30)
                )
            ),

            // Greens {110°} → (60° < Hue ≤ 170°)
            green: ({ H, S }) => (true
                && (S >= 5)
                && (H > 60 && H <= 170)
            ),

            // Blues {120°} → (170° < Hue ≤ 290°)
            blue: ({ H, S }) => (true
                && (S >= 5)
                && (H > 170 && H <= 260)
            ),
            purple: ({ H, S, L }) => (false
                || (true
                    && (S >= 5)
                    && (H > 260 && H <= 290)
                )
                || (false
                    || (true
                        && (H >= 245 && H < 290)
                        && (L <= 50)
                    )
                )
                || (true
                    && colors.pink({ H, S, L })
                    && (L < 30)
                )
            ),
        };

        let name = [];

        naming:
        for(let key in colors) {
            let condition = colors[key];

            if(condition({ H, S, L, R, G, B })) {
                name.push(key);

                if(/^(black|white)$/i.test(key)) {
                    name = [key];

                    break naming;
                }
            }
        }

        return name
            .sort()
            .sort((primary, secondary) => {
                return (
                    /^(light|dark)$/i.test(primary)?
                        -1:
                    /^(grey|brown)$/i.test(primary)?
                        +1:
                    /^(light|dark)$/i.test(secondary)?
                        +1:
                    /^(grey|brown)$/i.test(secondary)?
                        -1:
                    0
                )
            })
            .join(' ')

            .replace(/light( pink)? red/, 'pink')
            .replace(/red orange/, 'orange')
            .replace(/light yellow/, 'yellow')
            .replace(/orange brown/, 'light brown')
            .replace(/dark orange/, 'brown')
            .replace(/blue purple/, 'purple')

            .replace(/^(light|dark).+(grey|brown)$/i, '$1 $2')
            .replace(/^(light|dark) (black|white)(?:\s[\s\w]+)?/i, '$1')
            .replace(/(\w+) (\1)/g, '$1')
            .replace(/(\w+) (\w+)$/i, ($0, $1, $2, $$, $_) => {
                if([$1, $2].contains('light', 'dark'))
                    return $_;

                let suffix = $1.slice(-1);

                return $1.slice(0, -1) + ({
                    d: 'dd',
                    e: '',
                }[suffix] ?? suffix) + 'ish-' + $2;
            })

            .replace(/light$/i, 'white')
            .replace(/dark$/i, 'black');
    }
}

// https://www.reddit.com/r/Twitch/comments/dxgkhr/comment/f7q4bud/?utm_source=share&utm_medium=web2x&context=3
// Returns a random string
    // new ClipName(version:number?) → string
    // 2 Adj + 1 Noun + 1 Global Emote
class ClipName extends String {
    static ADJECTIVES = 'adorable adventurous aggressive agreeable alert alive amused angry calm careful cautious charming cheerful clean clear clever cloudy clumsy eager easy elated elegant embarrassed enchanting encouraging bad beautiful better bewildered black bloody blue blue-eyed dangerous dark dead defeated defiant delightful depressed determined different fair faithful famous fancy fantastic fierce filthy fine annoyed annoying anxious arrogant ashamed attractive average awful colorful combative comfortable concerned condemned confused cooperative courageous curious cute energetic enthusiastic envious evil excited expensive exuberant blushing bored brainy brave breakable bright busy buttery difficult disgusted distinct disturbed dizzy doubtful drab dull dusty foolish fragile frail frantic friendly frightened funny furry gentle gifted glamorous gleaming glorious good ill important impossible inexpensive innocent inquisitive nasty naughty nervous nice nutty obedient obnoxious odd old-fashioned handsome happy healthy helpful helpless hilarious lazy light lively lonely long lovely lucky panicky perfect plain pleasant poised poor powerful gorgeous graceful grieving grotesque grumpy grungy itchy jealous jittery jolly joyous kind open outrageous outstanding homeless homely horrible hungry hurt hushed magnificent misty modern motionless muddy mushy mysterious precious prickly proud putrid puzzled quaint queasy real relieved repulsive rich scary selfish shiny shy silly sleepy smiling vast victorious vivacious wandering weary wicked wide-eyed talented tame tasty tender tense terrible thankful thoughtful thoughtless tired smoggy sore sparkling splendid spotless stormy strange stupid successful super svelte wild witty worried worrisome wrong zany zealous'
        .split(' ');
    static NOUNS = 'account achiever acoustics act action activity actor addition adjustment advertisement advice aftermath afternoon afterthought agreement air airplane airport alarm amount amusement anger angle animal answer ant ants apparatus apparel apple apples appliance approval arch argument arithmetic arm army art attack attempt attention attraction aunt authority babies baby back badge bag bait balance ball balloon balls banana band base baseball basin basket basketball bat bath battle bead beam bean bear bears beast bed bedroom beds bee beef beetle beggar beginner behavior belief believe bell bells berry bike bikes bird birds birth birthday bit bite blade blood blow board boat boats body bomb bone book books boot border bottle boundary box boy boys brain brake branch brass bread breakfast breath brick bridge brother brothers brush bubble bucket building bulb bun burn burst bushes business butter button cabbage cable cactus cake cakes calculator calendar camera camp can cannon canvas cap caption car card care carpenter carriage cars cart cast cat cats cattle cause cave celery cellar cemetery cent chain chair chairs chalk chance change channel cheese cherries cherry chess chicken chickens children chin church circle clam class clock clocks cloth cloud clouds clover club coach coal coast coat cobweb coil collar color comb comfort committee company comparison competition condition connection control cook copper copy cord cork corn cough country cover cow cows crack cracker crate crayon cream creator creature credit crib crime crook crow crowd crown crush cry cub cup current curtain curve cushion dad daughter day death debt decision deer degree design desire desk destruction detail development digestion dime dinner dinosaurs direction dirt discovery discussion disease disgust distance distribution division dock doctor dog dogs doll dolls donkey door downtown drain drawer dress drink driving drop drug drum duck ducks dust ear earth earthquake edge education effect egg eggnog eggs elbow end engine error event example exchange existence expansion experience expert eye eyes face fact fairies fall family fan fang farm farmer father father faucet fear feast feather feeling feet fiction field fifth fight finger finger fire fireman fish flag flame flavor flesh flight flock floor flower flowers fly fog fold food foot force fork form fowl frame friction friend friends frog frogs front fruit fuel furniture galley game garden gate geese ghost giants giraffe girl girls glass glove glue goat gold goldfish good-bye goose government governor grade grain grandfather grandmother grape grass grip ground group growth guide guitar gun hair haircut hall hammer hand hands harbor harmony hat hate head health hearing heart heat help hen hill history hobbies hole holiday home honey hook hope horn horse horses hose hospital hot hour house houses humor hydrant ice icicle idea impulse income increase industry ink insect instrument insurance interest invention iron island jail jam jar jeans jelly jellyfish jewel join joke journey judge juice jump kettle key kick kiss kite kitten kittens kitty knee knife knot knowledge laborer lace ladybug lake lamp land language laugh lawyer lead leaf learning leather leg legs letter letters lettuce level library lift light limit line linen lip liquid list lizards loaf lock locket look loss love low lumber lunch lunchroom machine magic maid mailbox man manager map marble mark market mask mass match meal measure meat meeting memory men metal mice middle milk mind mine minister mint minute mist mitten mom money monkey month moon morning mother motion mountain mouth move muscle music nail name nation neck need needle nerve nest net news night noise north nose note notebook number nut oatmeal observation ocean offer office oil operation opinion orange oranges order organization ornament oven owl owner'
        .split(' ');
    static EMOTES = 'ANELE ArgieB8 ArsonNoSexy AsexualPride AsianGlow BCWarrior BOP BabyRage BatChest BegWan BibleThump BigBrother BigPhish BisexualPride BlackLivesMatter BlargNaut BloodTrail BrainSlug BrokeBack BuddhaBar CaitlynS CarlSmile ChefFrank CoolCat CoolStoryBob CorgiDerp CrreamAwk CurseLit DAESuppy DBstyle DansGame DarkKnight DarkMode DatSheffy DendiFace DogFace DoritosChip DxCat EarthDay EleGiggle EntropyWins ExtraLife FBBlock FBCatch FBChallenge FBPass FBPenalty FBRun FBSpiral FBtouchdown FUNgineer FailFish FamilyMan FootBall FootGoal FootYellow FrankerZ FreakinStinkin FutureMan GayPride GenderFluidPride GingerPower GivePLZ GlitchCat GlitchLit GlitchNRG GrammarKing GunRun HSCheers HSWP HarleyWink HassaanChop HeyGuys HolidayCookie HolidayLog HolidayPresent HolidaySanta HolidayTree HotPokket HungryPaimon ImTyping IntersexPride InuyoFace ItsBoshyTime JKanStyle Jebaited Jebasted JonCarnage KAPOW KEKHeim Kappa Kappa KappaClaus KappaPride KappaRoss KappaWealth Kappu Keepo KevinTurtle Kippa KomodoHype KonCha Kreygasm LUL LaundryBasket LesbianPride MVGame Mau5 MaxLOL MechaRobot MercyWing1 MercyWing2 MikeHogu MingLee ModLove MorphinTime MrDestructoid MyAvatar NewRecord NinjaGrumpy NomNom NonbinaryPride NotATK NotLikeThis OSFrog OhMyDog OneHand OpieOP OptimizePrime PJSalt PJSugar PMSTwin PRChase PanicVis PansexualPride PartyHat PartyTime PeoplesChamp PermaSmug PicoMause PinkMercy PipeHype PixelBob PizzaTime PogBones PogChamp Poooound PopCorn PoroSad PotFriend PowerUpL PowerUpR PraiseIt PrimeMe PunOko PunchTrees RaccAttack RalpherZ RedCoat ResidentSleeper RitzMitz RlyTho RuleFive RyuChamp SMOrc SSSsss SabaPing SeemsGood SeriousSloth ShadyLulu ShazBotstix Shush SingsMic SingsNote SmoocherZ SoBayed SoonerLater Squid1 Squid2 Squid3 Squid4 StinkyCheese StinkyGlitch StoneLightning StrawBeary SuperVinlin SwiftRage TBAngel TF2John TPFufun TPcrunchyroll TTours TakeNRG TearGlove TehePelo ThankEgg TheIlluminati TheRinger TheTarFu TheThing ThunBeast TinyFace TombRaid TooSpicy TransgenderPride TriHard TwitchLit TwitchRPG TwitchSings TwitchUnity TwitchVotes UWot UnSane UncleNox VirtualHug VoHiYo VoteNay VoteYea WTRuck WholeWheat WhySoSerious WutFace YouDontSay YouWHY bleedPurple cmonBruh copyThis duDudu imGlitch mcaT panicBasket pastaThat riPepperonis twitchRaid'
        .split(' ');

    constructor(version = 1) {
        let r = /(?:^|-)(\w)/g,
            R = ($0, $1, $$, $_) => $1.toUpperCase();

        let _ = {
            get a() {
                return ClipName.ADJECTIVES.shuffle().random().replace(r, R);
            },
            get n() {
                return ClipName.NOUNS.shuffle().random().replace(r, R);
            },
            get e() {
                return ClipName.EMOTES.shuffle().random().replace(r, R);
            },
        };

        let data = [[_.a, _.a, _.n, _.e].join(''), (new UUID).toStamp(), (new UUID).toStamp()];

        return super(data.slice(0, version.clamp(1, data.length)).join('-'));
    }
}

// Returns an iterable range (inclusive)
    // Number..to(end:number?, by:number?) → @@Iterator
Number.prototype.to ??= function to(end = 0, by = 1) {
    let { abs } = Math;
    let step = abs(by),
        start = this + (this < end? -step: +step),
        stop = end + (this < end? +step: -step),
        SAFE = Math.min(abs(start) + abs(stop), Math.sqrt(Number.MAX_SAFE_INTEGER).floor());

    return ({
        next() {
            start += (start < stop? +step: -step);

            return ({ value: start, done: (start == stop || ++this[Symbol.unscopables] > SAFE) });
        },

        [Symbol.iterator]() {
            return this;
        },

        [Symbol.unscopables]: 0,
    });
};

// Converts SVGs to images
    // Element<SVG>..toImage(imageType:string?, returnType:string?) → string<dataURL> | object | HTMLImageElement
        // imageType = "image/jpeg" | "image/png" | "image/webp"
        // returnType = "img" | "element" | "HTMLImageElement"
            // → HTMLImageElement
        // returnType = "json" | "object"
            // → Object<{ type=imageType, data:string, height:number#integer, width:number#integer }>
        // returnType = "dataURI" | "dataURL" | ...
            // → string<dataURL>
    // String<XML<SVG>>..toImage()
String.prototype.toImage ??= function toImage(imageType = "image/png", returnType = "dataURL") {
    return (new DOMParser).parseFromString(this, 'text/xml')?.querySelector('figure, svg, path, g')?.toImage(imageType, returnType);
};

Element.prototype.toImage ??=
SVGElement.prototype.toImage ??=
SVGSVGElement.prototype.toImage ??=
SVGGElement.prototype.toImage ??=
SVGPathElement.prototype.toImage ??=

function toImage(imageType = "image/png", returnType = "dataURL") {
    if([
        'figure',
        'svg',
        'path',
        'g',
    ].missing(this.tagName.toLowerCase()))
        return;

    let height, width;

    try {
        let offset = getOffset(this);

        height = offset.height;
        width = offset.width;
    } catch(e) {
        height = this?.height;
        width = this?.width;
    } finally {
        height ||= this?.getAttribute('height');
        width ||= this?.getAttribute('width');
    }

    height = parseFloat(height) | 0;
    width = parseFloat(width) | 0;

    let canvas = furnish('canvas', { height, width }),
        context = canvas.getContext('2d');

    let path = new Path2D($('path', this)?.getAttribute('d') ?? '');

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
    // Number..suffix(unit:string?, decimalPlaces:boolean|number?, format:string?) → string
        // decimalPlaces = true | false | *:number
            // true → 123.456.suffix('m', true) => "123.456m"
            // false → 123.456.suffix('m', false) => "123m"
            // 1 → 123.456.suffix('m', 1) => "123.4m"
        // format = "metric" | "full" | "imperial" | "natural" | "readable" | "data" | "time:..."
Number.prototype.suffix ??= function suffix(unit = '', decimalPlaces = true, format = "metric") {
    let number = parseFloat(this),
        sign = (number < 0? '-': ''),
        suffix = '',
        padded = false;

    number = Math.abs(number);

    let system = {},
        capacity = 1000;

    switch(format.toLowerCase()) {
        case 'imperial': {
            padded = true;
            system.large = 'thous m b tr quadr qunit sext sept oct non'
                .split(' ')
                .map((suffix, index) => suffix + ['and', 'illion'][+!!index]);
            system.small = system.large.map(suffix => suffix + 'ths');
        } break;

        // Common US shorthands (used on Twitch)
        case 'natural':
        case 'readable': {
            system.large = 'kMBTQ';
            system.small = '';
        } break;

        // S.I. based units, data-oriented (symbol)
        case 'data': {
            system.large = 'kMGTPEZYRQ';
            system.small = 'mμnpfazyrq';

            capacity = 1_024;
        } break;

        // S.I. based units (full-name)
        case 'full': {
            system.large = 'kilo mega giga tera peta exa zetta yotta ronna quetta'.split(' ');
            system.small = 'milli micro nano pico femto atto zepto yocto ronto quecto'.split(' ');
        } break;

        // Time-based units
        case 'time':
        case 'time:natural':
        case 'time:clock':
        case 'time:readable':
        case 'time:short': {
            let [,subtype = 'natural'] = format.toLowerCase().split(':');

            return toTimeString((decimalPlaces === true? this: decimalPlaces === false? Math.round(this): this.toFixed(decimalPlaces)), subtype);
        } break;

        case 'metric':
        default: {
            system.large = 'kMGTPEZYRQ';
            system.small = 'mμnpfazyrq';
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

    return [''
        + sign
        + (
            decimalPlaces === true?
                number:
            decimalPlaces === false?
                Math.round(number):
            (format.equals('readable') || format.equals('natural'))?
                (Math.abs(this) > 999? number.toFixed(decimalPlaces).replace(/\.0+$/, ''): Math.round(number)):
            number.toFixed(decimalPlaces)
        )
        , suffix
        , unit
    ].join(padded? ' ': '');
};

// Floors a number to the nearest X
    // Number..floorToNearest(number:number) → number
Number.prototype.floorToNearest ??= function floorToNearest(number) {
    return this - (this % number);
};

// Clamps (keeps) a number between two points
    // Number..clamp(min:number, max:number?) → number
Number.prototype.clamp ??= function clamp(min, max) {
    if(Number.isNaN(min) || nullish(min))
        throw TypeError('[min] must be a number');

    if(Number.isNaN(max) || nullish(max))
        max = ((min < 0)? min - 1: min + 1);

    // Keep everything in order
    if(min > max)
        [min, max] = [max, min];

    // clamp.js - https://www.webtips.dev/webtips/javascript/how-to-clamp-numbers-in-javascript
    return Math.min(Math.max(this, min), max);
};

// Adds all Math prototypes to Numbers
    // Math... → Number...
Number['#Math'] = (parent => {
    let methods = Object.getOwnPropertyNames(parent);

    for(let method of methods) {
        let $ = parent[method];

        if(typeof $ != 'function')
            continue;

        Number.prototype[method] = function(...parameters) {
            return $(this, ...parameters);
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

// Determines if the string is missing all of the value(s)
    // String..missing(...values:any) → boolean
String.prototype.missing ??= function missing(...values) {
    return !this.contains(...values);
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
                // alumnus → alumni
                case 'alumni': /* "alumni" is the plural of "alumnus" */
                case 'alumnus': {
                    string = toFormat('alumni', pattern);
                } break;

                // appendix → appendicies
                case 'appendicies': /* "appendicies" is the plural of "appendix" */
                case 'appendix': {
                    string = toFormat('appendicies', pattern);
                } break;

                // ax | axe | axis → axes
                case 'ax':
                case 'axe':
                case 'axes': /* "axes" is the plural of "ax" , "axe", and "axis" */
                case 'axis': {
                    string = toFormat('axes', pattern);
                } break;

                // bacterium → bacteria
                case 'bacteria': /* "bacteria" is the plural of "bacterium" */
                case 'bacterium': {
                    string = toFormat('bacteria', pattern);
                } break;

                // cactus → cacti
                case 'cacti': /* "cacti" is the plural of "cactus" */
                case 'cactus': {
                    string = toFormat('cacti', pattern);
                } break;

                // calf → calves
                case 'calves': /* "calves" is the plural of "calf" */
                case 'calf': {
                    string = toFormat('calves', pattern);
                } break;

                // cello → celli
                case 'celli': /* "celli" is the plural of "cello" */
                case 'cello': {
                    string = toFormat('celli', pattern);
                } break;

                // child → children
                case 'children': /* "children" is the plural of "child" */
                case 'child': {
                    string = toFormat('children', pattern);
                } break;

                // curriculum → curricula
                case 'curricula': /* "curricula" is the plural of "curriculum" */
                case 'curriculum': {
                    string = toFormat('curricula', pattern);
                } break;

                // datum → data
                case 'data': /* "data" is the plural of "datum" */
                case 'datum': {
                    string = toFormat('data', pattern);
                } break;

                // die → dice
                case 'dice': /* "dice" is the plural of "die" */
                case 'die': {
                    string = toFormat('dice', pattern);
                } break;

                // focus → foci
                case 'foci': /* "foci" is the plural of "focus" */
                case 'focus': {
                    string = toFormat('foci', pattern);
                } break;

                // foot → feet
                case 'feet': /* "feet" is the plural of "foot" */
                case 'foot': {
                    string = toFormat('feet', pattern);
                } break;

                // fungus → fungi
                case 'fungi': /* "fungi" is the plural of "fungus" */
                case 'fungus': {
                    string = toFormat('fungi', pattern);
                } break;

                // goose → geese
                case 'geese': /* "geese" is the plural of "goose" */
                case 'goose': {
                    string = toFormat('geese', pattern);
                } break;

                // halo → halos
                case 'halos': /* "halos" is the plural of "halo" */
                case 'halo': {
                    string = toFormat('halos', pattern);
                } break;

                // hippopotamus → hippopotami
                case 'hippopotami': /* "hippopotami" is the plural of "hippopotamus" */
                case 'hippopotamus': {
                    string = toFormat('hippopotami', pattern);
                } break;

                // index → indices
                case 'indices': /* "indices" is the plural of "index" */
                case 'index': {
                    string = toFormat('indices', pattern);
                } break;

                // knife → knives
                case 'knives': /* "knives" is the plural of "knife" */
                case 'knife': {
                    string = toFormat('knives', pattern);
                } break;

                // leaf → leaves
                case 'leaves': /* "leaves" is the plural of "leaf" */
                case 'leaf': {
                    string = toFormat('leaves', pattern);
                } break;

                // life → lives
                case 'lives': /* "lives" is the plural of "life" */
                case 'life': {
                    string = toFormat('lives', pattern);
                } break;

                // man → men
                case 'men': /* "men" is the plural of "man" */
                case 'man': {
                    string = toFormat('men', pattern);
                } break;

                // memorandum → memoranda
                case 'memoranda': /* "memoranda" is the plural of "memorandum" */
                case 'memorandum': {
                    string = toFormat('memoranda', pattern);
                } break;

                // mouse → mice
                case 'mice': /* "mice" is the plural of "mouse" */
                case 'mouse': {
                    string = toFormat('mice', pattern);
                } break;

                // nucleus → nuclei
                case 'nuclei': /* "nuclei" is the plural of "nucleus" */
                case 'nucleus': {
                    string = toFormat('nuclei', pattern);
                } break;

                // octopus → octopi (informal)
                case 'octopi': /* "octopi" is the plural of "octopus" */
                case 'octopus': {
                    string = toFormat('octopi', pattern);
                } break;

                // ox → oxen
                case 'oxen': /* "oxen" is the plural of "ox" */
                case 'ox': {
                    string = toFormat('oxen', pattern);
                } break;

                // person → people
                case 'people': /* "people" is the plural of "person" */
                case 'person': {
                    string = toFormat('people', pattern);
                } break;

                // photo → photos
                case 'photos': /* "photos" is the plural of "photo" */
                case 'photo': {
                    string = toFormat('photos', pattern);
                } break;

                // piano → pianos
                case 'pianos': /* "pianos" is the plural of "piano" */
                case 'piano': {
                    string = toFormat('pianos', pattern);
                } break;

                // radius → radii
                case 'radii': /* "radii" is the plural of "radius" */
                case 'radius': {
                    string = toFormat('radii', pattern);
                } break;

                // stratum → strata
                case 'strata': /* "strata" is the plural of "stratum" */
                case 'stratum': {
                    string = toFormat('strata', pattern);
                } break;

                // tooth → teeth
                case 'teeth': /* "teeth" is the plural of "tooth" */
                case 'tooth': {
                    string = toFormat('teeth', pattern);
                } break;

                // vortex → vortices
                case 'vortices': /* "vortices" is the plural of "vortex" */
                case 'vortex': {
                    string = toFormat('vortices', pattern);
                } break;

                // wife → wives
                case 'wives': /* "wives" is the plural of "wife" */
                case 'wife': {
                    string = toFormat('wives', pattern);
                } break;

                // wolf → wolves
                case 'wolves': /* "wolves" is the plural of "wolf" */
                case 'wolf': {
                    string = toFormat('wolves', pattern);
                } break;

                // woman → women
                case 'women': /* "women" is the plural of "woman" */
                case 'woman': {
                    string = toFormat('women', pattern);
                } break;

                // No change
                case 'aircraft':
                case 'buffalo':
                case 'deer':
                case 'fish':    // fish → fish (multiple fish, single type: mono-plural)
                case 'fishes':  // fish → fishes (multiple fish, multiple types: multi-plural)
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
                    if(/([cs]h|[osxz])$/i.test(string))
                        string += toFormat('es', pattern);
                    // "bus" → "busses"
                    else if(/([^aeiou][aeiou])([sz])$/i.test(string))
                        string += RegExp.$2 + toFormat('es', pattern);
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
    // isObj(object:any, ...or?<Function>) → boolean
function isObj(object, ...or) {
    return defined(
        [Object, Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array, ...or]
            .find(constructor => object?.constructor === constructor || object instanceof constructor)
    );
}

// Returns a number formatted with commas
function comify(number, locale = window.LANGUAGE) {
    return parseFloat(number).toLocaleString(locale);
}

// Returns a string reformatted
    // toFormat(string:string|array, pattern:string)
function toFormat(string, patterns) {
    patterns = patterns.split('-');

    let nonWords = /[\s\.\-\+]+/;
    if(string instanceof Array)
        for(let pattern of patterns)
            switch(pattern) {
                case 'capped': {
                    string = string.map(s => s.toLowerCase().replace(/(\w)/, ($0, $1, $$, $_) => $1.toUpperCase()));
                } break;

                case 'upper': {
                    string = string.map(s => s.toUpperCase());
                } break;

                case 'lower': {
                    string = string.map(s => s.toLowerCase());
                } break;

                case 'dotted': {
                    string = string.join('.');
                } break;

                case 'dashed': {
                    string = string.join('-');
                } break;

                case 'plused': {
                    string = string.join('+');
                } break;

                case 'spaced': {
                    string = string.join(' ');
                } break;

                case 'padded': {
                    string = string.replace(/([\s\.\-\+])+/g, ' $1 ').trim();
                } break;

                default: {
                    string = string.join('');
                } break;
            }
    else
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

                case 'plused': {
                    string = string.split(nonWords).join('+');
                } break;

                case 'spaced': {
                    string = string.split(nonWords).join(' ');
                } break;

                case 'padded': {
                    string = string.replace(/([^\w\s])+/g, ' $1 ').trim();
                } break;
            }

    return string;
}

// https://stackoverflow.com/a/19176790/4211612
// Returns the assumed operating system
    // GetOS(is:string?) → string | boolean
function GetOS(is = null) {
    let { userAgent } = window.navigator;
    let OSs = {
        'NT 12.0': 'Win 12',
        'NT 11.0': 'Win 11',
        'NT 10.0': 'Win 10',
        'NT 6.3': 'Win 8.1',
        'NT 6.2': 'Win 8',
        'NT 6.1': 'Win 7',
        'NT 6.0': 'Win Vista',
        'NT 5.1': 'Win XP',
        'NT 5.0': 'Win 2000',

        'Mac': 'Macintosh',

        'X11': 'UNIX',
        'Linux': 'Linux',
    };

    let os = 'Unknown';
    for(let OS in OSs)
        if(userAgent.contains(OS))
            os = OSs[OS].replace(/^Win/, 'Windows');

    return (defined(is)? os.toLowerCase().startsWith(is.toLowerCase()): os);
}

Object.defineProperties(GetOS, {
    MAC: { value: 'Macintosh' },

    X11: { value: 'Unix' },
    UNIX: { value: 'Unix' },

    WIN_12: { value: 'Windows 12' },
    WIN_11: { value: 'Windows 11' },
    WIN_10: { value: 'Windows 10' },
    WIN_8_1: { value: 'Windows 8.1' },
    WIN_8: { value: 'Windows 8' },
    WIN_7: { value: 'Windows 7' },
    WIN_VISTA: { value: 'Windows Vista' },
    WIN_XP: { value: 'Windows XP' },
    WIN_2000: { value: 'Windows 2000' },
});

// Returns the assumed key combination
    // GetMacro(keys:string, OS:string?) → string
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
        /[\S]\s*\.\s*[\S]/i.test(keys)?
            'dotted':
        /[\S]\s*\-\s*[\S]/i.test(keys)?
            'dashed':
        /[\S]\s*\+\s*[\S]/i.test(keys)?
            'plused':
        /[\S]\s+[\S]/i.test(keys)?
            'spaced':
        ''
    ,
        /[\S]\s+[\S]/i.test(keys)?
            'padded':
        ''
    ].filter(string => string.length).join('-');

    // Mouse buttons (emojis)
    let Mouse = {
        AClick: 'primary_mouse_button',
        aclick: 'Left Click',

        BClick: 'secondary_mouse_button',
        bclick: 'Right Click',
    };

    keys = keys
        .split(/[\s\-\+\.]+/)
        .filter(string => !!string.length)
        .sort((keyA, keyB) => {
            let map;
            switch(OS) {
                case GetOS.MAC: {
                    map = 'ctrl opt shift cmd'.split(' ');
                } break;

                default: {
                    map = 'meta ctrl alt shift'.split(' ');
                } break;
            }

            keyA = keyA.toLowerCase();
            keyB = keyB.toLowerCase();

            if(map.missing(keyA) && map.contains(keyB))
                return +1;
            if(map.contains(keyA) && map.missing(keyB))
                return -1;
            return map.indexOf(keyA) - map.indexOf(keyB);
        })
        .map(key => {
            switch(OS.slice(0, 7)) {
                /** MacOS Keys | Order of Precedence → Ctrl Opt Shift Cmd [Key(s)]
                 * Control (Ctrl)       ^
                 * Option/Alt (Opt/Alt) ⎇ / ⌥
                 * Shift                ⇧
                 * Command (Cmd)        ⌘ ⊞
                 * Caps Lock            ⇪
                 * Escape (Esc)         ⎋
                 * Tab                  ↹
                 * Enter / Return       ↵
                 * Backspace            ⌫
                 * Delete (Del)         ⌦
                 * Print Screen (PrtSc) ⎙
                 * Num Lock             ⇭
                 * Scroll Lock          ⤓
                 */
                case GetOS.MAC: {
                    return (
                        // /^(Ctrl|Control)$/i.test(key)?
                        //     '^':
                        /^(Esc)$/i.test(key)?
                            '\u238B':
                        /^(Tab)$/i.test(key)?
                            '\u21B9':
                        /^(Enter|Return)$/i.test(key)?
                            '\u21B5':
                        /^(Delete)$/i.test(key)?
                            '\u2326':
                        /^(PrtSc)$/i.test(key)?
                            '\u2399':
                        /^(NumLock)$/i.test(key)?
                            '\u21ED':
                        /^(Backspace)$/i.test(key)?
                            '\u232B':
                        /^(ScrollLock)$/i.test(key)?
                            '\u2913':
                        /^(Win|Meta)$/i.test(key)?
                            '\u2318':
                        /^(Alt|Opt(?:ion)?)$/i.test(key)?
                            '\u2325':
                        /^(Shift)$/i.test(key)?
                            '\u21e7':
                        /^([AB]Click)$/.test(key)?
                            Glyphs.utf8[Mouse[RegExp.$1]]:
                        key
                    );
                } break;

                /** Windows & *nix Keys | Order of Precedence → Meta Ctrl Alt Shift [Key(s)]
                 * Control (Ctrl)       ^
                 * Option/Alt (Opt/Alt) ⎇ / ⌥
                 * Shift                ⇧
                 * Command (Cmd)        ⌘ ⊞
                 * Caps Lock            ⇪
                 * Escape (Esc)         ⎋
                 * Tab                  ↹
                 * Enter / Return       ↵
                 * Backspace            ⌫
                 * Delete (Del)         ⌦
                 * Print Screen (PrtSc) ⎙
                 * Num Lock             ⇭
                 * Scroll Lock          ⤓
                 */
                default: {
                    return (
                        /^(Ctrl|Control)$/i.test(key)?
                            'Ctrl':
                        /^(Esc|\u238B)$/i.test(key)?
                            'Esc':
                        /^(Tab|\u21B9)$/i.test(key)?
                            'Tab':
                        /^(Enter|Return|\u21B5)$/i.test(key)?
                            'Enter':
                        /^(Delete|\u2326)$/i.test(key)?
                            'Del':
                        /^(PrtSc|\u2399)$/i.test(key)?
                            'PrtSc':
                        /^(NumLock|\u21ED)$/i.test(key)?
                            'NumLk':
                        /^(Backspace|\u232B)$/i.test(key)?
                            'Backspace':
                        /^(ScrollLock|\u2913)$/i.test(key)?
                            'ScrLk':
                        /^(Cmd|Win|Meta|\u2318)$/i.test(key)?
                            'Win':
                        /^(Alt|Opt(?:ion)?|\u2325)$/i.test(key)?
                            'Alt':
                        /^(Shift|\u21e7)$/i.test(key)?
                            'Shift':
                        /^([AB]Click)$/.test(key)?
                            Mouse[RegExp.$1.toLowerCase()]:
                        key
                    );
                } break;
            };
        });

    return toFormat(keys, pattern);
}

// Returns particulars about an OS' filesystem
    // GetFileSystem(OS:string?) → object
function GetFileSystem(OS = null) {
    OS ??= GetOS();

    let { assign } = Object,
        composable = { composable: true, writable: true, printable: true },
        writable = { composable: false, writable: true, printable: true };

    let acceptableFilenames, unacceptableFilenameCharacters, illegalFilenameCharacters, allIllegalFilenameCharacters, directorySeperator, lineDelimeter;
    // Composable → Can the character be created and displayed within a native <input> easily (2 or less keypresses)?
    // Writable → Can the character be created within a native <input> easily (a single keypress)?
    // Printable → Can the character be displayed natively on the screen or printer?
    let characterNames = {
        '\\0': assign('null', { composable: false, writable: false, printable: false }),
        '\\b': assign('backspace', { composable: false, writable: true, printable: false }),
        '\\t': assign('tab', writable),
        '\\n': assign('newline', writable),
        '\\v': assign('vertical-tab', writable),
        '\\f': assign('form-feed', writable),
        '\\r': assign('carriage-return', writable),
        ' ': assign('space', composable),
        '!': assign('exclamation mark', composable),
        '"': assign('quotation mark', composable),
        '#': assign('pound sign', composable),
        '$': assign('dollar sign', composable),
        '%': assign('percent sign', composable),
        '&': assign('ampersand', composable),
        "'": assign('apostrophe', composable),
        '(': assign('opening perenthesis', composable),
        ')': assign('closing parenthesis', composable),
        '*': assign('asterisk', composable),
        '+': assign('plus sign', composable),
        ',': assign('comma', composable),
        '-': assign('minus sign', composable),
        '.': assign('period', composable),
        '/': assign('forward slash', composable),
        ':': assign('colon', composable),
        ';': assign('semicolon', composable),
        '<': assign('less-than sign', composable),
        '=': assign('equal sign', composable),
        '>': assign('greater-than sign', composable),
        '?': assign('question mark', composable),
        '@': assign('at sign', composable),
        '[': assign('opening bracket', composable),
        '\\': assign('backward slash', composable),
        ']': assign('closing bracket', composable),
        '^': assign('caret', composable),
        '_': assign('underscore', composable),
        '`': assign('grave mark', composable),
        '{': assign('opening brace', composable),
        '|': assign('pipe', composable),
        '}': assign('closing brace', composable),
        '~': assign('tilde', composable),
    };

    switch(OS) {
        case GetOS.MAC: {
            acceptableFilenames = /[^\x00-\x1f:]/;
            unacceptableFilenameCharacters = ['\\b', '\\t', '\\n', '\\v', '\\f', '\\r', ':'];
            illegalFilenameCharacters = /[\x00-\x1f:]/;
            allIllegalFilenameCharacters = /[\x00-\x1f:]+/g;
            directorySeperator = '/';
            lineDelimeter = '\r';
        } break;

        case GetOS.LINUX:
        case GetOS.UNIX: {
            acceptableFilenames = /[^\0\/]/;
            unacceptableFilenameCharacters = ['\\0', '/'];
            illegalFilenameCharacters = /[\0\/]/;
            allIllegalFilenameCharacters = /[\0\/]+/g;
            directorySeperator = '/';
            lineDelimeter = '\n';
        } break;

        default: {
            acceptableFilenames = /^(?!(^|PRN|AUX|CLOCK\$|NUL|CON|(COM|LPT)[1-9])(\..*)?$)[^\x00-\x1f\\?*:\u0022;\|\/]+$/;
            unacceptableFilenameCharacters = ['\\b', '\\t', '\\n', '\\v', '\\f', '\\r', '\\', '?', '*', ':', '"', ';', '|', '/'];
            illegalFilenameCharacters = /[\x00-\x1f\\?*:\u0022;\|\/]/;
            allIllegalFilenameCharacters = /[\x00-\x1f\\?*:\u0022;\|\/]+/g;
            directorySeperator = '\\';
            lineDelimeter = '\r\n';
        } break;
    }

    return { acceptableFilenames, unacceptableFilenameCharacters, illegalFilenameCharacters, allIllegalFilenameCharacters, directorySeperator, lineDelimeter, characterNames };
}

// Logs messages (green)
    // LOG(...messages:any) → undefined
function LOG(...messages) {
    // return console.error(...messages);

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

        (type/*.equals('o')*/)?
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

        toForeignStack(stack = console.log) {
            return stack(messages.join(' '));
        },
    });
};

// Logs warnings (yellow)
    // WARN(...messages:any) → undefined
function WARN(...messages) {
    // return console.error(...messages);

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

        (type/*.equals('o')*/)?
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

        toForeignStack(stack = console.warn) {
            return stack(messages.join(' '));
        },
    });
};

// Logs errors (red)
    // ERROR(...messages:any) → undefined
function ERROR(...messages) {
    // return console.error(...messages);

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

        (type/*.equals('o')*/)?
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

        toForeignStack(stack = console.error) {
            return stack(messages.join(' '));
        },
    });
};

// Logs comments (blue)
    // REMARK(...messages:any) → undefined
function REMARK(...messages) {
    // return console.error(...messages);

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

        (type/*.equals('o')*/)?
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

        toForeignStack(stack = console.log) {
            return stack(messages.join(' '));
        },
    });
};

// Logs notices (pink)
    // NOTICE(...messages:any) → undefined
function NOTICE(...messages) {
    // return console.error(...messages);

    let CSS = `
        background-color: #747;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #e8e;
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

    console.group(`%c\u22b3 [NOTICE] \u2014 Twitch Tools`, CSS);

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

        (type/*.equals('o')*/)?
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

        toForeignStack(stack = console.log) {
            return stack(messages.join(' '));
        },
    });
};

// Logs nothing (white)
    // IGNORE(...messages:any) → undefined
function IGNORE(...messages) {
    // return console.error(...messages);

    let CSS = `
        background-color: #777;
        border-bottom: 1px solid #0000;
        border-top: 1px solid #eee;
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

    console.groupCollapsed(`%c\u22b3 [IGNORE] \u2014 Twitch Tools`, CSS);

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

        (type/*.equals('o')*/)?
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

        toForeignStack(stack = console.log) {
            return stack(messages.join(' '));
        },
    });
};

// "Clicks" on elements
function phantomClick(...elements) {
    for(let element of elements) {
        let mousedown = new MouseEvent('mousedown', { bubbles: false }),
            mouseup = new MouseEvent('mouseup', { bubbles: false });

        element?.dispatchEvent(mousedown);
        wait(100).then(() => element?.dispatchEvent(mouseup));
    }
}

setInterval(() => {
    if($.all('.tt-post').length > 1)
        $('.tt-post [class*="container"i]').setAttribute('count', $.all('.tt-post').length);
    else
        $('.tt-post [class*="container"i]')?.removeAttribute('count');
}, 250);

/***
 *               _           _
 *         /\   | |         | |
 *        /  \  | | ___ _ __| |_
 *       / /\ \ | |/ _ \ '__| __|
 *      / ____ \| |  __/ |  | |_
 *     /_/    \_\_|\___|_|   \__|
 *
 *
 */
// Displays an alert message
    // alert(message:string?) → Promise
function alert(message = '') {
    if(alert.done.contains(message))
        return alert.done.fetch(message);

    if($.defined('.tt-alert'))
        return when(() => $.nullish('.tt-alert')).then(() => alert(message));

    let f = furnish;
    let $DOM = (alert.parser ??= new DOMParser).parseFromString(message, 'text/html'),
        $CNT = $('[controller]', $DOM);

    let title = (null
        ?? $CNT?.getAttribute('title')
        ?? `TTV Tools &mdash; Please see...`
    ),
        icon = (null
            ?? $CNT?.getAttribute('icon')
            ?? ''
        ),
        okay = decodeHTML(null
            ?? $CNT?.getAttribute('okay')
            ?? 'OK'
        );

    let container =
    f('.tt-post.tt-alert', { uuid: UUID.from(message).value },
        f('.tt-alert-container', { ['icon'.repeat(+!!icon.length)]: icon },
            f('.tt-alert-header').html(title),
            f('.tt-alert-body').html(message),
            f('.tt-alert-footer').with(
                f('button.okay', {
                    onmousedown(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-alert').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-alert');

                        parent.setAttribute('value', true);
                    },
                    onmouseup(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-alert').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-alert'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    disregard() {
                        let disabled = this.closest('.tt-alert').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = this.closest('.tt-alert'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.setAttribute('value', true);
                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    innerHTML: okay,
                })
            )
        )
    );

    document.body.append(container);

    let value = when.defined(() => {
        let element = $('.tt-alert'),
            value = element?.getAttribute('value'),
            timedOut = parseBool($('.tt-alert-time', element)?.getAttribute('tt-done'));

        value &&= parseBool(value);

        if(timedOut) {
            let button = $('button.okay', element);

            button.disregard();

            return when.void;
        }

        return (value? when.void: null);
    });

    alert.done.deposit(message, value);
    return value;
}

Object.defineProperties(alert, {
    lifetime: {
        value: 60_000,

        writable: false,
        enumerable: false,
        configurable: false,
    },
    done: {
        value: (map => {
            map.convert = key => [key, (+new Date).floorToNearest(alert.lifetime).toString(36)].map(k => UUID.from(k).toStamp()).join('-').toUpperCase();

            map.contains = (key = '') => {
                key = alert.done.convert(key);

                return map.has(key);
            };

            map.deposit = (key = '', value) => {
                key = alert.done.convert(key);

                map.set(key, value);
            };

            map.fetch = (key = '') => {
                key = alert.done.convert(key);

                if(map.has(key))
                    return map.get(key);
            };

            return map;
        })(new Map),

        writable: true,
        enumerable: false,
        configurable: false,
    }
});

// Displays an alert message (silently)
    // alert.silent(message:string?, veiled:boolean?) → Promise
alert.silent ??= (message = '', veiled = false) => {
    if(alert.done.contains(message))
        return alert.done.fetch(message);

    if($.defined('.tt-alert'))
        return when(() => $.nullish('.tt-alert')).then(() => alert.silent(message, veiled));

    let response = alert(message),
        container = $('.tt-alert');

    if(nullish(container))
        return when.void;

    if(container.classList.contains('tt-silent'))
        return response;

    container.classList.add('tt-silent');
    setTimeout(() => container.classList.add('tt-veiled'), +!veiled * 7000);

    alert.done.deposit(message, response);
    return response;
};

// Displays an alert message with a timer
    // alert.timed(message:string?, milliseconds:number?, pausable:boolean?) → Promise
alert.timed ??= (message = '', milliseconds = 60_000, pausable = false) => {
    if(alert.done.contains(message))
        return alert.done.fetch(message);

    if($.defined('.tt-alert'))
        return when(() => $.nullish('.tt-alert')).then(() => alert.timed(message, milliseconds, pausable));

    let response = alert.silent(message),
        container = $('.tt-alert');

    if(nullish(container))
        return when.void;

    if(container.classList.contains('tt-timed'))
        return response;

    container.classList.add('tt-timed');
    $('.tt-alert-header').append(
        furnish('span.tt-alert-time', { due: (+new Date) + milliseconds }, toTimeString(milliseconds))
    );

    let intervalID = setInterval(() => {
        let time = $('.tt-alert-time'),
            due = parseInt(time?.getAttribute('due')),
            milliseconds = (+new Date(due) - (+new Date));

        if(nullish(time))
            return clearInterval(intervalID);

        if(pausable && $.all('*:is(:hover, :focus-within)').contains(time.closest('.tt-alert-container')))
            return time.setAttribute('due', due + 250);

        time.closest('.tt-alert-container').setAttribute('tt-time-left', time.innerText = toTimeString((milliseconds < 0? 0: milliseconds), 'clock').replace(/^[0:]+(?<!$)/, ''));
        time.setAttribute('tt-done', milliseconds < 0);
    }, 250);

    container.dataset.intervalId = intervalID;

    alert.done.deposit(message, response);
    return response;
};

/***
 *       _____             __ _
 *      / ____|           / _(_)
 *     | |     ___  _ __ | |_ _ _ __ _ __ ___
 *     | |    / _ \| '_ \|  _| | '__| '_ ` _ \
 *     | |___| (_) | | | | | | | |  | | | | | |
 *      \_____\___/|_| |_|_| |_|_|  |_| |_| |_|
 *
 *
 */
// Displays a confirmation message
    // confirm(message:string?) → boolean | null
function confirm(message = '') {
    if(confirm.done.contains(message))
        return confirm.done.fetch(message);

    if($.defined('.tt-confirm'))
        return when(() => $.nullish('.tt-confirm')).then(() => confirm(message));

    let f = furnish;
    let $DOM = (confirm.parser ??= new DOMParser).parseFromString(message, 'text/html'),
        $CNT = $('[controller]', $DOM);

    let title = (null
        ?? $CNT?.getAttribute('title')
        ?? `TTV Tools &mdash; Please confirm...`
    ),
        icon = (null
            ?? $CNT?.getAttribute('icon')
            ?? ''
        ),
        okay = decodeHTML(null
            ?? $CNT?.getAttribute('okay')
            ?? 'OK'
        ),
        deny = decodeHTML(null
            ?? $CNT?.getAttribute('deny')
            ?? 'Cancel'
        );

    let container =
    f('.tt-post.tt-confirm', { uuid: UUID.from(message).value },
        f('.tt-confirm-container', { ['icon'.repeat(+!!icon.length)]: icon },
            f('.tt-confirm-header').html(title),
            f('.tt-confirm-body').html(message),
            f('.tt-confirm-footer').with(
                f('button.edit.deny', {
                    onmousedown(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-confirm').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-confirm');

                        parent.setAttribute('value', false);
                    },
                    onmouseup(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-confirm').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-confirm'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    disregard() {
                        let disabled = this.closest('.tt-confirm').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = this.closest('.tt-confirm'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.setAttribute('value', false);
                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    innerHTML: deny,
                }),

                f('button.okay', {
                    onmousedown(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-confirm').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-confirm');

                        parent.setAttribute('value', true);
                    },
                    onmouseup(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-confirm').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-confirm'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    disregard() {
                        let disabled = this.closest('.tt-confirm').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = this.closest('.tt-confirm'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.setAttribute('value', true);
                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    innerHTML: okay,
                })
            )
        )
    );

    document.body.append(container);

    let value = when.defined(() => {
        let element = $('.tt-confirm'),
            value = element?.getAttribute('value'),
            timedOut = parseBool($('.tt-confirm-time', element)?.getAttribute('tt-done'));

        value &&= parseBool(value);

        if(timedOut) {
            let button = $('button.deny', element);

            button.disregard();

            return when.null;
        }

        return value;
    });

    confirm.done.deposit(message, value);
    return value;
}

Object.defineProperties(confirm, {
    lifetime: {
        value: 60_000,

        writable: false,
        enumerable: false,
        configurable: false,
    },
    done: {
        value: (map => {
            map.convert = key => [key, (+new Date).floorToNearest(confirm.lifetime).toString(36)].map(k => UUID.from(k).toStamp()).join('-').toUpperCase();

            map.contains = (key = '') => {
                key = confirm.done.convert(key);

                return map.has(key);
            };

            map.deposit = (key = '', value) => {
                key = confirm.done.convert(key);

                map.set(key, value);
            };

            map.fetch = (key = '') => {
                key = confirm.done.convert(key);

                if(map.has(key))
                    return map.get(key);
            };

            return map;
        })(new Map),

        writable: true,
        enumerable: false,
        configurable: false,
    }
});

// Displays a confirmation message (silently)
    // confirm.silent(message:string?, veiled:boolean?) → boolean | null
confirm.silent ??= (message = '', veiled = false) => {
    if(confirm.done.contains(message))
        return confirm.done.fetch(message);

    if($.defined('.tt-confirm'))
        return when(() => $.nullish('.tt-confirm')).then(() => confirm.silent(message, veiled));

    let response = confirm(message),
        container = $('.tt-confirm');

    if(nullish(container))
        return when.void;

    if(container.classList.contains('tt-silent'))
        return response;

    container.classList.add('tt-silent');
    setTimeout(() => container.classList.add('tt-veiled'), +!veiled * 7000);

    confirm.done.deposit(message, response);
    return response;
};

// Displays a confirmation message with a timer
    // confirm.timed(message:string?, milliseconds:number?, pausable:boolean?) → boolean | null
confirm.timed ??= (message = '', milliseconds = 60_000, pausable = false) => {
    if(confirm.done.contains(message))
        return confirm.done.fetch(message);

    if($.defined('.tt-confirm'))
        return when(() => $.nullish('.tt-confirm')).then(() => confirm.timed(message, milliseconds, pausable));

    let response = confirm.silent(message),
        container = $('.tt-confirm');

    if(nullish(container))
        return when.void;

    if(container.classList.contains('tt-timed'))
        return response;

    container.classList.add('tt-timed');
    $('.tt-confirm-header').append(
        furnish('span.tt-confirm-time', { due: (+new Date) + milliseconds }, toTimeString(milliseconds))
    );

    let intervalID = setInterval(() => {
        let time = $('.tt-confirm-time'),
            due = parseInt(time?.getAttribute('due')),
            milliseconds = (+new Date(due) - (+new Date));

        if(nullish(time))
            return clearInterval(intervalID);

        if(pausable && $.all('*:is(:hover, :focus-within)').contains(time.closest('.tt-confirm-container')))
            return time.setAttribute('due', due + 250);

        time.closest('.tt-confirm-container').setAttribute('tt-time-left', time.innerText = toTimeString((milliseconds < 0? 0: milliseconds), 'clock').replace(/^[0:]+(?<!$)/, ''));
        time.setAttribute('tt-done', milliseconds < 0);
    }, 250);

    container.dataset.intervalId = intervalID;

    confirm.done.deposit(message, response);
    return response;
};

/***
 *      _____                           _
 *     |  __ \                         | |
 *     | |__) | __ ___  _ __ ___  _ __ | |_
 *     |  ___/ '__/ _ \| '_ ` _ \| '_ \| __|
 *     | |   | | | (_) | | | | | | |_) | |_
 *     |_|   |_|  \___/|_| |_| |_| .__/ \__|
 *                               | |
 *                               |_|
 */
// Prompts a message
    // prompt(message:string?, defaultValue:string?) → string | null
function prompt(message = '', defaultValue = '') {
    if(prompt.done.contains(message))
        return prompt.done.fetch(message);

    if($.defined('.tt-prompt'))
        return when(() => $.nullish('.tt-prompt')).then(() => prompt(message));

    let f = furnish;
    let $DOM = (prompt.parser ??= new DOMParser).parseFromString(message, 'text/html'),
        $CNT = $('[controller]', $DOM);

    let title = (null
        ?? $CNT?.getAttribute('title')
        ?? `TTV Tools &mdash; Please provide input...`
    ),
        icon = (null
            ?? $CNT?.getAttribute('icon')
            ?? ''
        ),
        okay = decodeHTML(null
            ?? $CNT?.getAttribute('okay')
            ?? 'OK'
        ),
        deny = decodeHTML(null
            ?? $CNT?.getAttribute('deny')
            ?? 'Cancel'
        ),
        type = (null
            ?? $CNT?.getAttribute('type')
            ?? (
                /\p{N}/u.test(defaultValue)?
                    'number':
                (/^[\*\u00b7\u2219\u2022]{4,}$/.test(defaultValue) && !(defaultValue = ''))?
                    'password':
                'text'
            )
        ),
        placeholder = (null
            ?? $CNT?.getAttribute('placeholder')
            ?? $CNT?.getAttribute('format')
            ?? (
                parseBool(defaultValue)?
                    `Default: ${ defaultValue }`:
                ''
            )
        ),
        pattern = (null
            ?? $CNT?.getAttribute('pattern')
            ?? $CNT?.getAttribute('regexp')
            ?? '[^$]*'
        );

    let container =
    f('.tt-post.tt-prompt', { uuid: UUID.from(message).value },
        f('.tt-prompt-container', { ['icon'.repeat(+!!icon.length)]: icon },
            f('.tt-prompt-header').html(title),
            f('.tt-prompt-body').html(message),
            f('.tt-prompt-footer').with(
                f('input.tt-prompt-input', {
                    type, pattern, placeholder,

                    onkeydown({ currentTarget, isTrusted = false, keyCode = -1, altKey = false, ctrlKey = false, metaKey = false, shiftKey = false }) {
                        if(isTrusted && keyCode == 13 && !(altKey || ctrlKey || metaKey || shiftKey))
                            currentTarget.closest('.tt-prompt-footer').querySelector('button.okay').disregard();
                    }
                }),

                f('button.edit.deny', {
                    onmousedown(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-prompt').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-prompt');

                        parent.setAttribute('value', '\0');
                    },
                    onmouseup(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-prompt').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-prompt'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    innerHTML: deny,
                }),

                f('button.okay', {
                    onmousedown(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-prompt').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-prompt');

                        parent.setAttribute('value', $('.tt-prompt-input', parent).value);
                    },
                    onmouseup(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-prompt').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-prompt'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    disregard() {
                        let disabled = this.closest('.tt-prompt').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = this.closest('.tt-prompt'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.setAttribute('value', $('.tt-prompt-input', parent).value);
                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    innerHTML: okay,
                })
            )
        )
    );

    document.body.append(container);

    $('.tt-prompt-input', container).value = defaultValue;

    let value = when.defined(() => {
        let element = $('.tt-prompt'),
            value = element?.getAttribute('value'),
            timedOut = parseBool($('.tt-prompt-time', element)?.getAttribute('tt-done'));

        if(timedOut) {
            let button = $('button.deny', element);

            button.disregard();

            return when.null;
        }

        return (value == '\0'? when.null: value);
    });

    prompt.done.deposit(message, value);
    return value;
}

Object.defineProperties(prompt, {
    lifetime: {
        value: 60_000,

        writable: false,
        enumerable: false,
        configurable: false,
    },
    done: {
        value: (map => {
            map.convert = key => [key, (+new Date).floorToNearest(prompt.lifetime).toString(36)].map(k => UUID.from(k).toStamp()).join('-').toUpperCase();

            map.contains = (key = '') => {
                key = prompt.done.convert(key);

                return map.has(key);
            };

            map.deposit = (key = '', value) => {
                key = prompt.done.convert(key);

                map.set(key, value);
            };

            map.fetch = (key = '') => {
                key = prompt.done.convert(key);

                if(map.has(key))
                    return map.get(key);
            };

            return map;
        })(new Map),

        writable: true,
        enumerable: false,
        configurable: false,
    }
});

// Prompts a message (silently)
    // prompt.silent(message:string?, defaultValue:string?, veiled:boolean?) → string | null
prompt.silent ??= (message = '', defaultValue = '', veiled = false) => {
    if(prompt.done.contains(message))
        return prompt.done.fetch(message);

    if($.defined('.tt-prompt'))
        return when(() => $.nullish('.tt-prompt')).then(() => prompt.silent(message, defaultValue, veiled));

    let response = prompt(message, defaultValue),
        container = $('.tt-prompt');

    if(nullish(container))
        return when.void;

    if(container.classList.contains('tt-silent'))
        return response;

    container.classList.add('tt-silent');
    setTimeout(() => container.classList.add('tt-veiled'), +!veiled * 7000);

    prompt.done.deposit(message, response);
    return response;
};

// Prompts a message with a timer
    // prompt.timed(message:string?, milliseconds:number?, pausable:boolean?) → string | null
prompt.timed ??= (message = '', milliseconds = 60_000, pausable = true) => {
    if(prompt.done.contains(message))
        return prompt.done.fetch(message);

    if($.defined('.tt-prompt'))
        return when(() => $.nullish('.tt-prompt')).then(() => prompt.timed(message, milliseconds, pausable));

    let response = prompt.silent(message),
        container = $('.tt-prompt');

    if(nullish(container))
        return when.void;

    if(container.classList.contains('tt-timed'))
        return response;

    container.classList.add('tt-timed');
    $('.tt-prompt-header').append(
        furnish('span.tt-prompt-time', { due: (+new Date) + milliseconds }, toTimeString(milliseconds))
    );

    let intervalID = setInterval(() => {
        let time = $('.tt-prompt-time'),
            due = parseInt(time?.getAttribute('due')),
            milliseconds = (+new Date(due) - (+new Date));

        if(nullish(time))
            return clearInterval(intervalID);

        if(pausable && $.all('*:is(:hover, :focus-within)').contains(time.closest('.tt-prompt-container')))
            return time.setAttribute('due', due + 250);

        time.closest('.tt-prompt-container').setAttribute('tt-time-left', time.innerText = toTimeString((milliseconds < 0? 0: milliseconds), 'clock').replace(/^[0:]+(?<!$)/, ''));
        time.setAttribute('tt-done', milliseconds < 0);
    }, 250);

    container.dataset.intervalId = intervalID;

    prompt.done.deposit(message, response);
    return response;
};

/***
 *       _____      _           _
 *      / ____|    | |         | |
 *     | (___   ___| | ___  ___| |_
 *      \___ \ / _ \ |/ _ \/ __| __|
 *      ____) |  __/ |  __/ (__| |_
 *     |_____/ \___|_|\___|\___|\__|
 *
 *
 */
// Selects an option
    // select(message:string?, options:array?|object?, multiple:boolean?) → string<number|array:number> | null
function select(message = '', options = [], multiple = false) {
    if(select.done.contains(message))
        return select.done.fetch(message);

    if($.defined('.tt-select'))
        return when(() => $.nullish('.tt-select')).then(() => select(message, options, multiple));

    let f = furnish;
    let $DOM = (select.parser ??= new DOMParser).parseFromString(message, 'text/html'),
        $CNT = $('[controller]', $DOM);

    let title = (null
        ?? $CNT?.getAttribute('title')
        ?? `TTV Tools &mdash; Please select ${ (multiple? 'any options': 'an option') }...`
    ),
        icon = (null
            ?? $CNT?.getAttribute('icon')
            ?? ''
        ),
        okay = decodeHTML(null
            ?? $CNT?.getAttribute('okay')
            ?? 'OK'
        ),
        deny = decodeHTML(null
            ?? $CNT?.getAttribute('deny')
            ?? 'Cancel'
        );

    let __values__ = [],
        __names__ = {};

    if(isObj(options))
        switch(options.constructor) {
            // Array → [value, ...] → 'value'
            case Array:
            case Uint8Array:
            case Uint8ClampedArray:
            case Uint16Array:
            case Uint32Array:
            case Int8Array:
            case Int16Array:
            case Int32Array:
            case Float32Array:
            case Float64Array:
            case BigInt64Array:
            case BigUint64Array:
            case WeakSet:
            case Set: {
                for(let index = 0; index < options.length; ++index) {
                    let value = options[index];

                    __values__.push(value);
                    // __names__[value] = index;
                }
            } break;

            // Map → { key => value, ... } → 'value (key)'
            case WeakMap:
            case Map: {
                for(let [key, value] of options) {
                    __values__.push(value);
                    __names__[value] = key;
                }
            } break;

            // Object → { key: value, ... } → 'value (key)'
            case Object: {
                for(let index = 0, keys = Object.keys(options); index < keys.length; ++index) {
                    let key = keys[index],
                        value = options[key];

                    __values__.push(value);
                    __names__[value] = key;
                }
            } break;
        }

    let uuid = UUID.from(message).value;
    let container =
    f('.tt-post.tt-select', { uuid, options: encodeHTML(JSON.stringify(__values__)), keys: encodeHTML(JSON.stringify(__names__)) },
        f('.tt-select-container', { ['icon'.repeat(+!!icon.length)]: icon },
            f('.tt-select-header').html(title),
            f('.tt-select-body').html(message),
            f('.tt-select-footer').with(
                f(`.tt-select-input[@multiple=${ multiple }]`, {
                    onkeydown({ currentTarget, isTrusted = false, keyCode = -1, altKey = false, ctrlKey = false, metaKey = false, shiftKey = false }) {
                        if(isTrusted && keyCode == 13 && !(altKey || ctrlKey || metaKey || shiftKey))
                            currentTarget.closest('.tt-select-footer').querySelector('button.okay').disregard();
                    }
                }, ...__values__
                    .map((option, value) => {
                        let f = furnish,
                            id = (new UUID).value;

                        return f(`.tt-option`, { value },
                            f(`input#${ id }[name=${ uuid }][type=${ (multiple? 'checkbox': 'radio') }]`),
                            f(`label[for=${ id }]`, { value }, option)
                        );
                    })
                ),

                f('button.edit.deny', {
                    onmousedown(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-select').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-select');

                        parent.setAttribute('value', '\0');
                    },
                    onmouseup(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-select').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-select'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    disregard() {
                        let disabled = this.closest('.tt-select').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = this.closest('.tt-select'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.setAttribute('value', '\0');
                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    innerHTML: deny,
                }),

                f('button.okay', {
                    onmousedown(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-select').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-select'),
                            select = $('.tt-select-input', parent),
                            selected = $.all('input:checked', select).map(input => input.closest('.tt-option').value);

                        parent.setAttribute('value', selected);
                    },
                    onmouseup(event) {
                        let { currentTarget } = event;
                        let disabled = currentTarget.closest('.tt-select').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = currentTarget.closest('.tt-select'),
                            intervalID = parseInt(parent.dataset.intervalId || -1);

                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    disregard() {
                        let disabled = this.closest('.tt-select').getAttribute('disabled');

                        if(parseBool(disabled))
                            return;

                        let parent = this.closest('.tt-select'),
                            intervalID = parseInt(parent.dataset.intervalId || -1),
                            select = $('.tt-select-input', parent),
                            selected = $.all('input:checked', select).map(input => input.closest('.tt-option').value);

                        parent.setAttribute('value', selected);
                        parent.classList.add('tt-done');
                        wait(500).then(() => parent.classList.remove('tt-veiled'));
                        wait(1000).then(() => parent.remove());
                        clearInterval(intervalID);
                    },

                    innerHTML: okay,
                })
            )
        )
    );

    document.body.append(container);

    let value = when.defined(() => {
        let element = $('.tt-select'),
            values = element?.getAttribute('value'),
            options = JSON.parse(decodeHTML(element?.getAttribute('options') || 'null')),
            keys = JSON.parse(decodeHTML(element?.getAttribute('keys') || 'null')),
            timedOut = parseBool($('.tt-select-time', element)?.getAttribute('tt-done'));

        if(timedOut) {
            let button = $('button.deny', element);

            button.disregard();

            return when.null;
        }

        return (
            (values == '\0')?
                when.null:
            values?.split(',')?.map(parseFloat)?.filter(isFinite)?.map(index =>
                Object.defineProperties(new Number(index), { value: { value: (keys?.[options[index]] ?? options[index]), enumerable: false, configurable: false, writable: false } })
            )
        );
    });

    select.done.deposit(message, value);
    return value;
}

Object.defineProperties(select, {
    lifetime: {
        value: 60_000,

        writable: false,
        enumerable: false,
        configurable: false,
    },
    done: {
        value: (map => {
            map.convert = key => [key, (+new Date).floorToNearest(select.lifetime).toString(36)].map(k => UUID.from(k).toStamp()).join('-').toUpperCase();

            map.contains = (key = '') => {
                key = select.done.convert(key);

                return map.has(key);
            };

            map.deposit = (key = '', value) => {
                key = select.done.convert(key);

                map.set(key, value);
            };

            map.fetch = (key = '') => {
                key = select.done.convert(key);

                if(map.has(key))
                    return map.get(key);
            };

            return map;
        })(new Map),

        writable: true,
        enumerable: false,
        configurable: false,
    }
});

// Selects an option (silently)
    // select.silent(message:string?, options:array?|object?, multiple:boolean?, veiled:boolean?) → string<number|array:number> | null
select.silent ??= (message = '', options = [], multiple = false, veiled = false) => {
    if(select.done.contains(message))
        return select.done.fetch(message);

    if($.defined('.tt-select'))
        return when(() => $.nullish('.tt-select')).then(() => select.silent(message, options, multiple, veiled));

    let response = select(message, options, multiple),
        container = $('.tt-select');

    if(nullish(container))
        return when.void;

    if(container.classList.contains('tt-silent'))
        return response;

    container.classList.add('tt-silent');
    setTimeout(() => container.classList.add('tt-veiled'), +!veiled * 7000);

    select.done.deposit(message, response);
    return response;
};

// Selects an option with a timer
    // select.timed(message:string?, options:array?|object?, multiple:boolean?, milliseconds:number?, pausable:boolean?) → string | null
select.timed ??= (message = '', options = [], multiple = false, milliseconds = 60_000, pausable = true) => {
    if(select.done.contains(message))
        return select.done.fetch(message);

    if($.defined('.tt-select'))
        return when(() => $.nullish('.tt-select')).then(() => select.timed(message, options, multiple, milliseconds, pausable));

    let response = select.silent(message, options, multiple),
        container = $('.tt-select');

    if(nullish(container))
        return when.void;

    if(container.classList.contains('tt-timed'))
        return response;

    container.classList.add('tt-timed');
    $('.tt-select-header').append(
        furnish('span.tt-select-time', { due: (+new Date) + milliseconds }, toTimeString(milliseconds))
    );

    let intervalID = setInterval(() => {
        let time = $('.tt-select-time'),
            due = parseInt(time?.getAttribute('due')),
            milliseconds = (+new Date(due) - (+new Date));

        if(nullish(time))
            return clearInterval(intervalID);

        if(pausable && $.all('*:is(:hover, :focus-within)').contains(time.closest('.tt-select-container')))
            return time.setAttribute('due', due + 250);

        time.closest('.tt-select-container').setAttribute('tt-time-left', time.innerText = toTimeString((milliseconds < 0? 0: milliseconds), 'clock').replace(/^[0:]+(?<!$)/, ''));
        time.setAttribute('tt-done', milliseconds < 0);
    }, 250);

    container.dataset.intervalId = intervalID;

    select.done.deposit(message, response);
    return response;
};

// Compares two versions and returns an integer representing their relationship
    // compareVersions(old:string?, new:string?, return:string?) → number | boolean
function compareVersions(oldVersion = '', newVersion = '', returnType) {
    if(/[<=>\u2264\u2265]/.test(oldVersion)) {
        let [oV, rT, nV] = oldVersion.split(/([<=>]{1,2}|[\u2264\u2265])/).map(s => s.trim()).filter(s => s?.length);

        oldVersion = oV;
        returnType = rT;
        newVersion = nV;
    }

    if(/[<=>\u2264\u2265]/.test(newVersion)) {
        let nV = returnType,
            rT = newVersion;

        returnType = rT;
        newVersion = nV;
    }

    if(!oldVersion?.length || !newVersion?.length)
        throw 'Unable to compare empty versions.';

    oldVersion = oldVersion.split('.');
    newVersion = newVersion.split('.');

    let diff = 0;

    for(let index = 0, length = Math.max(oldVersion.length, newVersion.length); index < length; ++index) {
        let L = parseInt((oldVersion[index] ?? '').replace(/[^a-z0-9]+/gi), 36),
            R = parseInt((newVersion[index] ?? '').replace(/[^a-z0-9]+/gi), 36);

        if(L == R)
            continue;

        if(L < R)
            diff = -1;
        else
            diff = +1;

        break;
    }

    switch(returnType?.toLowerCase()) {
        case 'arrow':
            return ['\u2191', '\u2022', '\u2193'][diff + 1];

        case 'symbol':
            return ['<', '=', '>'][diff + 1];

        case 'string':
            return ['less than', 'equal to', 'greater than'][diff + 1];

        case 'update':
            return ['there is an update available', 'the installed version is the latest', 'the installed version is pre-built'][diff + 1];

        case '<':
            return diff < 0;

        case '≤':
        case '<=':
        case '\u2264':
            return diff <= 0;

        case '=':
            return diff == 0;

        case '>':
            return diff > 0;

        case '≥':
        case '>=':
        case '\u2265':
            return diff >= 0;
    }

    return diff;
}

/* Common MIME Types */
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
window.MIME_Types ??= ({
    // type: extension
    find(type = '') {
        let [head] = type.toLowerCase().split(';');

        return window.MIME_Types[head] ?? type;
    },

	"application/epub+zip": "epub",
	"application/gzip": "gz",
	"application/java-archive": "jar",
	"application/json": "json",
	"application/ld+json": "jsonld",
	"application/msword": "doc",
	"application/octet-stream": "bin",
	"application/ogg": "ogx",
	"application/pdf": "pdf",
	"application/rtf": "rtf",
	"application/vnd.amazon.ebook": "azw",
	"application/vnd.apple.installer+xml": "mpkg",
	"application/vnd.mozilla.xul+xml": "xul",
	"application/vnd.ms-excel": "xls",
	"application/vnd.ms-fontobject": "eot",
	"application/vnd.ms-powerpoint": "ppt",
	"application/vnd.oasis.opendocument.presentation": "odp",
	"application/vnd.oasis.opendocument.spreadsheet": "ods",
	"application/vnd.oasis.opendocument.text": "odt",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
	"application/vnd.rar": "rar",
	"application/vnd.visio": "vsd",
	"application/x-7z-compressed": "7z",
	"application/x-abiword": "abw",
	"application/x-bzip": "bz",
	"application/x-bzip2": "bz2",
	"application/x-cdf": "cda",
	"application/x-csh": "csh",
	"application/x-freearc": "arc",
	"application/x-httpd-php": "php",
	"application/x-sh": "sh",
	"application/x-shockwave-flash": "swf",
	"application/x-tar": "tar",
	"application/xhtml+xml": "xhtml",
	"application/xml": "xml",
	"application/zip": "zip",
	"audio/aac": "aac",
	"audio/midi": "mid",
	"audio/mpeg": "mp3",
	"audio/ogg": "oga",
	"audio/opus": "opus",
	"audio/wav": "wav",
	"audio/webm": "weba",
	"font/otf": "otf",
	"font/ttf": "ttf",
	"font/woff": "woff",
	"font/woff2": "woff2",
	"image/avif": "avif",
	"image/bmp": "bmp",
	"image/gif": "gif",
	"image/jpeg": "jpeg",
	"image/png": "png",
	"image/svg+xml": "svg",
	"image/tiff": "tiff",
	"image/vnd.microsoft.icon": "ico",
	"image/webp": "webp",
	"text/calendar": "ics",
	"text/css": "css",
	"text/csv": "csv",
	"text/html": "html",
	"text/javascript": "mjs",
	"text/plain": "txt",
	"video/3gpp": "3gp",
	"video/3gpp2": "3g2",
	"video/mp2t": "ts",
	"video/mp4": "mp4",
	"video/mpeg": "mpeg",
	"video/ogg": "ogv",
	"video/webm": "webm",
    "video/x-matroska": "mkv",
	"video/x-msvideo": "avi",
});

/* ISO-639-1 Language Codes */
window.ISO_639_1 ??= ({
    "aa": {
        "name": "Afar/Afaraf",
        "names": [
            "Afar"
        ],
        "endonyms": [
            "Afaraf"
        ],
        "code": "aa",
        "region": "Afro-Asiatic"
    },
    "ab": {
        "name": "Abkhazian/%u0430%u04A7%u0441%u0443%u0430%20%u0431%u044B%u0437%u0448%u04D9%u0430",
        "names": [
            "Abkhazian"
        ],
        "endonyms": [
            "аҧсуа бызшәа",
            "аҧсшәа"
        ],
        "code": "ab",
        "region": "Northwest Caucasian"
    },
    "ae": {
        "name": "Avestan/avesta",
        "names": [
            "Avestan"
        ],
        "endonyms": [
            "avesta"
        ],
        "code": "ae",
        "region": "Indo-European"
    },
    "af": {
        "name": "Afrikaans/Afrikaans",
        "names": [
            "Afrikaans"
        ],
        "endonyms": [
            "Afrikaans"
        ],
        "code": "af",
        "region": "Indo-European"
    },
    "ak": {
        "name": "Akan/Akan",
        "names": [
            "Akan"
        ],
        "endonyms": [
            "Akan"
        ],
        "code": "ak",
        "region": "Niger–Congo"
    },
    "am": {
        "name": "Amharic/%u12A0%u121B%u122D%u129B",
        "names": [
            "Amharic"
        ],
        "endonyms": [
            "አማርኛ"
        ],
        "code": "am",
        "region": "Afro-Asiatic"
    },
    "an": {
        "name": "Aragonese/aragon%E9s",
        "names": [
            "Aragonese"
        ],
        "endonyms": [
            "aragonés"
        ],
        "code": "an",
        "region": "Indo-European"
    },
    "ar": {
        "name": "Arabic/%u0627%u0644%u0639%u0631%u0628%u064A%u0629",
        "names": [
            "Arabic"
        ],
        "endonyms": [
            "العربية"
        ],
        "code": "ar",
        "region": "Afro-Asiatic"
    },
    "as": {
        "name": "Assamese/%u0985%u09B8%u09AE%u09C0%u09AF%u09BC%u09BE",
        "names": [
            "Assamese"
        ],
        "endonyms": [
            "অসমীয়া"
        ],
        "code": "as",
        "region": "Indo-European"
    },
    "av": {
        "name": "Avaric/%u0430%u0432%u0430%u0440%20%u043C%u0430%u0446%u04C0",
        "names": [
            "Avaric"
        ],
        "endonyms": [
            "авар мацӀ",
            "магӀарул мацӀ"
        ],
        "code": "av",
        "region": "Northeast Caucasian"
    },
    "ay": {
        "name": "Aymara/aymar%20aru",
        "names": [
            "Aymara"
        ],
        "endonyms": [
            "aymar aru"
        ],
        "code": "ay",
        "region": "Aymaran"
    },
    "az": {
        "name": "Azerbaijani/az%u0259rbaycan%20dili",
        "names": [
            "Azerbaijani"
        ],
        "endonyms": [
            "azərbaycan dili",
            "تۆرکجه"
        ],
        "code": "az",
        "region": "Turkic"
    },
    "ba": {
        "name": "Bashkir/%u0431%u0430%u0448%u04A1%u043E%u0440%u0442%20%u0442%u0435%u043B%u0435",
        "names": [
            "Bashkir"
        ],
        "endonyms": [
            "башҡорт теле"
        ],
        "code": "ba",
        "region": "Turkic"
    },
    "be": {
        "name": "Belarusian/%u0431%u0435%u043B%u0430%u0440%u0443%u0441%u043A%u0430%u044F%20%u043C%u043E%u0432%u0430",
        "names": [
            "Belarusian"
        ],
        "endonyms": [
            "беларуская мова"
        ],
        "code": "be",
        "region": "Indo-European"
    },
    "bg": {
        "name": "Bulgarian/%u0431%u044A%u043B%u0433%u0430%u0440%u0441%u043A%u0438%20%u0435%u0437%u0438%u043A",
        "names": [
            "Bulgarian"
        ],
        "endonyms": [
            "български език"
        ],
        "code": "bg",
        "region": "Indo-European"
    },
    "bi": {
        "name": "Bislama/Bislama",
        "names": [
            "Bislama"
        ],
        "endonyms": [
            "Bislama"
        ],
        "code": "bi",
        "region": "Creole"
    },
    "bm": {
        "name": "Bambara/bamanankan",
        "names": [
            "Bambara"
        ],
        "endonyms": [
            "bamanankan"
        ],
        "code": "bm",
        "region": "Niger–Congo"
    },
    "bn": {
        "name": "Bengali/%u09AC%u09BE%u0982%u09B2%u09BE",
        "names": [
            "Bengali"
        ],
        "endonyms": [
            "বাংলা"
        ],
        "code": "bn",
        "region": "Indo-European"
    },
    "bo": {
        "name": "Tibetan/%u0F56%u0F7C%u0F51%u0F0B%u0F61%u0F72%u0F42",
        "names": [
            "Tibetan"
        ],
        "endonyms": [
            "བོད་ཡིག"
        ],
        "code": "bo",
        "region": "Sino-Tibetan"
    },
    "br": {
        "name": "Breton/brezhoneg",
        "names": [
            "Breton"
        ],
        "endonyms": [
            "brezhoneg"
        ],
        "code": "br",
        "region": "Indo-European"
    },
    "bs": {
        "name": "Bosnian/bosanski%20jezik",
        "names": [
            "Bosnian"
        ],
        "endonyms": [
            "bosanski jezik"
        ],
        "code": "bs",
        "region": "Indo-European"
    },
    "ca": {
        "name": "Catalan/catal%E0",
        "names": [
            "Catalan",
            "Valencian"
        ],
        "endonyms": [
            "català",
            "valencià"
        ],
        "code": "ca",
        "region": "Indo-European"
    },
    "ce": {
        "name": "Chechen/%u043D%u043E%u0445%u0447%u0438%u0439%u043D%20%u043C%u043E%u0442%u0442",
        "names": [
            "Chechen"
        ],
        "endonyms": [
            "нохчийн мотт"
        ],
        "code": "ce",
        "region": "Northeast Caucasian"
    },
    "ch": {
        "name": "Chamorro/Chamoru",
        "names": [
            "Chamorro"
        ],
        "endonyms": [
            "Chamoru"
        ],
        "code": "ch",
        "region": "Austronesian"
    },
    "co": {
        "name": "Corsican/corsu",
        "names": [
            "Corsican"
        ],
        "endonyms": [
            "corsu",
            "lingua corsa"
        ],
        "code": "co",
        "region": "Indo-European"
    },
    "cr": {
        "name": "Cree/%u14C0%u1426%u1403%u152D%u140D%u140F%u1423",
        "names": [
            "Cree"
        ],
        "endonyms": [
            "ᓀᐦᐃᔭᐍᐏᐣ"
        ],
        "code": "cr",
        "region": "Algic"
    },
    "cs": {
        "name": "Czech/%u010De%u0161tina",
        "names": [
            "Czech"
        ],
        "endonyms": [
            "čeština",
            "český jazyk"
        ],
        "code": "cs",
        "region": "Indo-European"
    },
    "cu": {
        "name": "Church%A0Slavic/%u0469%u0437%u044B%u043A%u044A%20%u0441%u043B%u043E%u0432%u0463%u043D%u044C%u0441%u043A%u044A",
        "names": [
            "Church Slavic",
            "Old Slavonic",
            "Church Slavonic",
            "Old Bulgarian",
            "Old Church Slavonic"
        ],
        "endonyms": [
            "ѩзыкъ словѣньскъ"
        ],
        "code": "cu",
        "region": "Indo-European"
    },
    "cv": {
        "name": "Chuvash/%u0447%u04D1%u0432%u0430%u0448%20%u0447%u04D7%u043B%u0445%u0438",
        "names": [
            "Chuvash"
        ],
        "endonyms": [
            "чӑваш чӗлхи"
        ],
        "code": "cv",
        "region": "Turkic"
    },
    "cy": {
        "name": "Welsh/Cymraeg",
        "names": [
            "Welsh"
        ],
        "endonyms": [
            "Cymraeg"
        ],
        "code": "cy",
        "region": "Indo-European"
    },
    "da": {
        "name": "Danish/dansk",
        "names": [
            "Danish"
        ],
        "endonyms": [
            "dansk"
        ],
        "code": "da",
        "region": "Indo-European"
    },
    "de": {
        "name": "German/Deutsch",
        "names": [
            "German"
        ],
        "endonyms": [
            "Deutsch"
        ],
        "code": "de",
        "region": "Indo-European"
    },
    "dv": {
        "name": "Divehi/%u078B%u07A8%u0788%u07AC%u0780%u07A8",
        "names": [
            "Divehi",
            "Dhivehi",
            "Maldivian"
        ],
        "endonyms": [
            "ދިވެހި"
        ],
        "code": "dv",
        "region": "Indo-European"
    },
    "dz": {
        "name": "Dzongkha/%u0F62%u0FAB%u0F7C%u0F44%u0F0B%u0F41",
        "names": [
            "Dzongkha"
        ],
        "endonyms": [
            "རྫོང་ཁ"
        ],
        "code": "dz",
        "region": "Sino-Tibetan"
    },
    "ee": {
        "name": "Ewe/E%u028Begbe",
        "names": [
            "Ewe"
        ],
        "endonyms": [
            "Eʋegbe"
        ],
        "code": "ee",
        "region": "Niger–Congo"
    },
    "el": {
        "name": "Greek/%u0395%u03BB%u03BB%u03B7%u03BD%u03B9%u03BA%u03AC",
        "names": [
            "Greek",
            "Modern (1453–)"
        ],
        "endonyms": [
            "Ελληνικά"
        ],
        "code": "el",
        "region": "Indo-European"
    },
    "en": {
        "name": "English/English",
        "names": [
            "English"
        ],
        "endonyms": [
            "English"
        ],
        "code": "en",
        "region": "Indo-European"
    },
    "eo": {
        "name": "Esperanto/Esperanto",
        "names": [
            "Esperanto"
        ],
        "endonyms": [
            "Esperanto"
        ],
        "code": "eo",
        "region": "Constructed"
    },
    "es": {
        "name": "Spanish/Espa%F1ol",
        "names": [
            "Spanish",
            "Castilian"
        ],
        "endonyms": [
            "Español"
        ],
        "code": "es",
        "region": "Indo-European"
    },
    "et": {
        "name": "Estonian/eesti",
        "names": [
            "Estonian"
        ],
        "endonyms": [
            "eesti",
            "eesti keel"
        ],
        "code": "et",
        "region": "Uralic"
    },
    "eu": {
        "name": "Basque/euskara",
        "names": [
            "Basque"
        ],
        "endonyms": [
            "euskara",
            "euskera"
        ],
        "code": "eu",
        "region": "Language isolate"
    },
    "fa": {
        "name": "Persian/%u0641%u0627%u0631%u0633%u06CC",
        "names": [
            "Persian"
        ],
        "endonyms": [
            "فارسی"
        ],
        "code": "fa",
        "region": "Indo-European"
    },
    "ff": {
        "name": "Fulah/Fulfulde",
        "names": [
            "Fulah"
        ],
        "endonyms": [
            "Fulfulde",
            "Pulaar",
            "Pular"
        ],
        "code": "ff",
        "region": "Niger–Congo"
    },
    "fi": {
        "name": "Finnish/suomi",
        "names": [
            "Finnish"
        ],
        "endonyms": [
            "suomi",
            "suomen kieli"
        ],
        "code": "fi",
        "region": "Uralic"
    },
    "fj": {
        "name": "Fijian/vosa%20Vakaviti",
        "names": [
            "Fijian"
        ],
        "endonyms": [
            "vosa Vakaviti"
        ],
        "code": "fj",
        "region": "Austronesian"
    },
    "fo": {
        "name": "Faroese/f%F8royskt",
        "names": [
            "Faroese"
        ],
        "endonyms": [
            "føroyskt"
        ],
        "code": "fo",
        "region": "Indo-European"
    },
    "fr": {
        "name": "French/fran%E7ais",
        "names": [
            "French"
        ],
        "endonyms": [
            "français"
        ],
        "code": "fr",
        "region": "Indo-European"
    },
    "fy": {
        "name": "Western%20Frisian/Frysk",
        "names": [
            "Western Frisian"
        ],
        "endonyms": [
            "Frysk"
        ],
        "code": "fy",
        "region": "Indo-European"
    },
    "ga": {
        "name": "Irish/Gaeilge",
        "names": [
            "Irish"
        ],
        "endonyms": [
            "Gaeilge"
        ],
        "code": "ga",
        "region": "Indo-European"
    },
    "gd": {
        "name": "Gaelic/G%E0idhlig",
        "names": [
            "Gaelic",
            "Scottish Gaelic"
        ],
        "endonyms": [
            "Gàidhlig"
        ],
        "code": "gd",
        "region": "Indo-European"
    },
    "gl": {
        "name": "Galician/Galego",
        "names": [
            "Galician"
        ],
        "endonyms": [
            "Galego"
        ],
        "code": "gl",
        "region": "Indo-European"
    },
    "gn": {
        "name": "Guarani/Ava%F1e%27%u1EBD",
        "names": [
            "Guarani"
        ],
        "endonyms": [
            "Avañe'ẽ"
        ],
        "code": "gn",
        "region": "Tupian"
    },
    "gu": {
        "name": "Gujarati/%u0A97%u0AC1%u0A9C%u0AB0%u0ABE%u0AA4%u0AC0",
        "names": [
            "Gujarati"
        ],
        "endonyms": [
            "ગુજરાતી"
        ],
        "code": "gu",
        "region": "Indo-European"
    },
    "gv": {
        "name": "Manx/Gaelg",
        "names": [
            "Manx"
        ],
        "endonyms": [
            "Gaelg",
            "Gailck"
        ],
        "code": "gv",
        "region": "Indo-European"
    },
    "ha": {
        "name": "Hausa/%20%u0647%u064E%u0648%u064F%u0633%u064E",
        "names": [
            "Hausa"
        ],
        "endonyms": [
            "(Hausa) هَوُسَ"
        ],
        "code": "ha",
        "region": "Afro-Asiatic"
    },
    "he": {
        "name": "Hebrew/%u05E2%u05D1%u05E8%u05D9%u05EA",
        "names": [
            "Hebrew"
        ],
        "endonyms": [
            "עברית"
        ],
        "code": "he",
        "region": "Afro-Asiatic"
    },
    "hi": {
        "name": "Hindi/%u0939%u093F%u0928%u094D%u0926%u0940",
        "names": [
            "Hindi"
        ],
        "endonyms": [
            "हिन्दी",
            "हिंदी"
        ],
        "code": "hi",
        "region": "Indo-European"
    },
    "ho": {
        "name": "Hiri%20Motu/Hiri%20Motu",
        "names": [
            "Hiri Motu"
        ],
        "endonyms": [
            "Hiri Motu"
        ],
        "code": "ho",
        "region": "Austronesian"
    },
    "hr": {
        "name": "Croatian/hrvatski%20jezik",
        "names": [
            "Croatian"
        ],
        "endonyms": [
            "hrvatski jezik"
        ],
        "code": "hr",
        "region": "Indo-European"
    },
    "ht": {
        "name": "Haitian/Krey%F2l%20ayisyen",
        "names": [
            "Haitian",
            "Haitian Creole"
        ],
        "endonyms": [
            "Kreyòl ayisyen"
        ],
        "code": "ht",
        "region": "Creole"
    },
    "hu": {
        "name": "Hungarian/magyar",
        "names": [
            "Hungarian"
        ],
        "endonyms": [
            "magyar"
        ],
        "code": "hu",
        "region": "Uralic"
    },
    "hy": {
        "name": "Armenian/%u0540%u0561%u0575%u0565%u0580%u0565%u0576",
        "names": [
            "Armenian"
        ],
        "endonyms": [
            "Հայերեն"
        ],
        "code": "hy",
        "region": "Indo-European"
    },
    "hz": {
        "name": "Herero/Otjiherero",
        "names": [
            "Herero"
        ],
        "endonyms": [
            "Otjiherero"
        ],
        "code": "hz",
        "region": "Niger–Congo"
    },
    "ia": {
        "name": "Interlingua%20/Interlingua",
        "names": [
            "Interlingua (International Auxiliary Language Association)"
        ],
        "endonyms": [
            "Interlingua"
        ],
        "code": "ia",
        "region": "Constructed"
    },
    "id": {
        "name": "Indonesian/Bahasa%20Indonesia",
        "names": [
            "Indonesian"
        ],
        "endonyms": [
            "Bahasa Indonesia"
        ],
        "code": "id",
        "region": "Austronesian"
    },
    "ie": {
        "name": "Interlingue/%20Occidental",
        "names": [
            "Interlingue",
            "Occidental"
        ],
        "endonyms": [
            "(originally:) Occidental",
            "(after WWII:) Interlingue"
        ],
        "code": "ie",
        "region": "Constructed"
    },
    "ig": {
        "name": "Igbo/As%u1EE5s%u1EE5%20Igbo",
        "names": [
            "Igbo"
        ],
        "endonyms": [
            "Asụsụ Igbo"
        ],
        "code": "ig",
        "region": "Niger–Congo"
    },
    "ii": {
        "name": "Sichuan%20Yi/%uA188%uA320%uA4BF%20Nuosuhxop",
        "names": [
            "Sichuan Yi",
            "Nuosu"
        ],
        "endonyms": [
            "ꆈꌠ꒿ Nuosuhxop"
        ],
        "code": "ii",
        "region": "Sino-Tibetan"
    },
    "ik": {
        "name": "Inupiaq/I%F1upiaq",
        "names": [
            "Inupiaq"
        ],
        "endonyms": [
            "Iñupiaq",
            "Iñupiatun"
        ],
        "code": "ik",
        "region": "Eskimo–Aleut"
    },
    "io": {
        "name": "Ido/Ido",
        "names": [
            "Ido"
        ],
        "endonyms": [
            "Ido"
        ],
        "code": "io",
        "region": "Constructed"
    },
    "is": {
        "name": "Icelandic/%CDslenska",
        "names": [
            "Icelandic"
        ],
        "endonyms": [
            "Íslenska"
        ],
        "code": "is",
        "region": "Indo-European"
    },
    "it": {
        "name": "Italian/Italiano",
        "names": [
            "Italian"
        ],
        "endonyms": [
            "Italiano"
        ],
        "code": "it",
        "region": "Indo-European"
    },
    "iu": {
        "name": "Inuktitut/%u1403%u14C4%u1483%u144E%u1450%u1466",
        "names": [
            "Inuktitut"
        ],
        "endonyms": [
            "ᐃᓄᒃᑎᑐᑦ"
        ],
        "code": "iu",
        "region": "Eskimo–Aleut"
    },
    "ja": {
        "name": "Japanese/%u65E5%u672C%u8A9E%20/%u306B%u307B%u3093%u3054",
        "names": [
            "Japanese"
        ],
        "endonyms": [
            "日本語 (にほんご)"
        ],
        "code": "ja",
        "region": "Japonic"
    },
    "jv": {
        "name": "Javanese/%uA9A7%uA9B1%uA997%uA9AE",
        "names": [
            "Javanese"
        ],
        "endonyms": [
            "ꦧꦱꦗꦮ",
            "Basa Jawa"
        ],
        "code": "jv",
        "region": "Austronesian"
    },
    "ka": {
        "name": "Georgian/%u10E5%u10D0%u10E0%u10D7%u10E3%u10DA%u10D8",
        "names": [
            "Georgian"
        ],
        "endonyms": [
            "ქართული"
        ],
        "code": "ka",
        "region": "Kartvelian"
    },
    "kg": {
        "name": "Kongo/Kikongo",
        "names": [
            "Kongo"
        ],
        "endonyms": [
            "Kikongo"
        ],
        "code": "kg",
        "region": "Niger–Congo"
    },
    "ki": {
        "name": "Kikuyu/G%u0129k%u0169y%u0169",
        "names": [
            "Kikuyu",
            "Gikuyu"
        ],
        "endonyms": [
            "Gĩkũyũ"
        ],
        "code": "ki",
        "region": "Niger–Congo"
    },
    "kj": {
        "name": "Kuanyama/Kuanyama",
        "names": [
            "Kuanyama",
            "Kwanyama"
        ],
        "endonyms": [
            "Kuanyama"
        ],
        "code": "kj",
        "region": "Niger–Congo"
    },
    "kk": {
        "name": "Kazakh/%u049B%u0430%u0437%u0430%u049B%20%u0442%u0456%u043B%u0456",
        "names": [
            "Kazakh"
        ],
        "endonyms": [
            "қазақ тілі"
        ],
        "code": "kk",
        "region": "Turkic"
    },
    "kl": {
        "name": "Kalaallisut/kalaallisut",
        "names": [
            "Kalaallisut",
            "Greenlandic"
        ],
        "endonyms": [
            "kalaallisut",
            "kalaallit oqaasii"
        ],
        "code": "kl",
        "region": "Eskimo–Aleut"
    },
    "km": {
        "name": "Central%20Khmer/%u1781%u17D2%u1798%u17C2%u179A",
        "names": [
            "Central Khmer"
        ],
        "endonyms": [
            "ខ្មែរ",
            "ខេមរភាសា",
            "ភាសាខ្មែរ"
        ],
        "code": "km",
        "region": "Austroasiatic"
    },
    "kn": {
        "name": "Kannada/%u0C95%u0CA8%u0CCD%u0CA8%u0CA1",
        "names": [
            "Kannada"
        ],
        "endonyms": [
            "ಕನ್ನಡ"
        ],
        "code": "kn",
        "region": "Dravidian"
    },
    "ko": {
        "name": "Korean/%uD55C%uAD6D%uC5B4",
        "names": [
            "Korean"
        ],
        "endonyms": [
            "한국어"
        ],
        "code": "ko",
        "region": "Koreanic"
    },
    "kr": {
        "name": "Kanuri/Kanuri",
        "names": [
            "Kanuri"
        ],
        "endonyms": [
            "Kanuri"
        ],
        "code": "kr",
        "region": "Nilo-Saharan"
    },
    "ks": {
        "name": "Kashmiri/%u0915%u0949%u0936%u0941%u0930",
        "names": [
            "Kashmiri"
        ],
        "endonyms": [
            "कॉशुर",
            "کٲشُر"
        ],
        "code": "ks",
        "region": "Indo-European"
    },
    "ku": {
        "name": "Kurdish/Kurd%EE",
        "names": [
            "Kurdish"
        ],
        "endonyms": [
            "Kurdî",
            "کوردی"
        ],
        "code": "ku",
        "region": "Indo-European"
    },
    "kv": {
        "name": "Komi/%u043A%u043E%u043C%u0438%20%u043A%u044B%u0432",
        "names": [
            "Komi"
        ],
        "endonyms": [
            "коми кыв"
        ],
        "code": "kv",
        "region": "Uralic"
    },
    "kw": {
        "name": "Cornish/Kernewek",
        "names": [
            "Cornish"
        ],
        "endonyms": [
            "Kernewek"
        ],
        "code": "kw",
        "region": "Indo-European"
    },
    "ky": {
        "name": "Kirghiz/%u041A%u044B%u0440%u0433%u044B%u0437%u0447%u0430",
        "names": [
            "Kirghiz",
            "Kyrgyz"
        ],
        "endonyms": [
            "Кыргызча",
            "Кыргыз тили"
        ],
        "code": "ky",
        "region": "Turkic"
    },
    "la": {
        "name": "Latin/latine",
        "names": [
            "Latin"
        ],
        "endonyms": [
            "latine",
            "lingua latina"
        ],
        "code": "la",
        "region": "Indo-European"
    },
    "lb": {
        "name": "Luxembourgish/L%EBtzebuergesch",
        "names": [
            "Luxembourgish",
            "Letzeburgesch"
        ],
        "endonyms": [
            "Lëtzebuergesch"
        ],
        "code": "lb",
        "region": "Indo-European"
    },
    "lg": {
        "name": "Ganda/Luganda",
        "names": [
            "Ganda"
        ],
        "endonyms": [
            "Luganda"
        ],
        "code": "lg",
        "region": "Niger–Congo"
    },
    "li": {
        "name": "Limburgan/Limburgs",
        "names": [
            "Limburgan",
            "Limburger",
            "Limburgish"
        ],
        "endonyms": [
            "Limburgs"
        ],
        "code": "li",
        "region": "Indo-European"
    },
    "ln": {
        "name": "Lingala/Ling%E1la",
        "names": [
            "Lingala"
        ],
        "endonyms": [
            "Lingála"
        ],
        "code": "ln",
        "region": "Niger–Congo"
    },
    "lo": {
        "name": "Lao/%u0E9E%u0EB2%u0EAA%u0EB2%u0EA5%u0EB2%u0EA7",
        "names": [
            "Lao"
        ],
        "endonyms": [
            "ພາສາລາວ"
        ],
        "code": "lo",
        "region": "Tai–Kadai"
    },
    "lt": {
        "name": "Lithuanian/lietuvi%u0173%20kalba",
        "names": [
            "Lithuanian"
        ],
        "endonyms": [
            "lietuvių kalba"
        ],
        "code": "lt",
        "region": "Indo-European"
    },
    "lu": {
        "name": "Luba-Katanga/Kiluba",
        "names": [
            "Luba-Katanga"
        ],
        "endonyms": [
            "Kiluba"
        ],
        "code": "lu",
        "region": "Niger–Congo"
    },
    "lv": {
        "name": "Latvian/latvie%u0161u%20valoda",
        "names": [
            "Latvian"
        ],
        "endonyms": [
            "latviešu valoda"
        ],
        "code": "lv",
        "region": "Indo-European"
    },
    "mg": {
        "name": "Malagasy/fiteny%20malagasy",
        "names": [
            "Malagasy"
        ],
        "endonyms": [
            "fiteny malagasy"
        ],
        "code": "mg",
        "region": "Austronesian"
    },
    "mh": {
        "name": "Marshallese/Kajin%20M%u0327aje%u013C",
        "names": [
            "Marshallese"
        ],
        "endonyms": [
            "Kajin M̧ajeļ"
        ],
        "code": "mh",
        "region": "Austronesian"
    },
    "mi": {
        "name": "Maori/te%20reo%20M%u0101ori",
        "names": [
            "Maori"
        ],
        "endonyms": [
            "te reo Māori"
        ],
        "code": "mi",
        "region": "Austronesian"
    },
    "mk": {
        "name": "Macedonian/%u043C%u0430%u043A%u0435%u0434%u043E%u043D%u0441%u043A%u0438%20%u0458%u0430%u0437%u0438%u043A",
        "names": [
            "Macedonian"
        ],
        "endonyms": [
            "македонски јазик"
        ],
        "code": "mk",
        "region": "Indo-European"
    },
    "ml": {
        "name": "Malayalam/%u0D2E%u0D32%u0D2F%u0D3E%u0D33%u0D02",
        "names": [
            "Malayalam"
        ],
        "endonyms": [
            "മലയാളം"
        ],
        "code": "ml",
        "region": "Dravidian"
    },
    "mn": {
        "name": "Mongolian/%u041C%u043E%u043D%u0433%u043E%u043B%20%u0445%u044D%u043B",
        "names": [
            "Mongolian"
        ],
        "endonyms": [
            "Монгол хэл"
        ],
        "code": "mn",
        "region": "Mongolic"
    },
    "mr": {
        "name": "Marathi/%u092E%u0930%u093E%u0920%u0940",
        "names": [
            "Marathi"
        ],
        "endonyms": [
            "मराठी"
        ],
        "code": "mr",
        "region": "Indo-European"
    },
    "ms": {
        "name": "Malay/Bahasa%20Melayu",
        "names": [
            "Malay"
        ],
        "endonyms": [
            "Bahasa Melayu",
            "بهاس ملايو"
        ],
        "code": "ms",
        "region": "Austronesian"
    },
    "mt": {
        "name": "Maltese/Malti",
        "names": [
            "Maltese"
        ],
        "endonyms": [
            "Malti"
        ],
        "code": "mt",
        "region": "Afro-Asiatic"
    },
    "my": {
        "name": "Burmese/%u1017%u1019%u102C%u1005%u102C",
        "names": [
            "Burmese"
        ],
        "endonyms": [
            "ဗမာစာ"
        ],
        "code": "my",
        "region": "Sino-Tibetan"
    },
    "na": {
        "name": "Nauru/Dorerin%20Naoero",
        "names": [
            "Nauru"
        ],
        "endonyms": [
            "Dorerin Naoero"
        ],
        "code": "na",
        "region": "Austronesian"
    },
    "nb": {
        "name": "Norwegian%20Bokm%E5l/Norsk%20Bokm%E5l",
        "names": [
            "Norwegian Bokmål"
        ],
        "endonyms": [
            "Norsk Bokmål"
        ],
        "code": "nb",
        "region": "Indo-European"
    },
    "nd": {
        "name": "North%20Ndebele/isiNdebele",
        "names": [
            "North Ndebele"
        ],
        "endonyms": [
            "isiNdebele"
        ],
        "code": "nd",
        "region": "Niger–Congo"
    },
    "ne": {
        "name": "Nepali/%u0928%u0947%u092A%u093E%u0932%u0940",
        "names": [
            "Nepali"
        ],
        "endonyms": [
            "नेपाली"
        ],
        "code": "ne",
        "region": "Indo-European"
    },
    "ng": {
        "name": "Ndonga/Owambo",
        "names": [
            "Ndonga"
        ],
        "endonyms": [
            "Owambo"
        ],
        "code": "ng",
        "region": "Niger–Congo"
    },
    "nl": {
        "name": "Dutch/Nederlands",
        "names": [
            "Dutch",
            "Flemish"
        ],
        "endonyms": [
            "Nederlands",
            "Vlaams"
        ],
        "code": "nl",
        "region": "Indo-European"
    },
    "nn": {
        "name": "Norwegian%20Nynorsk/Norsk%20Nynorsk",
        "names": [
            "Norwegian Nynorsk"
        ],
        "endonyms": [
            "Norsk Nynorsk"
        ],
        "code": "nn",
        "region": "Indo-European"
    },
    "no": {
        "name": "Norwegian/Norsk",
        "names": [
            "Norwegian"
        ],
        "endonyms": [
            "Norsk"
        ],
        "code": "no",
        "region": "Indo-European"
    },
    "nr": {
        "name": "South%20Ndebele/isiNdebele",
        "names": [
            "South Ndebele"
        ],
        "endonyms": [
            "isiNdebele"
        ],
        "code": "nr",
        "region": "Niger–Congo"
    },
    "nv": {
        "name": "Navajo/Din%E9%20bizaad",
        "names": [
            "Navajo",
            "Navaho"
        ],
        "endonyms": [
            "Diné bizaad"
        ],
        "code": "nv",
        "region": "Dené–Yeniseian"
    },
    "ny": {
        "name": "Chichewa/chiChe%u0175a",
        "names": [
            "Chichewa",
            "Chewa",
            "Nyanja"
        ],
        "endonyms": [
            "chiCheŵa",
            "chinyanja"
        ],
        "code": "ny",
        "region": "Niger–Congo"
    },
    "oc": {
        "name": "Occitan/occitan",
        "names": [
            "Occitan"
        ],
        "endonyms": [
            "occitan",
            "lenga d'òc"
        ],
        "code": "oc",
        "region": "Indo-European"
    },
    "oj": {
        "name": "Ojibwa/%u140A%u14C2%u1511%u14C8%u142F%u14A7%u140E%u14D0",
        "names": [
            "Ojibwa"
        ],
        "endonyms": [
            "ᐊᓂᔑᓈᐯᒧᐎᓐ"
        ],
        "code": "oj",
        "region": "Algic"
    },
    "om": {
        "name": "Oromo/Afaan%20Oromoo",
        "names": [
            "Oromo"
        ],
        "endonyms": [
            "Afaan Oromoo"
        ],
        "code": "om",
        "region": "Afro-Asiatic"
    },
    "or": {
        "name": "Oriya/%u0B13%u0B21%u0B3C%u0B3F%u0B06",
        "names": [
            "Oriya"
        ],
        "endonyms": [
            "ଓଡ଼ିଆ"
        ],
        "code": "or",
        "region": "Indo-European"
    },
    "os": {
        "name": "Ossetian/%u0438%u0440%u043E%u043D%20%u04D5%u0432%u0437%u0430%u0433",
        "names": [
            "Ossetian",
            "Ossetic"
        ],
        "endonyms": [
            "ирон ӕвзаг"
        ],
        "code": "os",
        "region": "Indo-European"
    },
    "pa": {
        "name": "Punjabi/%u0A2A%u0A70%u0A1C%u0A3E%u0A2C%u0A40",
        "names": [
            "Punjabi",
            "Panjabi"
        ],
        "endonyms": [
            "ਪੰਜਾਬੀ",
            "پنجابی"
        ],
        "code": "pa",
        "region": "Indo-European"
    },
    "pi": {
        "name": "Pali/%u092A%u093E%u0932%u093F",
        "names": [
            "Pali"
        ],
        "endonyms": [
            "पालि",
            "पाळि"
        ],
        "code": "pi",
        "region": "Indo-European"
    },
    "pl": {
        "name": "Polish/j%u0119zyk%20polski",
        "names": [
            "Polish"
        ],
        "endonyms": [
            "język polski",
            "polszczyzna"
        ],
        "code": "pl",
        "region": "Indo-European"
    },
    "ps": {
        "name": "Pashto/%u067E%u069A%u062A%u0648",
        "names": [
            "Pashto",
            "Pushto"
        ],
        "endonyms": [
            "پښتو"
        ],
        "code": "ps",
        "region": "Indo-European"
    },
    "pt": {
        "name": "Portuguese/Portugu%EAs",
        "names": [
            "Portuguese"
        ],
        "endonyms": [
            "Português"
        ],
        "code": "pt",
        "region": "Indo-European"
    },
    "qu": {
        "name": "Quechua/Runa%20Simi",
        "names": [
            "Quechua"
        ],
        "endonyms": [
            "Runa Simi",
            "Kichwa"
        ],
        "code": "qu",
        "region": "Quechuan"
    },
    "rm": {
        "name": "Romansh/Rumantsch%20Grischun",
        "names": [
            "Romansh"
        ],
        "endonyms": [
            "Rumantsch Grischun"
        ],
        "code": "rm",
        "region": "Indo-European"
    },
    "rn": {
        "name": "Rundi/Ikirundi",
        "names": [
            "Rundi"
        ],
        "endonyms": [
            "Ikirundi"
        ],
        "code": "rn",
        "region": "Niger–Congo"
    },
    "ro": {
        "name": "Romanian/Rom%E2n%u0103",
        "names": [
            "Romanian",
            "Moldavian",
            "Moldovan"
        ],
        "endonyms": [
            "Română",
            "Moldovenească"
        ],
        "code": "ro",
        "region": "Indo-European"
    },
    "ru": {
        "name": "Russian/%u0440%u0443%u0441%u0441%u043A%u0438%u0439",
        "names": [
            "Russian"
        ],
        "endonyms": [
            "русский"
        ],
        "code": "ru",
        "region": "Indo-European"
    },
    "rw": {
        "name": "Kinyarwanda/Ikinyarwanda",
        "names": [
            "Kinyarwanda"
        ],
        "endonyms": [
            "Ikinyarwanda"
        ],
        "code": "rw",
        "region": "Niger–Congo"
    },
    "sa": {
        "name": "Sanskrit/%u0938%u0902%u0938%u094D%u0915%u0943%u0924%u092E%u094D",
        "names": [
            "Sanskrit"
        ],
        "endonyms": [
            "संस्कृतम्",
            "𑌸𑌂𑌸𑍍𑌕𑍃𑌤𑌮𑍍"
        ],
        "code": "sa",
        "region": "Indo-European"
    },
    "sc": {
        "name": "Sardinian/sardu",
        "names": [
            "Sardinian"
        ],
        "endonyms": [
            "sardu"
        ],
        "code": "sc",
        "region": "Indo-European"
    },
    "sd": {
        "name": "Sindhi/%u0938%u093F%u0902%u0927%u0940",
        "names": [
            "Sindhi"
        ],
        "endonyms": [
            "सिंधी",
            "سنڌي"
        ],
        "code": "sd",
        "region": "Indo-European"
    },
    "se": {
        "name": "Northern%20Sami/Davvis%E1megiella",
        "names": [
            "Northern Sami"
        ],
        "endonyms": [
            "Davvisámegiella"
        ],
        "code": "se",
        "region": "Uralic"
    },
    "sg": {
        "name": "Sango/y%E2ng%E2%20t%EE%20s%E4ng%F6",
        "names": [
            "Sango"
        ],
        "endonyms": [
            "yângâ tî sängö"
        ],
        "code": "sg",
        "region": "Creole"
    },
    "si": {
        "name": "Sinhala/%u0DC3%u0DD2%u0D82%u0DC4%u0DBD",
        "names": [
            "Sinhala",
            "Sinhalese"
        ],
        "endonyms": [
            "සිංහල"
        ],
        "code": "si",
        "region": "Indo-European"
    },
    "sk": {
        "name": "Slovak/sloven%u010Dina",
        "names": [
            "Slovak"
        ],
        "endonyms": [
            "slovenčina",
            "slovenský jazyk"
        ],
        "code": "sk",
        "region": "Indo-European"
    },
    "sl": {
        "name": "Slovenian/Slovenski%20jezik",
        "names": [
            "Slovenian"
        ],
        "endonyms": [
            "Slovenski jezik",
            "Slovenščina"
        ],
        "code": "sl",
        "region": "Indo-European"
    },
    "sm": {
        "name": "Samoan/gagana%20fa%27a%20Samoa",
        "names": [
            "Samoan"
        ],
        "endonyms": [
            "gagana fa'a Samoa"
        ],
        "code": "sm",
        "region": "Austronesian"
    },
    "sn": {
        "name": "Shona/chiShona",
        "names": [
            "Shona"
        ],
        "endonyms": [
            "chiShona"
        ],
        "code": "sn",
        "region": "Niger–Congo"
    },
    "so": {
        "name": "Somali/Soomaaliga",
        "names": [
            "Somali"
        ],
        "endonyms": [
            "Soomaaliga",
            "af Soomaali"
        ],
        "code": "so",
        "region": "Afro-Asiatic"
    },
    "sq": {
        "name": "Albanian/Shqip",
        "names": [
            "Albanian"
        ],
        "endonyms": [
            "Shqip"
        ],
        "code": "sq",
        "region": "Indo-European"
    },
    "sr": {
        "name": "Serbian/%u0441%u0440%u043F%u0441%u043A%u0438%20%u0458%u0435%u0437%u0438%u043A",
        "names": [
            "Serbian"
        ],
        "endonyms": [
            "српски језик"
        ],
        "code": "sr",
        "region": "Indo-European"
    },
    "ss": {
        "name": "Swati/SiSwati",
        "names": [
            "Swati"
        ],
        "endonyms": [
            "SiSwati"
        ],
        "code": "ss",
        "region": "Niger–Congo"
    },
    "st": {
        "name": "Southern%20Sotho/Sesotho",
        "names": [
            "Southern Sotho"
        ],
        "endonyms": [
            "Sesotho"
        ],
        "code": "st",
        "region": "Niger–Congo"
    },
    "su": {
        "name": "Sundanese/Basa%20Sunda",
        "names": [
            "Sundanese"
        ],
        "endonyms": [
            "Basa Sunda"
        ],
        "code": "su",
        "region": "Austronesian"
    },
    "sv": {
        "name": "Swedish/Svenska",
        "names": [
            "Swedish"
        ],
        "endonyms": [
            "Svenska"
        ],
        "code": "sv",
        "region": "Indo-European"
    },
    "sw": {
        "name": "Swahili/Kiswahili",
        "names": [
            "Swahili"
        ],
        "endonyms": [
            "Kiswahili"
        ],
        "code": "sw",
        "region": "Niger–Congo"
    },
    "ta": {
        "name": "Tamil/%u0BA4%u0BAE%u0BBF%u0BB4%u0BCD",
        "names": [
            "Tamil"
        ],
        "endonyms": [
            "தமிழ்"
        ],
        "code": "ta",
        "region": "Dravidian"
    },
    "te": {
        "name": "Telugu/%u0C24%u0C46%u0C32%u0C41%u0C17%u0C41",
        "names": [
            "Telugu"
        ],
        "endonyms": [
            "తెలుగు"
        ],
        "code": "te",
        "region": "Dravidian"
    },
    "tg": {
        "name": "Tajik/%u0442%u043E%u04B7%u0438%u043A%u04E3",
        "names": [
            "Tajik"
        ],
        "endonyms": [
            "тоҷикӣ",
            "toçikī",
            "تاجیکی"
        ],
        "code": "tg",
        "region": "Indo-European"
    },
    "th": {
        "name": "Thai/%u0E44%u0E17%u0E22",
        "names": [
            "Thai"
        ],
        "endonyms": [
            "ไทย"
        ],
        "code": "th",
        "region": "Tai–Kadai"
    },
    "ti": {
        "name": "Tigrinya/%u1275%u130D%u122D%u129B",
        "names": [
            "Tigrinya"
        ],
        "endonyms": [
            "ትግርኛ"
        ],
        "code": "ti",
        "region": "Afro-Asiatic"
    },
    "tk": {
        "name": "Turkmen/T%FCrkmen%E7e",
        "names": [
            "Turkmen"
        ],
        "endonyms": [
            "Türkmençe",
            "Türkmen dili"
        ],
        "code": "tk",
        "region": "Turkic"
    },
    "tl": {
        "name": "Tagalog/Wikang%20Tagalog",
        "names": [
            "Tagalog"
        ],
        "endonyms": [
            "Wikang Tagalog"
        ],
        "code": "tl",
        "region": "Austronesian"
    },
    "tn": {
        "name": "Tswana/Setswana",
        "names": [
            "Tswana"
        ],
        "endonyms": [
            "Setswana"
        ],
        "code": "tn",
        "region": "Niger–Congo"
    },
    "to": {
        "name": "Tonga%20/Faka%20Tonga",
        "names": [
            "Tonga (Tonga Islands)"
        ],
        "endonyms": [
            "Faka Tonga"
        ],
        "code": "to",
        "region": "Austronesian"
    },
    "tr": {
        "name": "Turkish/T%FCrk%E7e",
        "names": [
            "Turkish"
        ],
        "endonyms": [
            "Türkçe"
        ],
        "code": "tr",
        "region": "Turkic"
    },
    "ts": {
        "name": "Tsonga/Xitsonga",
        "names": [
            "Tsonga"
        ],
        "endonyms": [
            "Xitsonga"
        ],
        "code": "ts",
        "region": "Niger–Congo"
    },
    "tt": {
        "name": "Tatar/%u0442%u0430%u0442%u0430%u0440%20%u0442%u0435%u043B%u0435",
        "names": [
            "Tatar"
        ],
        "endonyms": [
            "татар теле",
            "tatar tele"
        ],
        "code": "tt",
        "region": "Turkic"
    },
    "tw": {
        "name": "Twi/Twi",
        "names": [
            "Twi"
        ],
        "endonyms": [
            "Twi"
        ],
        "code": "tw",
        "region": "Niger–Congo"
    },
    "ty": {
        "name": "Tahitian/Reo%20Tahiti",
        "names": [
            "Tahitian"
        ],
        "endonyms": [
            "Reo Tahiti"
        ],
        "code": "ty",
        "region": "Austronesian"
    },
    "ug": {
        "name": "Uighur/%u0626%u06C7%u064A%u063A%u06C7%u0631%u0686%u06D5",
        "names": [
            "Uighur",
            "Uyghur"
        ],
        "endonyms": [
            "ئۇيغۇرچە",
            "Uyghurche"
        ],
        "code": "ug",
        "region": "Turkic"
    },
    "uk": {
        "name": "Ukrainian/%u0423%u043A%u0440%u0430%u0457%u043D%u0441%u044C%u043A%u0430",
        "names": [
            "Ukrainian"
        ],
        "endonyms": [
            "Українська"
        ],
        "code": "uk",
        "region": "Indo-European"
    },
    "ur": {
        "name": "Urdu/%u0627%u0631%u062F%u0648",
        "names": [
            "Urdu"
        ],
        "endonyms": [
            "اردو"
        ],
        "code": "ur",
        "region": "Indo-European"
    },
    "uz": {
        "name": "Uzbek/O%u02BBzbek",
        "names": [
            "Uzbek"
        ],
        "endonyms": [
            "Oʻzbek",
            "Ўзбек",
            "أۇزبېك"
        ],
        "code": "uz",
        "region": "Turkic"
    },
    "ve": {
        "name": "Venda/Tshiven%u1E13a",
        "names": [
            "Venda"
        ],
        "endonyms": [
            "Tshivenḓa"
        ],
        "code": "ve",
        "region": "Niger–Congo"
    },
    "vi": {
        "name": "Vietnamese/Ti%u1EBFng%20Vi%u1EC7t",
        "names": [
            "Vietnamese"
        ],
        "endonyms": [
            "Tiếng Việt"
        ],
        "code": "vi",
        "region": "Austroasiatic"
    },
    "vo": {
        "name": "Volap%FCk/Volap%FCk",
        "names": [
            "Volapük"
        ],
        "endonyms": [
            "Volapük"
        ],
        "code": "vo",
        "region": "Constructed"
    },
    "wa": {
        "name": "Walloon/Walon",
        "names": [
            "Walloon"
        ],
        "endonyms": [
            "Walon"
        ],
        "code": "wa",
        "region": "Indo-European"
    },
    "wo": {
        "name": "Wolof/Wollof",
        "names": [
            "Wolof"
        ],
        "endonyms": [
            "Wollof"
        ],
        "code": "wo",
        "region": "Niger–Congo"
    },
    "xh": {
        "name": "Xhosa/isiXhosa",
        "names": [
            "Xhosa"
        ],
        "endonyms": [
            "isiXhosa"
        ],
        "code": "xh",
        "region": "Niger–Congo"
    },
    "yi": {
        "name": "Yiddish/%u05D9%u05D9%u05B4%u05D3%u05D9%u05E9",
        "names": [
            "Yiddish"
        ],
        "endonyms": [
            "ייִדיש"
        ],
        "code": "yi",
        "region": "Indo-European"
    },
    "yo": {
        "name": "Yoruba/Yor%F9b%E1",
        "names": [
            "Yoruba"
        ],
        "endonyms": [
            "Yorùbá"
        ],
        "code": "yo",
        "region": "Niger–Congo"
    },
    "za": {
        "name": "Zhuang/Sa%u026F%20cue%u014B%u0185",
        "names": [
            "Zhuang",
            "Chuang"
        ],
        "endonyms": [
            "Saɯ cueŋƅ",
            "Saw cuengh"
        ],
        "code": "za",
        "region": "Tai–Kadai"
    },
    "zh": {
        "name": "Chinese/%u4E2D%u6587%20",
        "names": [
            "Chinese"
        ],
        "endonyms": [
            "中文 (Zhōngwén)",
            "汉语",
            "漢語"
        ],
        "code": "zh",
        "region": "Sino-Tibetan"
    },
    "zu": {
        "name": "Zulu/isiZulu",
        "names": [
            "Zulu"
        ],
        "endonyms": [
            "isiZulu"
        ],
        "code": "zu",
        "region": "Niger–Congo"
    }
});

// Encodes HTML to be HTML-embed friendly
    // encodeHTML(string:string?) → string
function encodeHTML(string = '') {
    for(let { char, html, dec, hex } of decodeHTML.table)
        string = string.replaceAll(char, html);

    return string;
}

// Decodes HTML-embedded text
    // decodeHTML(string:string) → string
function decodeHTML(string = '') {
    return string.replace(/&(#x?\d+|[a-z]+);/ig, ($0, $1, $$, $_) => decodeHTML.table.find(({ html, dec, hex }) => [html, dec, hex].contains($0))?.char ?? $0);
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
        "char": '"',
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
