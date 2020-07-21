/*** /tools.js
 *      _______          _       _
 *     |__   __|        | |     (_)
 *        | | ___   ___ | |___   _ ___
 *        | |/ _ \ / _ \| / __| | / __|
 *        | | (_) | (_) | \__ \_| \__ \
 *        |_|\___/ \___/|_|___(_) |___/
 *                             _/ |
 *                            |__/
 */
let $ = (selector, multiple = false, container = document) => multiple? [...container.querySelectorAll(selector)]: container.querySelector(selector);
let empty = value => (value === undefined || value === null),
    defined = value => !empty(value);

let configuration = {},
    username,
    display,
    visible = [],
    Jobs = {},
    Timers = {},
    Handlers = {},
    // These are setting names. Anything else will be removed
    usable_settings = ['auto_claim', 'highlight_messages', 'filter_messages', 'filter_rules', 'keep_watching', 'stop_raiding', 'auto_follow', 'auto_reload'];

display = $('[data-a-target="user-menu-toggle"i]');

// Populate the username field by quickly showing the menu
display.click();
display.click();

username = $('[data-a-target="user-display-name"i]').innerText.toLowerCase();

let browser, Runtime, Container, BrowserNamespace;

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

// https://stackoverflow.com/a/2117523/4211612
// https://gist.github.com/jed/982883
// Creates a random UUID
// new UUID() -> String
class UUID {
    constructor() {
        let native = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));

        this.native = native;

        this[Symbol.toPrimitive] = type => {
            switch(type) {
                case 'boolean':
                    return true;

                case 'default':
                case 'string':
                    return native;

                case 'number':
                    return NaN;

                case 'object':
                    return native;

                default:
                    break;
            }
        };

        return this;
	}

	toArray() {
		return this.native;
	}

    toString() {
        return this.value;
    }
}

// Get the current configuration
// GetConfiguration() -> Object
function GetConfiguration() {
    return new Promise((resolve, reject) => {
        function ParseSettings(settings) {
            for(let setting in settings)
                if(!!~usable_settings.indexOf(setting))
                    settings[setting] = settings[setting] || null;
                else
                    delete settings[setting];

            resolve(settings);
        }

        Storage.get(null, settings =>
            Runtime.lastError?
                Storage.get(null, ParseSettings):
            ParseSettings(settings)
        );
    });
}


// Create an object of the current chat
// GetChat(lines:integer[, keepEmotes:boolean]) -> Object { style, author, emotes, message, mentions, element, uuid, highlighted }
function GetChat(lines = 30, keepEmotes = false) {
    let chat = $('[data-a-target^="chat-"] .chat-list .chat-line__message', true).slice(-lines),
        emotes = {},
        results = [];

    for(let line of chat) {
        let author = $('.chat-line__username', true, line).map(element => element.innerText).toString().toLowerCase(),
            mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()),
            message = $('.mention-fragment, .chat-line__username ~ .text-fragment, .chat-line__username ~ img, .chat-line__username ~ a, .chat-line__username ~ * .text-fragment, .chat-line__username ~ * img, .chat-line__username ~ * a', true, line)
                .map(element => element.alt && keepEmotes? `[[${ (e=>{emotes[e.alt]=e.src;return e})(element).alt }]]`: element.innerText)
                .filter(element => element)
                .join(" ")
                .trim(),
            style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join('');

        results.push({
            style,
            author,
            message,
            mentions,
            element: line,
            uuid: (new UUID + ''),
            highlighted: !!line.classList.value.split(" ").filter(value => /^chat-line--/i.test(value)).length,
        });
    }

    let bullets = $('[data-a-target^="chat-"i] .tw-accent-region', true).slice(-lines);

    if(bullets.length)
        results.bullets = [];

    for(let bullet of bullets) {
        let message = bullet.textContent,
            mentions = $('.chatter-name', true, bullet).map(element => element.innerText.toLowerCase()),
            subject = (
                /\bgift/i.test(message)? 'gift':
                /\bsubs/i.test(message)? 'subscription':
                null
            );

        results.bullets.push({
            subject,
            message,
            mentions,
            uuid: new UUID,
            element: bullet,
        });
    }

    results.emotes = emotes;

    return results;
}

let Glyphs = {
    channelpoints: '<svg style="fill:var(--color-accent)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>',
    trash: '<svg width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>'
};

// Update common variables
let streamers,
    streamer,
    { pathname } = top.location;

function update() {
    pathname = top.location.pathname;

    /* Streamers Object
     * href:string  - link to the streamer's channel
     * name:string  - the streamer's username
     * live:boolean - is the streamer live
     */
    streamers = [
        // Current streamers
        ...$(`.side-bar-contents a:not([href="${ pathname }"i])`, true).map(element => {
            return {
                href: element.href,
                name: $('figure img', false, element).alt,
                live: empty($('div[class*="--offline"i]', false, element))
            };
        }),
    ];

    /* Streamer Object
     * href:string  - link to the streamer's channel (the current href)
     * name:string  - the streamer's username
     * like:boolean - are you following
     * paid:boolean - are you subscribed
     * game:string  - the name of the current game/category
     * tags:array   - tags of the strem
     * live:boolean - the the streamer live
     * ping:boolean - are notifications on
     * chat:array*  - an array of the current chat; getter
     */
    streamer = {
        href: top.location.href,
        name: ($(`a[href="${ pathname }"] h1`) || {}).textContent,
        like: defined($('[data-a-target="unfollow-button"i]')),
        paid: defined($('[data-a-target="subscribed-button"i]')),
        game: ($('[data-a-target="stream-game-link"i]') || {}).textContent,
        tags: $('.tw-tag', true).map(element => element.textContent.toLowerCase()),
        live: defined($(`a[href="${ pathname }"] .tw-channel-status-text-indicator`)),
        ping: defined($('[data-a-target="notifications-toggle"i] [class*="--notificationbellfilled"]')),

        get chat() {
            return GetChat()
        },
    };
}

Storage.onChanged.addListener((changes, namespace) => {
    for(let key in changes) {
        let change = changes[key],
            { oldValue, newValue } = change;

        if(newValue === false) {
            clearInterval(Jobs[key]);

            delete Jobs[key];
        } else if(newValue === true) {
            Jobs[key] = setInterval(Handlers[key], Timers[key]);
        }

        configuration[key] = newValue;
    }
});

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

/***
*      _____       _ _   _       _ _          _   _
*     |_   _|     (_) | (_)     | (_)        | | (_)
*       | |  _ __  _| |_ _  __ _| |_ ______ _| |_ _  ___  _ __
*       | | | '_ \| | __| |/ _` | | |_  / _` | __| |/ _ \| '_ \
*      _| |_| | | | | |_| | (_| | | |/ / (_| | |_| | (_) | | | |
*     |_____|_| |_|_|\__|_|\__,_|_|_/___\__,_|\__|_|\___/|_| |_|
*
*
*/
let Initialize = async(startover = false) => {
    configuration = await GetConfiguration();

    update();
    setInterval(update, 100);

    if(startover) {
        Initialize.errors |= 0;

        for(let job in Jobs)
            clearInterval(Jobs[job]);

        Initialize.errors++
    }

    /***
     *                    _                  _       _              _____ _                            _   _____      _       _
     *         /\        | |                | |     (_)            / ____| |                          | | |  __ \    (_)     | |
     *        /  \  _   _| |_ ___ ______ ___| | __ _ _ _ __ ___   | |    | |__   __ _ _ __  _ __   ___| | | |__) |__  _ _ __ | |_ ___
     *       / /\ \| | | | __/ _ \______/ __| |/ _` | | '_ ` _ \  | |    | '_ \ / _` | '_ \| '_ \ / _ \ | |  ___/ _ \| | '_ \| __/ __|
     *      / ____ \ |_| | || (_) |    | (__| | (_| | | | | | | | | |____| | | | (_| | | | | | | |  __/ | | |  | (_) | | | | | |_\__ \
     *     /_/    \_\__,_|\__\___/      \___|_|\__,_|_|_| |_| |_|  \_____|_| |_|\__,_|_| |_|_| |_|\___|_| |_|   \___/|_|_| |_|\__|___/
     *
     *
     */
    Handlers.auto_claim = () => {
        let ChannelPoints = $('[data-test-selector="community-points-summary"i] button[class*="--success"]'),
            Enabled = $('#auto-community-points').getAttribute('enabled') === 'true';

        if(Enabled && ChannelPoints)
            ChannelPoints.click();

        $('#auto-community-points [role="tooltip"i]').innerText = $('div:not(#auto-community-points) > [data-test-selector="community-points-summary"i] [role="tooltip"i]').innerText;
    };
    Timers.auto_claim = 5000;

    if(configuration.auto_claim)
        (() => {
            let button;
            let comify = number => (number + '').split('').reverse.join().replace(/(\d{3})/g, '$1,').split('').reverse().join('');

            if(!defined($('#auto-community-points'))) {
                let parent = $('[data-test-selector="community-points-summary"i]'),
                    heading = $('.top-nav__menu > div', true).slice(-1)[0],
                    element = document.createElement('div');

                if(!defined(parent)) {
                    if(!Initialize.errors)
                        setTimeout(() => Initialize(true), 15000);

                    if(empty(streamer.name))
                        throw `Currently not watching any stream. Re-initailizing in 15s`;
                    else
                        throw `${ streamer.name } has not enabled Community Channel Points. Re-initailizing in 15s`;
                }

                element.innerHTML = parent.outerHTML;
                element.id = 'auto-community-points';
                element.classList.add('community-points-summary', 'tw-align-items-center', 'tw-flex', 'tw-full-height');

                heading.insertBefore(element, heading.children[1]);

                $('#auto-community-points [data-test-selector="community-points-summary"i] > div:last-child:not(:first-child)').remove();

                button = {
                    element: element,
                    icon: $('svg[class*="channel"i][class*="points"i], img[class*="channel"i][class*="points"i]', false, element),
                    text: $('[class$="animated-number"i]', false, element),
                    enabled: true
                };

                button.text.innerText = 'ON';
                button.icon.outerHTML = Glyphs.channelpoints;
                button.element.setAttribute('enabled', true);

                button.icon = $('svg', false, element);
            }

            button.element.onclick = event => {
                let enabled = button.element.getAttribute('enabled') !== 'true';

                button.element.setAttribute('enabled', enabled);
                button.text.innerText = ['OFF','ON'][+enabled];
                button.icon.setAttribute('style', `fill:var(--color-${ ['red','accent'][+enabled] }) !important;`);

                console.log({ button })
            };

            Jobs.auto_claim = setInterval(Handlers.auto_claim, Timers.auto_claim);
        })();

    /***
     *      __  __                                  _    _ _       _     _ _       _     _
     *     |  \/  |                                | |  | (_)     | |   | (_)     | |   | |
     *     | \  / | ___  ___ ___  __ _  __ _  ___  | |__| |_  __ _| |__ | |_  __ _| |__ | |_ ___ _ __
     *     | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \ |  __  | |/ _` | '_ \| | |/ _` | '_ \| __/ _ \ '__|
     *     | |  | |  __/\__ \__ \ (_| | (_| |  __/ | |  | | | (_| | | | | | | (_| | | | | ||  __/ |
     *     |_|  |_|\___||___/___/\__,_|\__, |\___| |_|  |_|_|\__, |_| |_|_|_|\__, |_| |_|\__\___|_|
     *                                  __/ |                 __/ |           __/ |
     *                                 |___/                 |___/           |___/
     */
    Handlers.highlight_messages = () => {
        let chat = GetChat().filter(line => !!~line.mentions.indexOf(username));

        for(let line of chat) {
            if(!~visible.indexOf(line.uuid)) {
                line.element.setAttribute('style', 'background-color: var(--color-background-button-primary-active)');
                visible.push(line.element.uuid);
            }
        }
    };
    Timers.highlight_messages = 500;

    if(configuration.highlight_messages)
        Jobs.highlight_messages = setInterval(Handlers.highlight_messages, Timers.highlight_messages);

     /***
     *      __  __                                  ______ _ _ _
     *     |  \/  |                                |  ____(_) | |
     *     | \  / | ___  ___ ___  __ _  __ _  ___  | |__   _| | |_ ___ _ __
     *     | |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \ |  __| | | | __/ _ \ '__|
     *     | |  | |  __/\__ \__ \ (_| | (_| |  __/ | |    | | | ||  __/ |
     *     |_|  |_|\___||___/___/\__,_|\__, |\___| |_|    |_|_|\__\___|_|
     *                                  __/ |
     *                                 |___/
     */
    Handlers.filter_messages = () => {
        let rules = configuration.filter_rules;

        if(!rules || !rules.length)
            return;

        rules = rules.split(',').filter(value => value.length);

        if(!rules.length)
            return;

        let text = rules.filter(text => !/^@/.test(text)).join('|'),
            user = rules.filter(text => /^@/.test(text)).map(user => user.replace(/^@/, '')).join('|');

        let Filter = {
            text: (text.length? RegExp(`\\b(${ text })\\b`, 'i'): /^[\b]$/),
            user: (user.length? RegExp(`\\b(${ user })\\b`, 'i'): /^[\b]$/),
        };

        GetChat().filter(line => {
            return Filter.text.test(line.message)
                || Filter.user.test(line.author)
        }).map(line => line.element.remove());
    };
    Timers.filter_messages = 500;

    if(configuration.filter_messages)
        Jobs.filter_messages = setInterval(Handlers.filter_messages, Timers.filter_messages);

     /***
     *      _   _           _      _____ _
     *     | \ | |         | |    / ____| |
     *     |  \| | _____  _| |_  | (___ | |_ _ __ ___  __ _ _ __ ___   ___ _ __
     *     | . ` |/ _ \ \/ / __|  \___ \| __| '__/ _ \/ _` | '_ ` _ \ / _ \ '__|
     *     | |\  |  __/>  <| |_   ____) | |_| | |  __/ (_| | | | | | |  __/ |
     *     |_| \_|\___/_/\_\\__| |_____/ \__|_|  \___|\__,_|_| |_| |_|\___|_|
     *
     *
     */
    Handlers.keep_watching = () => {
        let online = streamers.filter(streamer => streamer.live),
            next = online[0];

        if(!streamer.live) {
            if(online.length) {
                console.warn(`${ streamer.name } is no longer live. Moving onto next streamer (${ next.name })`, next.href);

                open(next.href, '_self');
            } else  {
                console.warn(`${ streamer.name } is no longer live. There doesn't seem to be any followed streamers on right now`);
            }
        }
    };
    Timers.keep_watching = 5000;

    if(configuration.keep_watching)
        Jobs.keep_watching = setInterval(Handlers.keep_watching, Timers.keep_watching);

    /***
     *       _____ _                _____       _     _ _
     *      / ____| |              |  __ \     (_)   | (_)
     *     | (___ | |_ ___  _ __   | |__) |__ _ _  __| |_ _ __   __ _
     *      \___ \| __/ _ \| '_ \  |  _  // _` | |/ _` | | '_ \ / _` |
     *      ____) | || (_) | |_) | | | \ \ (_| | | (_| | | | | | (_| |
     *     |_____/ \__\___/| .__/  |_|  \_\__,_|_|\__,_|_|_| |_|\__, |
     *                     | |                                   __/ |
     *                     |_|                                  |___/
     */
    Handlers.stop_raiding = () => {
        let online = streamers.filter(streamer => streamer.live),
            next = online[0],
            raiding = $('[data-test-selector="raid-banner"]');

        if(raiding)
            if(online.length) {
                console.warn(`${ streamer.name } is raiding. Moving onto next streamer (${ next.name })`, next.href);

                open(next.href, '_self');
            } else {
                console.warn(`${ streamer.name } is raiding. There doesn't seem to be any followed streamers on right now`);
            }
    };
    Timers.stop_raiding = 5000;

    if(configuration.stop_raiding)
        Jobs.stop_raiding = setInterval(Handlers.stop_raiding, Timers.stop_raiding);

    /***
     *                    _              ______    _ _
     *         /\        | |            |  ____|  | | |
     *        /  \  _   _| |_ ___ ______| |__ ___ | | | _____      __
     *       / /\ \| | | | __/ _ \______|  __/ _ \| | |/ _ \ \ /\ / /
     *      / ____ \ |_| | || (_) |     | | | (_) | | | (_) \ V  V /
     *     /_/    \_\__,_|\__\___/      |_|  \___/|_|_|\___/ \_/\_/
     *
     *
     */

    Handlers.auto_follow = () => {
        if(!defined(streamer))
            return;

        let url = parseURL(top.location.href),
            data = url.searchParameters;

        if(!streamer.like && data.referrer == 'raid')
            $('[data-a-target="follow-button"]').click();
    };
    Timers.auto_follow = 1000;

    if(configuration.auto_follow)
        Jobs.auto_follow = setInterval(Handlers.auto_follow, Timers.auto_follow);

    /*** NOT A SETTING; THIS IS A HELPER FOR: FILTER-MESSAGES
     *      ______                  ______ _ _ _
     *     |  ____|                |  ____(_) | |
     *     | |__   __ _ ___ _   _  | |__   _| | |_ ___ _ __
     *     |  __| / _` / __| | | | |  __| | | | __/ _ \ '__|
     *     | |___| (_| \__ \ |_| | | |    | | | ||  __/ |
     *     |______\__,_|___/\__, | |_|    |_|_|\__\___|_|
     *                       __/ |
     *                      |___/
     */

    Handlers.easy_filter = () => {
        let card = $('[data-a-target="viewer-card"]'),
            existing = $('#twitch-tools-filter-user');

        if(!defined(card) || defined(existing))
            return;

        let title = $('h4', false, card),
            username = title.textContent.toLowerCase(),
            { filter_rules } = configuration;

        if(filter_rules && !!~filter_rules.split(',').indexOf(`@${ username }`))
            return /* Already filtering messages from this person */;

        let filter = document.createElement('div');

        filter.id = 'twitch-tools-filter-user';
        filter.title = `Filter all messages from @${ username }`;
        filter.setAttribute('style', 'cursor:pointer; fill:var(--color-white); font-size:1.1rem; font-weight:normal');
        filter.setAttribute('username', username);

        filter.onclick = event => {
            let target = $('#twitch-tools-filter-user'),
                username = target.getAttribute('username'),
                { filter_rules } = configuration;

            filter_rules = (filter_rules || '').split(',');
            filter_rules.push(`@${ username }`);
            filter_rules = filter_rules.join(',');

            target.remove();

            Storage.set({ filter_rules });
        };

        filter.innerHTML = `${ Glyphs.trash } Filter messages from @${ username }`;

        let svg = $('svg', false, filter);

        svg.setAttribute('style', 'vertical-align:bottom; height:20px; width:20px');

        title.appendChild(filter);
    };
    Timers.easy_filter = 500;

    Jobs.easy_filter = setInterval(Handlers.easy_filter, Timers.easy_filter);

    /***
     *                    _              _____      _                 _
     *         /\        | |            |  __ \    | |               | |
     *        /  \  _   _| |_ ___ ______| |__) |___| | ___   __ _  __| |
     *       / /\ \| | | | __/ _ \______|  _  // _ \ |/ _ \ / _` |/ _` |
     *      / ____ \ |_| | || (_) |     | | \ \  __/ | (_) | (_| | (_| |
     *     /_/    \_\__,_|\__\___/      |_|  \_\___|_|\___/ \__,_|\__,_|
     *
     *
     */
    Handlers.auto_reload = () => {
        let error_message = $('[data-a-target="player-overlay-content-gate"]'),
            search = [];

        if(!defined(error_message))
            return;

        let url = parseURL(location.href),
            parameters = url.searchParameters;

        if(parameters.fail)
            parameters.fail = parseInt(parameters.fail) + 1;
        else
            search.push('fail=1');

        for(let key in parameters)
            search.push(`${key}=${parameters[key]}`);

        location.search = '?' + search.join('&');
    };
    Timers.auto_reload = 1000;

    Jobs.auto_reload = setInterval(Handlers.auto_reload, Timers.auto_reload);
};

let WaitForPageToLoad = setInterval(() => {
    let ready = defined($(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`));

    if(ready) {
        Initialize();
        clearInterval(WaitForPageToLoad);
    }
}, 500);
