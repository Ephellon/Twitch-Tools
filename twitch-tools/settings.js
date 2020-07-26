/*** /settings.js
 *       _____      _   _   _                   _
 *      / ____|    | | | | (_)                 (_)
 *     | (___   ___| |_| |_ _ _ __   __ _ ___   _ ___
 *      \___ \ / _ \ __| __| | '_ \ / _` / __| | / __|
 *      ____) |  __/ |_| |_| | | | | (_| \__ \_| \__ \
 *     |_____/ \___|\__|\__|_|_| |_|\__, |___(_) |___/
 *                                   __/ |    _/ |
 *                                  |___/    |__/
 */

let $ = (selector, multiple = false, container = document) => multiple? [...container.querySelectorAll(selector)]: container.querySelector(selector);
let empty = value => (value === undefined || value === null),
    defined = value => !empty(value);

let browser, Storage, Runtime, Manifest, Container, BrowserNamespace;

if(browser && browser.runtime)
    BrowserNamespace = 'browser';
else if(chrome && chrome.extension)
    BrowserNamespace = 'chrome';

Container = window[BrowserNamespace];

switch(BrowserNamespace) {
    case 'browser':
        Runtime = Container.runtime;
        Storage = Container.storage;
        Manifest = Runtime.getManifest();

        Storage = Storage.sync || Storage.local;
        break;

    case 'chrome':
    default:
        Runtime = Container.extension;
        Storage = Container.storage;
        Manifest = Container.runtime.getManifest();

        Storage = Storage.sync || Storage.local;
        break;
}

let // These are option names. Anything else will be removed
    usable_settings = ['auto_claim', 'highlight_messages', 'filter_messages', 'filter_rules', 'keep_watching', 'stop_raiding', 'auto_follow_raids', 'auto_reload', 'auto_play_stream', 'auto_play_ads', 'auto_follow_time', 'auto_follow_time_minutes', 'first_in_line', 'bits_to_cents'];

let Glyphs = {
    bonuschannelpoints: '<svg fill="var(--blue)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>',
    channelpoints: '<svg fill="var(--purple)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    checkmark: '<svg fill="var(--black)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>',
    trash: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>',
    lock: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.001 5.99A3.992 3.992 0 0010.01 2h-.018a3.992 3.992 0 00-3.991 3.99V8H3.999v8c0 1.105.896 2 2 2h8c1.104 0 2-.895 2-2V8h-1.998V5.99zm-2 2.01V5.995A1.996 1.996 0 0010.006 4h-.01a1.996 1.996 0 00-1.995 1.995V8h4z" clip-rule="evenodd"></path></g></svg>'
};

function parseURL(url) {
    if(!defined(url))
        return {};

    url = url.toString();

    let data = url.match(/^((([^:\/?#]+):)?(?:\/{2})?)(?:([^:]+):([^@]+)@)?(([^:\/?#]*)?(?:\:(\d+))?)?([^?#]*)(\?[^#]*)?(#.*)?$/),
        i    = 0,
        e    = "";

    data = data || e;

    return {
        href:             data[i++] || e,
        origin:           (data[i++] || e) + (data[i + 4] || e),
        protocol:         data[i++] || e,
        scheme:           data[i++] || e,
        username:         data[i++] || e,
        password:         data[i++] || e,
        host:             data[i++] || e,
        domainPath:       data[i].split('.').reverse(),
        hostname:         data[i++] || e,
        port:             data[i++] || e,
        pathname:         data[i++] || e,
        search:           data[i]   || e,
        searchParameters: (function(sd) {
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
        hash:             data[i++] || e
    };
};

$('details', true).map(element => {
    element.ontoggle = event => {
        let article = element.parentElement,
            details = element,
            summary = $('summary', false, details),
            uuid = 'uuid-' + Math.random().toString(36).replace('.','');

        if(details.open) {
            article.classList.add('focus');

            let margin = ['2rem'],
                getHeight = element => {
                    let style = getComputedStyle(element),
                        heights = ['height'],
                        height = 20;

                    for(let attribute of heights)
                        height += parseInt(style[attribute]);

                    return height;
                };

            // [more]
            if('more' in summary.attributes)
                for(let element of $('summary ~ input', true, details))
                    margin.push(getHeight(element) + 'px');

            // details > *
            details.id = uuid;
            $('input, img, div, h1, h2, h3, h4, h5, h6, p'.split(',').map(e=>`#${uuid} > ${e}`).join(','), true)
                .map(element => {
                    let height = getHeight(element);

                    if(height)
                        margin.push(height + 'px');
                    else
                        element.setAttribute('style', 'display:none!important');
                });

            article.setAttribute('style', `margin-bottom:calc(${ margin.join(' + ') })`);
        } else {
            article.classList.remove('focus');
            article.removeAttribute('style');
        }
    }
});

async function SaveSettings() {
    let extractValue = element => {
        return element[{
            text: 'value',
            checkbox: 'checked',
        }[element.type]];
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id);
    let settings = {};

    for(let id of using) {
        if(!~['filter_rules'].indexOf(id))
            settings[id] = extractValue($(`#${ id }`));
        else
            switch(id) {
                case 'filter_rules':
                    let rules = [],
                        input = extractValue($('#filter_rules-input'));

                    if(input)
                        rules.push(input);

                    for(let rule of $('#filter_rules input[value]', true))
                        rules.push(rule.value);

                    settings.filter_rules = rules.join(',').split(',').filter(value => value).join(',');
                    break;

                default:
                    throw `Unknown setting "${ id }"`;
            }
    }

    return await Storage.set(settings);
}

async function LoadSettings() {
    let assignValue = (element, value) => {
        if(value === undefined)
            return;

        return element[{
            text: 'value',
            checkbox: 'checked',
        }[element.type]] = value;
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id);

    return await Storage.get(null, settings => {
        for(let id of using) {
            let element = $(`#${ id }`);

            if(!~['filter_rules'].indexOf(id))
                assignValue(element, settings[id]);
            else
                switch(id) {
                    case 'filter_rules':
                        let rules = settings[id];

                        if(!defined(rules))
                            break;

                        rules = rules.split(',');

                        for(let rule of rules) {
                            let R = document.createElement('input');

                            if(!(rule && rule.length))
                                continue;

                            R.type = 'button';
                            R.value = rule;
                            R.title = `Remove "${ rule }"`;
                            R.classList.add('remove');

                            R.onclick = event => {
                                let { currentTarget } = event;

                                currentTarget.remove();
                            };

                            $('#filter_rules').appendChild(R);
                        }
                        break;

                    default:
                        throw `Unknown setting "${ id }"`;
                }
        }
    });
}

document.body.onload = LoadSettings;
$('#save', true).map(element => element.onclick = async event => {
    let { currentTarget } = event;

    currentTarget.classList.add('spin');

    await SaveSettings()
        .catch(error => {
            currentTarget.setAttribute('style', 'background-color:var(--red)');
        })
        .then(() => setTimeout(() => {
            currentTarget.removeAttribute('style');
            currentTarget.classList.remove('spin');
        }, 1500));
});

$('#version').setAttribute('version', Manifest.version);

// Eveyting else
$('[icon]', true).map(element => {
    let icon = element.getAttribute('icon');

    icon = Glyphs[icon];

    element.innerHTML = icon;

    icon = $('svg', false, element);

    if(icon)
        icon.setAttribute('style', 'height: 20px; width: 20px; vertical-align: text-bottom');
});

let url = parseURL(location.href),
    search = url.searchParameters;

if(search.popup) {
    $('#save').classList.add('popup');
}
