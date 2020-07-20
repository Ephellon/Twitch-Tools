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

let configuration;

let browser, Storage, Runtime, Container, BrowserNamespace;

if(browser && browser.runtime)
    BrowserNamespace = 'browser';
else if(chrome && chrome.extension)
    BrowserNamespace = 'chrome';

Container = window[BrowserNamespace];

switch(BrowserNamespace) {
    case 'browser':
        Runtime = Container.runtime;
        Storage = Container.storage;

        Storage = Storage.sync || Storage.local;
        break;

    case 'chrome':
    default:
        Runtime = Container.extension;
        Storage = Container.storage;

        Storage = Storage.sync || Storage.local;
        break;
}

let // These are option names. Anything else will be removed
    usable_settings = ['auto_claim', 'highlight_messages', 'filter_messages', 'filter_rules', 'keep_watching', 'stop_raiding', 'auto_follow'];

let Glyphs = {
    channelpoints: '<svg style="fill:var(--color-accent)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    trash: '<svg style="fill:var(--color-accent)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>'
};

$('details', true).map(element => {
    element.ontoggle = event => {
        let article = element.parentElement,
            details = element,
            summary = $('summary', false, details);

        if(details.open) {
            article.classList.add('focus');

            let margin = ['5rem'],
                getHeight = element => {
                    let style = getComputedStyle(element),
                        heights = ['height', 'borderTop', 'borderBottom', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom'],
                        height = 10;

                    for(let attribute of heights)
                        height += parseInt(style[attribute]);

                    return height;
                };

            if('more' in summary.attributes)
                for(let element of $('summary ~ input', true, details))
                    margin.push(getHeight(element) + 'px');

            $('img', true, details)
                .map(img => {
                    let { height } = img;

                    if(height)
                        margin.push(height + 'px');
                    else
                        img.setAttribute('style', 'display:none!important');
                });

            article.setAttribute('style', `margin-bottom:calc(${ margin.join(' + ') })`);
        } else {
            article.classList.remove('focus');
            article.removeAttribute('style');
        }
    }
});

function SaveSettings() {
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

    Storage.set(settings);
}

function LoadSettings() {
    let assignValue = (element, value) => {
        return element[{
            text: 'value',
            checkbox: 'checked',
        }[element.type]] = value;
    };

    let elements = $(usable_settings.map(name => '#' + name).join(', '), true),
        using = elements.map(element => element.id);

    Storage.get(null, settings => {
        for(let id of using) {
            let element = $(`#${ id }`);

            if(!~['filter_rules'].indexOf(id))
                assignValue(element, settings[id]);
            else
                switch(id) {
                    case 'filter_rules':
                        let rules = settings[id].split(',');

                        for(let rule of rules) {
                            let R = document.createElement('input');

                            if(!(rule && rule.length))
                                continue;

                            R.type = 'button';
                            R.value = rule;
                            R.title = `Remove "${ rule }"`;
                            R.classList.add('remove');

                            R.onclick = event => {
                                let { target } = event;

                                target.remove();
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
$('#save, #save-small', true).map(element => element.onclick = SaveSettings);
