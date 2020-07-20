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

    for(let id of using)
        settings[id] = extractValue($(`#${ id }`));

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

            assignValue(element, settings[id]);
        }
    });
}

document.body.onload = LoadSettings;
$('#save, #save-small', true).map(element => element.onclick = SaveSettings);
