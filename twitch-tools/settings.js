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
    usable_settings = [
        /* Automation */
        // Auto-claim Bonuses
        'auto_claim_bonuses',
        // Auto-Follow
        'auto_follow_none',
        'auto_follow_raids',
        'auto_follow_time',
            'auto_follow_time_minutes',
        'auto_follow_all',
        // Keep Watching
        'stay_live',
        // First in Line
        'first_in_line_none',
        'first_in_line',
            'first_in_line_time_minutes',
        'first_in_line_plus',
            'first_in_line_plus_time_minutes',
        // Prevent Raiding
        'prevent_raiding',
        // Prevent Hosting
        'prevent_hosting',
        // Kill Extensions
        'kill_extensions',

        /* Chat & Messaging */
        // Highlight Mentions
        'highlight_mentions',
        // Show Pop-ups
        'highlight_mentions_popup',
        // Filter Messages
        'filter_messages',
            'filter_rules',
        // Convert Emotes
        'convert_emotes',

        /* Currencies */
        // Convert Bits
        'convert_bits',

        /* Error Recovery */
        // Recover Video
        'recover_video',
        // Recover Stream
        'recover_stream',
        // Recover Ads
        'recover_ads',
    ];

let Glyphs = {
    bonuschannelpoints: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>',
    channelpoints: '<svg fill="var(--purple)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    checkmark: '<svg fill="var(--green)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>',
    favorite: '<svg fill="var(--red)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829z" fill-rule="evenodd" clip-rule="evenodd"></path></g></svg>',
    emotes: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 11a1 1 0 100-2 1 1 0 000 2zM14 10a1 1 0 11-2 0 1 1 0 012 0zM10 14a2 2 0 002-2H8a2 2 0 002 2z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    trash: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>',
    play: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 17.066V2.934a.5.5 0 01.777-.416L17 10 5.777 17.482A.5.5 0 015 17.066z"></path></g></svg>',
    lock: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.001 5.99A3.992 3.992 0 0010.01 2h-.018a3.992 3.992 0 00-3.991 3.99V8H3.999v8c0 1.105.896 2 2 2h8c1.104 0 2-.895 2-2V8h-1.998V5.99zm-2 2.01V5.995A1.996 1.996 0 0010.006 4h-.01a1.996 1.996 0 00-1.995 1.995V8h4z" clip-rule="evenodd"></path></g></svg>',
    bits: '<svg fill="var(--purple)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></svg>',
    mod: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M5.003 3.947A10 10 0 009.519 2.32L10 2l.48.32A10 10 0 0016.029 4H17l-.494 5.641a9 9 0 01-4.044 6.751L10 18l-2.462-1.608a9 9 0 01-4.044-6.75L3 4h.972c.346 0 .69-.018 1.031-.053zm.174 1.992l.309 3.528a7 7 0 003.146 5.25l1.368.894 1.368-.893a7 7 0 003.146-5.25l.309-3.529A12 12 0 0110 4.376 12 12 0 015.177 5.94z" clip-rule="evenodd"></path></g></svg>',
    cog: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 8a2 2 0 100 4 2 2 0 000-4z"></path><path fill-rule="evenodd" d="M9 2h2a2.01 2.01 0 001.235 1.855l.53.22a2.01 2.01 0 002.185-.439l1.414 1.414a2.01 2.01 0 00-.439 2.185l.22.53A2.01 2.01 0 0018 9v2a2.01 2.01 0 00-1.855 1.235l-.22.53a2.01 2.01 0 00.44 2.185l-1.415 1.414a2.01 2.01 0 00-2.184-.439l-.531.22A2.01 2.01 0 0011 18H9a2.01 2.01 0 00-1.235-1.854l-.53-.22a2.009 2.009 0 00-2.185.438L3.636 14.95a2.009 2.009 0 00.438-2.184l-.22-.531A2.01 2.01 0 002 11V9c.809 0 1.545-.487 1.854-1.235l.22-.53a2.009 2.009 0 00-.438-2.185L5.05 3.636a2.01 2.01 0 002.185.438l.53-.22A2.01 2.01 0 009 2zm-4 8l1.464 3.536L10 15l3.535-1.464L15 10l-1.465-3.536L10 5 6.464 6.464 5 10z" clip-rule="evenodd"></path></g></svg>',
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

async function SaveSettings() {
    let extractValue = element => {
        return element[{
            text: 'value',
            number: 'value',
            radio: 'checked',
            checkbox: 'checked',
        }[element.type]];
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id),
        settings = {};

    for(let id of using)
        switch(id) {
            case 'filter_rules':
                let rules = [],
                    input = extractValue($('#filter_rules-input'));

                if(input)
                    rules = [...input.split(',')];

                for(let rule of $('#filter_rules input[value]', true))
                    rules.push(rule.value);

                settings.filter_rules = rules.join(',').split(',').filter(value => value).join(',');
                break;

            default:
                settings[id] = extractValue($(`#${ id }`));
                break;
        }

    return await Storage.set(settings);
}

async function LoadSettings() {
    let assignValue = (element, value) => {
        if(value === undefined)
            return;

        return element[{
            text: 'value',
            number: 'value',
            radio: 'checked',
            checkbox: 'checked',
        }[element.type]] = value;
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id);

    return await Storage.get(null, settings => {
        for(let id of using) {
            let element = $(`#${ id }`);

            switch(id) {
                case 'filter_rules':
                    let rules = settings[id];

                    if(!defined(rules))
                        break;

                    rules = rules.split(',');

                    for(let rule of rules) {
                        if(!(rule && rule.length))
                            continue;

                        let R = document.createElement('input');

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
                    assignValue(element, settings[id]);
                    break;
            }
        }
    });
}

document.body.onload = async() => {
    await LoadSettings();

    $('.summary', true).map(element => {
        let article = element.parentElement,
            summary = element,
            uuid = 'uuid-' + Math.random().toString(36).replace('.','');

        if(summary.children.length <= 2)
            return;

        let margin = ['.5rem'],
            getHeight = element => {
                let style = getComputedStyle(element),
                    attributes = ['height'],
                    height = 0;

                for(let attribute of attributes)
                    height += parseInt(style[attribute]);

                return height;
            };

        // summary *
        let not = [];

        summary.id = uuid;
        $('input, img, div, h1, h2, h3, h4, h5, h6, ol, ul, p'.split(',').map(e=>`#${uuid} > ${e}${ not.map(n=>`:not(${n})`).join('') }`).join(','), true, summary)
            .map(element => {
                let height = getHeight(element);

                if(height)
                    margin.push(height + 'px');
                else
                    element.setAttribute('style', 'display:none!important');
            });

        summary.setAttribute('style', `padding-bottom:calc(${ margin.join(' + ') })`);
    });
};

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

// $('#version').setAttribute('version', Manifest.version);

// Eveyting else
$('[glyph]', true).map(element => {
    let glyph = element.getAttribute('glyph');

    glyph = Glyphs[glyph];

    element.innerHTML = glyph;

    glyph = $('svg', false, element);

    if(glyph)
        glyph.setAttribute('style', 'height: inherit; width: inherit; vertical-align: text-bottom');
});

let url = parseURL(location.href),
    search = url.searchParameters;

if(search.popup) {
    $('body').classList.add('popup');
}
