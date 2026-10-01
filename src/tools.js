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

/** @file Defines the page-specific logic for the extension. Used for all {@link # twitch.tv/*} sites.
 * <style>[pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[good]{background:#e8f0fe;color:#174ea6}[bad]{background:#fce8e6;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

window.IS_A_FRAMED_CONTAINER = (top != window);

let Queue = top.Queue = { balloons: [], bullets: [], bttv_emotes: [], emotes: [], messages: [], message_popups: [], popups: [] }
    , Messages = top.Messages = new Map()
    , PostOffice = top.PostOffice = new Map()
    , UserMenuToggleButton, SignUpBanner
    // These won't change (often)
    , ACTIVITY
    , USERNAME
    , LANGUAGE
    , THEME
    , ANTITHEME
    , THEME__CHANNEL_DARK
    , THEME__CHANNEL_LIGHT
    , THEME__BASE_CONTRAST
    , THEME__PREFERRED_CONTRAST
    , LITERATURE
    , SPECIAL_MODE = $.defined('[data-test-selector="exit-button"i]')
    , NORMAL_MODE = !SPECIAL_MODE
    // Hmm...
    , JUMPED_FRAMES = false
    , JUMP_DATA = {}
    , STASH_SAVED = false
    , UP_NEXT_ALLOW_THIS_TAB;

top.WINDOW_STATE = document.readyState;
top.TWITCH_INTEGRITY_FAIL = false;

document.onreadystatechange = event => top.WINDOW_STATE = document.readyState;

// Populate the username field by quickly showing the menu
when.defined(() => {
    SignUpBanner ??= $('[data-test-target*="upsell"i][data-test-target*="banner"i]');
    return UserMenuToggleButton ??= $('[data-a-target="user-menu-toggle"i]');
})
    .then(() => {
        // User is logged in. A username is available
        if(nullish(SignUpBanner)) {
            UserMenuToggleButton.click();
            ACTIVITY = window.ACTIVITY = $('[data-a-target="presence-text"i]')?.textContent ?? '';
            USERNAME = window.USERNAME = $('[data-a-target="user-display-name"i]')?.textContent ?? `User_Not_Logged_In_${ +new Date }`;
            THEME = window.THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c))?.replace(/[^]*theme-(\w+)/i, '$1').toLowerCase() ?? 'dark';
            ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme != THEME).pop();

            $('[data-a-target^="language"i]')?.click();
            LITERATURE = window.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language ?? '';
            UserMenuToggleButton.click();
        } else {
            ACTIVITY = window.ACTIVITY = '';
            USERNAME = window.USERNAME = `User_Not_Logged_In_${ +new Date }`;
            THEME = window.THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c))?.replace(/[^]*theme-(\w+)/i, '$1').toLowerCase() ?? 'dark';
            ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme != THEME).pop();
        }

        Runtime.sendMessage({ action: 'POST_SHARED_DATA', data: { USERNAME, THEME, ANTITHEME, ACTIVITY } });
    });

top.onpagehide = ({ persisted }) => {
    top.WINDOW_STATE = (persisted ? document.readyState : 'unloading');
};

// Twitch-wide errors
when(() => top.TWITCH_INTEGRITY_FAIL, 5_000).then(() => {
    const error = `<div hidden controller title="Twitch Integrity Fail" okay="OK" deny="OK. Do not show again">${ (new Date).toJSON() }</div>
    Unable to perform some Twitch-wide actions right now.

    <br><br>

    This issue typically resolves itself within 48 hours.

    <br><br>

    <strong>Do not</strong> log out. You <strong>will not</strong> be able to log back in.

    <br><br>

    It is <strong>not</strong> recommended you follow the <a href="//help.twitch.tv/s/article/supported-browsers#troubleshooting" target=_blank>troubleshooting steps</a> but, you are free to do so if you wish.
    `;

    Cache.load('PREVENT_POPUPS', ({ PREVENT_POPUPS = {} }) => {
        if(!parseBool(PREVENT_POPUPS?.integrity_fail))
            confirm.silent(error).then(continueDisplaying => {
                if(continueDisplaying === false)
                    Cache.save({ PREVENT_POPUPS: { ...PREVENT_POPUPS, integrity_fail: true } });
            });
        else
            alert.timed(error, 5_000, true);
    });
});

// Twith's "bonus button blunder" issue...
// If the bonus button is present before the extension finishes loading, the display completely breaks...
BONUS_BUTTON_BLUNDER: {
    when.defined(() => null
        ?? $.last('[class*="bonus"i]')?.closest('button')
        ?? $.last('[data-test-selector*="points"i][data-test-selector*="summary"i] button[class*="success"i]')
        ?? $.last('[data-test-selector*="points"i][data-test-selector*="summary"i] button:is([class*="destruct"i], [class*="error"i])')
        ?? $.last('[class*="points"i] button [class*="bonus"i]')?.closest('button')
    ).then(ChannelPointsButton => ChannelPointsButton.click());
}

/*** Setup (pre-init) - #MARK:classes #MARK:functions #MARK:methods
 *       _____      _                  __                      _       _ _ __
 *      / ____|    | |                / /                     (_)     (_) |\ \
 *     | (___   ___| |_ _   _ _ __   | | _ __  _ __ ___        _ _ __  _| |_| |
 *      \___ \ / _ \ __| | | | '_ \  | || '_ \| '__/ _ \______| | '_ \| | __| |
 *      ____) |  __/ |_| |_| | |_) | | || |_) | | |  __/______| | | | | | |_| |
 *     |_____/ \___|\__|\__,_| .__/  | || .__/|_|  \___|      |_|_| |_|_|\__| |
 *                           | |      \_\ |                                /_/
 *                           |_|        |_|
 */

;

// UI primitives (Balloon, ChatFooter, Card, ContextMenu, Search, Chat) and the player/page helpers
// (parseCoin, Get/Set Quality/Volume/ViewMode, GetActivity, GetLanguage, ReloadPage) live in src/lib/,
// bundled into lib.js, which the manifest loads right before this file.

// Import the glyphs
let { Glyphs } = top;

// Returns ordinal numbers
    // nth(n:number, s:string?) → string
/**
 * Converts a number into a localized ordinal string.
 * @param {*} n - The number to convert
 * @param {string} [s=''] - Optional suffix or position type
 * @returns {string} The localized ordinal representation
 */
let nth = (n, s = '') => {
    n += '';

    /**
     * Provides a localized string suffix for ordinal positions based on the current language.
     * @param {string} [s=''] - The position type (e.g., 'ordinal-position')
     * @returns {string} The localized suffix string
     */
    const c = (s = '') => {
        switch(s.trim()) {
            case 'ordinal-position': {
                switch(window.LANGUAGE) {
                    case 'bg': { return ' място' }
                    case 'cs': { return ' místo' }
                    case 'da': { return ' plads' }
                    case 'de': { return ' Reihe' }
                    case 'en': { return ' in line' }
                    case 'el': { return ' θέση' }
                    case 'es': { return ' en línea' }
                    case 'fi': { return ' sija' }
                    case 'fr': { return 'ème en ligne' }
                    case 'hu': { return ' a sorban' }
                    case 'it': { return ' di fila' }
                    case 'nl': { return 'e in de rij' }
                    case 'no': { return ' i rekken' }
                    case 'pl': { return ' w kolejce' }
                    case 'ro': { return ' pe linie' }
                    case 'ru': { return ' в строке' }
                    case 'sk': { return ' v poradí' }
                    case 'sv': { return 'a i raden' }
                    case 'tr': { return ' sırada' }
                    case 'vi': { return ' trong dòng' }

                    default: { return '' }
                } // switch s.trim() | 'ordinal-position' | switch window.LANGUAGE
            } break;

            default: {
                switch(window.LANGUAGE) {
                    case 'fr':
                    case 'sv': {
                        return 'e';
                    }
                    case 'ro': { return '' }
                } // switch s.trim() | default | switch window.LANGUAGE
            }
        }

        return s;
    };

    switch(window.LANGUAGE) {
        case 'bg': {
            // 1-то 2-то 3-то ... 11-то 12-то 13-то ... 21-то 22-то 23-то

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1-то')
                + c(s);
        } break;

        case 'cs':
        case 'da':
        case 'de':
        case 'fi':
        case 'hu':
        case 'no':
        case 'pl':
        case 'sk':
        case 'tr': {
            // 1. 2. 3. 4. ... 11. 12. 13. ... 21. 22. 23.

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1.')
                + c(s);
        } break;

        case 'el': {
            // 1η 2η 3η 4η ... 11η 12η 13η ... 21η 22η 23η

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1η')
                + c(s);
        } break;

        case 'es': {
            // 1° 2° 3° 4° ... 11° 12° 13° ... 21° 22° 23°

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1°')
                + c(s);
        } break;

        case 'fr':
        case 'nl': {
            // 1e 2e 3e 4e ... 11e 12e 13e ... 21e 22e 23e

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1')
                + c(s);
        } break;

        case 'it':
        case 'ro': {
            // 1 2 3 4 ... 11 12 13 ... 21 22 23

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1')
                + c(s);
        } break;

        case 'ja':
        case 'zh-ch':
        case 'zh-tw': {
            // 1号 2号 3号 4号 ... 11号 12号 13号 ... 21号 22号 23号

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1号')
                + c(s);
        } break;

        case 'ko': {
            // 1번 2번 3번 4번 ... 11번 12번 13번 ... 21번 22번 23번
            n = n
                .replace(/([\d\s\,\.]+)$/, '$1번')
                + c(s);
        } break;

        case 'ru': {
            // 1-й 2-й 3-й 4-й ... 11-й 12-й 13-й ... 21-й 22-й 23-й

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1-й')
                + c(s);
        } break;

        case 'sv': {
            // 1:e 2:e 3:e 4:e ... 11:e 12:e 13:e ... 21:e 22:e 23:e

            n = n
                .replace(/([\d\s\,\.]+)$/, '$1:')
                + c(s);
        } break;

        case 'th': {
            // หมายเลข #

            n = n
                .replace(/([\d\s\,\.]+)$/, 'หมายเลข $1')
                + c(s);
        } break;

        case 'vi': {
            // Thứ #

            n = n
                .replace(/([\d\s\,\.]+)$/, 'Thứ $1')
                + c(s);
        } break;

        case 'en':
        default: {
            // 1st 2nd 3rd 4th ... 11th 12th 13th ... 21st 22nd 23rd

            n = n
                .replace(/(0|1[123]|[4-9])$/, '$1th')
                .replace(/1$/, '1st')
                .replace(/2$/, '2nd')
                .replace(/3$/, '3rd')
                + c(s);
        } break;
    } // switch window.LANGUAGE

    return n;
};

// Returns a unique list of channels (used with `Array..filter`)
    // uniqueChannels(channel:object<Channel>, index:number, channels:array) → boolean
/**
 * Determines if a channel is the first occurrence of its name within a list of channels.
 * @param {Object} channel - The channel being checked
 * @param {number} index - The current index in the array
 * @param {Array} channels - The list of channels to filter against
 * @returns {boolean} True if the channel is unique at this index
 */
let uniqueChannels = (channel, index, channels) =>
    channels.filter(channel => defined(channel?.name)).findIndex(ch => ch.name === channel?.name) == index;

// Returns whether or not a channel is live (used with `Array..filter`)
    // isLive(channel:object<Channel>) → boolean
/**
 * Checks if a channel is currently live.
 * @param {Object} channel - The channel object to check
 * @returns {boolean} True if the channel is live
 */
let isLive = channel => parseBool(channel?.live);

/*** Setup (pre-init) #MARK:globals #MARK:variables
 *       _____      _                  __                      _       _ _ __
 *      / ____|    | |                / /                     (_)     (_) |\ \
 *     | (___   ___| |_ _   _ _ __   | | _ __  _ __ ___        _ _ __  _| |_| |
 *      \___ \ / _ \ __| | | | '_ \  | || '_ \| '__/ _ \______| | '_ \| | __| |
 *      ____) |  __/ |_| |_| | |_) | | || |_) | | |  __/______| | | | | | |_| |
 *     |_____/ \___|\__|\__,_| .__/  | || .__/|_|  \___|      |_|_| |_|_|\__| |
 *                           | |      \_\ |                                /_/
 *                           |_|        |_|
 */

;

// Update common variables
let PATHNAME = top.location.pathname
    , NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1')
    // The current streamer
    , STREAMER
    // The followed streamers (excluding STREAMER)
    , STREAMERS
    // All channels on the side-panel (excluding STREAMER)
    , CHANNELS
    // The currently searched-for channels (excluding STREAMER)
    , SEARCH
    , SEARCH_CACHE = new Map()
    // Visible, actionable notifications
    , NOTIFICATIONS
    // All channel commands
    , COMMANDS = []
    // All of the above
    , ALL_CHANNELS;

// Yes, I could make this fail go away... or I can use it to force once-a-page events...
// The following will only execute in the top frame, once
try {
    // Add onlocationchange containers
    Object.defineProperties(top, {
        MiniPlayer: {
            get() {
                return $('#tt-pip-player');
            },

            set(name) {
                const f = furnish;
                const src = `https://player.twitch.tv/?channel=${ name }&controls=false&muted=true&parent=twitch.tv&quality=360p&private=true`;

                let pbyp = $('[class*="picture-by-picture-player"i] video')
                    , pip = $('#tt-pip-player');

                $('#tt-exit-pip')?.remove();
                $('[data-test-selector="picture-by-picture-player-container"i]')?.modStyle('max-height:!delete');
                $('[data-test-selector="picture-by-picture-player-container"i]')?.classList?.remove('picture-by-picture-player--collapsed');

                if(nullish(pbyp))
                    $('.stream-chat').insertAdjacentElement('beforebegin',
                        f('[class="picture-by-picture-player"][data-test-selector=picture-by-picture-player-background]').with(
                            f('[class="picture-by-picture-player"][data-test-selector=picture-by-picture-player-container]').with(
                                f('.tw-aspect').with(
                                    f.div(),
                                    f('.pbyp-player-instance', { autodisplay: setTimeout(() => $('[data-test-selector="picture-by-picture-player-container"i]')?.classList?.remove('picture-by-picture-player--collapsed'), 500) },
                                        pbyp = f('video[webkit-playsinline][playsinline]', {
                                            oncontextmenu: () => false,
                                        })
                                    )
                                )
                            )
                        )
                    );

                if(defined(pip))
                    pip.src = src;
                else
                    pip = f('iframe#tt-pip-player', {
                        src,

                        style: 'height:auto;min-height:7em;width:-webkit-fill-available;width:-moz-available;margin-bottom:7em;position:relative;z-index:9',
                    });

                pip.remove();
                pbyp.modStyle('height:initial');
                pbyp.insertAdjacentElement('afterend', pip);

                pip.dataset.name = name;

                when.defined(() => $('.stream-chat-header'))
                    .then(parent => parent.insertAdjacentElement('afterbegin',
                        f('button#tt-exit-pip', {
                            style: 'position:absolute;left:0;margin-left:1rem;',

                            onmousedown(event) {
                                $.all('#tt-exit-pip, [class*="picture-by-picture-player"i] iframe[src*="player.twitch.tv"i]').map(el => el.modStyle('transition:opacity .5s; opacity:0;'));
                                $('[data-test-selector="picture-by-picture-player-container"i]')?.modStyle('max-height:0');

                                wait(500).then(() => {
                                    removeFromSearch(['mini']);

                                    $('#tt-exit-pip')?.remove();
                                    $('[class*="picture-by-picture-player"i] iframe[src*="player.twitch.tv"i]')?.remove();
                                    $('[data-test-selector="picture-by-picture-player-container"i]')?.classList?.add('picture-by-picture-player--collapsed');
                                });
                            },

                            innerHTML: Glyphs.modify('exit_picture_in_picture', { height: 15, width: 20, fill: 'currentcolor', style: 'vertical-align:middle' }),
                        })
                    ));

                /**
                 * Recursively ensures that the picture-in-picture player remains expanded as long as the exit button is present.
                 */
                function keepOpen() {
                    when.defined(() => $('.picture-by-picture-player[class*="collapsed"i]'))
                        .then(player => {
                            const keep = $.defined('#tt-exit-pip');

                            if(keep)
                                player.classList.remove('picture-by-picture-player--collapsed');

                            return keep;
                        })
                        .then(keep => (keep ? keepOpen() : null));
                }
                keepOpen();

                addToSearch({ mini: name });
            },
        },
    });

    // Automatic garbage collection...
    $remark(`Removing expired cache data...`, new Date);

    Cache.load(null, cache => {
        Object.keys(cache)
            .filter(key => key.startsWith('data/'))
            .map(async key => {
                let data;

                try {
                    data = JSON.parse(await Cache.load(key));
                } catch(error) {
                    data = await Cache.load(key);
                }

                const { dataRetrievedAt } = data;

                // If there isn't a proper date, remove the data...
                if(+dataRetrievedAt < 0)
                    return Cache.remove(key);

                const lastFetch = Math.abs(dataRetrievedAt - +new Date);

                // If the last fetch was more than 30 days ago, remove the data...
                if(lastFetch > (30 * 24 * 60 * 60 * 1000)) {
                    $warn(`\tThe last fetch for "${ key }" was ${ toTimeString(lastFetch) } ago. Marking as "expired"`);

                    Cache.remove(key);
                }
            });

        // delete cache;
    });

    // Add storage listener
    Storage.onChanged.addListener((changes, namespace) => {
        let reload = false
            , refresh = [];

        for(const key in changes) {
            if(SPECIAL_MODE && !!~NORMALIZED_FEATURES.findIndex(feature => feature.test(key)))
                continue;

            const change = changes[key]
                , { oldValue, newValue } = change;

            const name = key
                // Title conversion legend
                .replace(/\$\$/g, ' | ')
                .replace(/\$(\D)/g, '/$1')
                .replace(/__/g, ' - ')
                .replace(/_/g, ' ')
                .replace(/\$1/g, '!')
                .replace(/\$2/g, '@')
                .replace(/\$3/g, '#')
                .replace(/\$5/g, '%')
                .replace(/\$6/g, '^')
                .replace(/\$7/g, '&')
                .replace(/\$8/g, '*')
                .replace(/\$9/g, '(')
                .replace(/\$0/g, ')')
                .replace(/\$4/g, '$')
                .trim();

            if(newValue === false) {
                if(~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    $warn(`Disabling experimental feature: ${ name }`, new Date);
                else
                    $remark(`Disabling feature: ${ name }`, new Date);

                UnregisterJob(key, 'disable');
            } else if(newValue === true) {
                if(~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    $warn(`Enabling experimental feature: ${ name }`, new Date);
                else
                    $remark(`Enabling feature: ${ name }`, new Date);

                RegisterJob(key, 'enable');
            } else {
                if(~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    $warn(`Modifying experimental feature: ${ name }`, { oldValue, newValue }, new Date);
                else
                    $remark(`Modifying feature: ${ name }`, { oldValue, newValue }, new Date);

                switch(key) {
                    case 'away_mode_placement': {
                        RestartJob('away_mode', 'modify');
                    } break;

                    case 'filter_rules': {
                        RestartJob('filter_messages', 'modify');
                    } break;

                    case 'phrase_rules': {
                        RestartJob('highlight_phrases', 'modify');
                    } break;

                    case 'user_language_preference': {
                        const [documentLanguage] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toLowerCase().split('-');

                        window.LANGUAGE = LANGUAGE = newValue || documentLanguage;
                    } break;

                    case 'watch_time_placement': {
                        RestartJob('watch_time_placement', 'modify');
                        RestartJob('points_receipt_placement', 'dependent');
                    } break;

                    case 'whisper_audio_sound': {
                        RestartJob('mention_audio', 'modify');
                        RestartJob('phrase_audio', 'modify');
                        RestartJob('whisper_audio', 'modify');
                    } break;

                    default: { break }
                } // switch key
            }

            reload ||= !!~[...EXPERIMENTAL_FEATURES, ...SENSITIVE_FEATURES].findIndex(feature => feature.test(key));
            if(~[...REFRESHABLE_FEATURES].findIndex(feature => feature.test(key)))
                refresh.push(key);

            Settings[key] = newValue;
        }

        if(reload)
            return ReloadPage();

        for(const job of refresh) {
            RestartJob(job, 'modify');
            (top.REFRESH_ON_CHILD ??= []).push(job);
        }
    });

    // Moved message listener → If nothing responds back, the page gets killed //

    // Jumping frames...
    $remark(`Listening for jumped frame data...`);

    // Receive messages from other content scripts
    top.addEventListener('message', async event => {
        // Twitch's own frames only: the old test also let in `*.ext-twitch.tv` (third-party Twitch Extensions) and
        // look-alikes such as `twitch.tv.example.com`
        if(!/^https:\/\/(?:[\w-]+\.)*twitch\.tv$/i.test(event.origin))
            return /* Not meant for us... */;

        const R = RegExp;
        let { data } = event;

        switch(data?.action || data?.eventName) {
            case 'jump': {
                let BroadcastSettings = {}
                    , Channel = {}
                    , Badges = {}
                    , Points = {}
                    , Stream = {}
                    , User = {}
                    , Game = {}
                    , Tags = {}
                    , Form = {};

                if(nullish(data))
                    break;
                delete data.action;
                data = (data?.data ?? data);

                // Not jump data
                if(!('ROOT_QUERY' in data)) {
                    for(const target in data)
                        PostOffice.set(target, data[target]);
                } else {
                    for(const key in data) {
                        if(/^BroadcastSettings:([^$]+)/.test(key)) {
                            BroadcastSettings[R.$1] = data[key]
                        } else if(/^Channel:([^$]+)/.test(key)) {
                            Channel = data[key]
                        } else if(/^User:([^$]+)/.test(key)) {
                            User[R.$1] = data[key]
                        } else if(/^Stream:([^$]+)/.test(key)) {
                            Stream[R.$1] = data[key]
                        } else if(/^(Game:[^$]+)/.test(key)) {
                            Game[R.$1] = data[key]
                        } else if(/^(Tag:[^$]+)/.test(key)) {
                            Tags[R.$1] = data[key]
                        } else if(/^(Freeform(?:Tag):[^$]+)/.test(key)) {
                            Form[R.$1] = data[key]
                        } else if(/^Badge:([^$]+)/.test(key)) {
                            const [type, length, owner] = atob(R.$1).split(';')
                                , badge = data[key]
                                , id = [owner, type, length].join('_');

                            Badges[id] = ({
                                id,
                                type,
                                owner,
                                length,
                                title: badge.title,
                                version: badge.version,

                                meta: badge,
                            });
                        } else if(/^CommunityPoints(Automatic|Custom)Reward:([^$]+)/.test(key)) {
                            const [type, id] = [R.$1, R.$2].map(s => s.toLowerCase());
                            const store = Points[type] ??= {};

                            if(type.equals('automatic')) {
                                const [channel, name] = id.split(':', 2);

                                if(STREAMER?.sole == parseInt(channel))
                                    store[name] = data[key];
                            } else {
                                store[id] = data[key]
                            }
                        }

                        JUMPED_FRAMES = true;
                    }

                    if(Channel?.id?.length) {
                        LIVE_CACHE?.set('coin', Channel.self?.communityPoints?.balance);
                        LIVE_CACHE?.set('sole', Channel.id);

                        if(JUMPED_FRAMES)
                            for(const channel in BroadcastSettings) {
                                const { id, title } = BroadcastSettings[channel]
                                    , { displayName, login, primaryColorHex } = User[channel];

                                const profileImageURL = (channel => {
                                    for(const key in channel)
                                        if(/^profileImageURL/i.test(key))
                                            return channel[key];
                                })(User[channel]);

                                const stream = (streams => {
                                    destructing: for(let stream in streams) {
                                        if(streams[stream]?.broadcaster?.__ref?.contains?.(channel)) {
                                            stream = streams[stream];

                                            stream.broadcaster = BroadcastSettings[channel];
                                            stream.game = Game[stream.game?.__ref];
                                        } else if(channel.equals(STREAMER?.sole)) {
                                            const { name, sole, live, desc, game, coin, tags, poll, shop } = STREAMER;

                                            stream = {
                                                broadcaster: {
                                                    id: sole,
                                                    title: desc,
                                                },
                                                broadcasterSoftware: 'unknown_rtmp',
                                                game: (game + ''),
                                                id: `stream:${ sole }`,
                                                [`previewImageURL({"height":720,"width":1280})`]: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${ name.toLowerCase() }-1280x720.jpg`,
                                                tags: [...tags],
                                                type: (live ? 'live' : null),
                                                viewersCount: poll,
                                            };
                                        } else {
                                            continue destructing
                                        }

                                        stream.tags = [
                                            stream.tags?.filter?.(defined)?.map(({ __ref }) => Tags[__ref]?.localizedName),
                                            stream.freeformTags?.map?.(({ __ref }) => Form[__ref]?.name),
                                        ].flat().filter(defined);

                                        // Preview images
                                        const previews = {};

                                        for(const key in stream)
                                            if(/^previewImageURL\(([^]+)\)\s*$/i.test(key)) {
                                                const { height, width } = JSON.parse(R.$1);

                                                previews[`${ width }x${ height }`] = stream[key];

                                                delete stream[key];
                                            }

                                        stream.previewImageURL = previews;

                                        // Badges
                                        const badges = { ...Badges };

                                        for(let badge in badges) {
                                            badge = badges[badge];

                                            let max = 0;

                                            for(const key in badge.meta)
                                                if(/^imageURL\b/i.test(key)) {
                                                    let href = badge.meta[key]
                                                        , [path, version, uuid, size] = parseURL(href).pathname.slice(0).split('/');

                                                    size = parseInt(size);

                                                    if(size > max) {
                                                        max = size;
                                                        badge.href = href;
                                                    }
                                                }

                                            delete badge.meta;
                                        }

                                        stream.badges = badges;

                                        // Community Points
                                        if(STREAMER?.sole == stream.broadcaster.id)
                                            stream.points = {
                                                ...Points,
                                                get balance() {
                                                    return Channel.self?.communityPoints?.balance;
                                                },
                                            };

                                        return stream;
                                    } // :destructing

                                    return null;
                                })(Stream);

                                JUMP_DATA[login] = { id: parseFloat(id), title, displayName, login, primaryColorHex, profileImageURL, stream };
                            }

                        Cache.large.save({ JumpedData: JUMP_DATA });
                        // $log('Jumped frames, retrieved:', JUMP_DATA);
                    }
                }
            } break; // switch data?.action || data?.eventName | 'jump'

            case 'raid': {
                let { from, to, events, payable } = data
                    , method = Settings.prevent_raiding ?? 'none';

                if(false
                    || (!UP_NEXT_ALLOW_THIS_TAB)
                    || (from.equals(STREAMER?.name))
                )
                    break;

                // "Would the user allow this raid condition?"
                if(true
                    && payable
                    && (false
                        || (['all', 'greed'].contains(method))
                        || (method.equals('unfollowed') && STREAMERS.contains(({ name }) => RegExp(`^${ to }$`, 'i').test(name)))
                    )
                )
                    confirm
                        .timed(`<a href='./${ from }'><strong>${ from }</strong></a> is raiding <strong>${ to }</strong>. There is a chance to collect bonus channel points...`, 10_000)
                        .then(action => {
                            // The event timed out...
                            action ??= true;

                            if(action) {
                                // The user clicked "OK"
                                // Return to the current page eventually...
                                if(!parseBool(Settings.first_in_line_none)) {
                                    const { name, href } = STREAMER;

                                    Handlers.first_in_line({ href, innerText: `${ name } is live [Greedy Raiding]` }, 'start');
                                }

                                goto(parseURL(`./${ from }`).addSearch({ tool: `raid-stopper--${ method }` }).href);
                            } else {
                                // The user clicked "Cancel"
                                $log("Canceled Greedy Raiding event", { from, to })
                            }
                        });
            } break;

            case 'UPDATE_STATE':
            case 'report-blank-ad': {
                if(false
                    || data.from?.equals?.('player.js')
                    || isFinite(data.params?.duration)
                )
                    $('.tt-stream-preview')?.setAttribute('blank-ad', parseBool(data.purple));
            } break;

            case 'report-offline-dvr': {
                switch(data.from) {
                    case 'player.js': {
                        $(`#${ data.slug }`)?.remove();
                    } break;
                } // switch data?.action || data?.eventName | 'report-offline-dvr' | switch data.from
            } break;

            case 'open-options-page': {
                Runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE' });
            } break;
        } // switch data?.action || data?.eventName
    });

    // Add custom context menus
    $remark(`Adding context menus...`);

    // Normal - Page body
    // Reload (Ctrl+R)
    // ----
    // Save as... (Ctrl+S)
    // Print... (Ctrl+P)
    $.body.addEventListener('contextmenu', event => {
        if(false
            || !event.isTrusted
            || !Settings.context_menu_override
        )
            return;
        event.preventDefault(true);
        // event.stopPropagation();

        const extras = [];
        let { x, y } = event
            , { availHeight, availWidth } = screen
            , { innerHeight, innerWidth } = window;

        // Text Selection(s)
        let selectionText = getSelection()
            , { baseNode, baseOffset, extentNode, extentOffset } = selectionText;

        selectionText = (selectionText + '').trim().normalize('NFKD');

        // Anchors
        const anchor = event.target.closest('a, [href]');

        // Images
        const image = event.target.closest('img, picture');

        // Videos
        const video = event.target.closest('[data-a-target="video-player"i]');

        // Iframes
        const iframe = event.target.closest('iframe:is([src^="https://player.twitch.tv/"i], [src^="//player.twitch.tv"i], [src^="player.twitch.tv"i])');

        // ---- ---- START ---- ---- //

        // Text Selection(s)
        if(selectionText?.length) {
            const email = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i;

            if(email.test(selectionText)) {
                const address = RegExp['$&'];

                extras.push({
                    text: `E-mail <strong>${ address }</strong>`,
                    icon: 'chat',
                    action: event => top.open(`mailto:${ address }`, '_blank'),
                }, {});
            }

            const phone = /(?<country>[\+]?\d{1,3})?[\.\-\s\(]{0,2}(?<area>[2-9]\d{2})[\)\.\-\s]{0,2}(?<office>[2-9][02-9]1|[2-9]1[02-9]|[2-9][02-9][02-9])[\.\-\s]?(?<line>\d{4})/;

            if(phone.test(selectionText)) {
                const number = RegExp['$&'];

                extras.push({
                    text: `Dial <strong>${ number }</strong>`,
                    icon: 'chat',
                    action: event => top.open(`tel:${ number.replace(/[^\d\+]/g, '') }`, '_blank'),
                }, {});
            }

            const website = /(https?:\/\/)?([^\/?#]+?\.\w{2,}\/)([^?#]*)(\?[^#]*)?(#.*)?/i;

            if(website.test(selectionText)) {
                const { protocol, host, pathname, search, hash } = parseURL(selectionText)
                    , url = [(protocol || 'https:') + '//', host, pathname, search, hash].join('');

                extras.push({
                    text: `Open link in new tab`,
                    icon: 'ne_arrow',
                    action: event => top.open(url, '_blank'),
                }, {
                    text: `Copy link address`,
                    icon: 'bolt',
                    action: event => navigator.clipboard.writeText(url),
                });
            } else {
                extras.push({
                    text: `Search Twitch for <strong>${ selectionText }</strong>`,
                    icon: 'twitch',
                    action: event => top.open(`https://www.twitch.tv/search?term=${ encodeURIComponent(selectionText.trim().replace(/\s+/g, ' ')).split(/(?:%20)+/).join(' ') }`, '_self'),
                }, {
                    text: `Search Google for <strong>${ selectionText }</strong>`,
                    icon: 'search',
                    action: event => top.open(`https://www.google.com/search?q=${ encodeURIComponent(selectionText.trim().replace(/\s+/g, ' ')).split(/(?:%20)+/).join('+').replace(/%22\b/g, '"') }`, '_blank'),
                })
            }
        }

        // Anchors
        if(defined(anchor)) {
            const { href, scheme, host } = parseURL(anchor.href)
                , text = anchor.textContent;

            switch(scheme.toLowerCase()) {
                case 'mailto': {
                    extras.push({
                        text: `E-mail <strong>${ text }</strong>`,
                        icon: 'chat',
                        action: event => top.open(href, '_blank'),
                    }, {
                        text: `Copy e-mail address`,
                        icon: 'bolt',
                        action: event => navigator.clipboard.writeText(host),
                    });
                } break;

                case 'tel': {
                    extras.push({
                        text: `Dial <strong>${ text }</strong>`,
                        icon: 'chat',
                        action: event => top.open(href, '_blank'),
                    }, {
                        text: `Copy telephone number`,
                        icon: 'bolt',
                        action: event => navigator.clipboard.writeText(host),
                    });
                } break;

                default: {
                    extras.push({
                        text: `Open link in new tab`,
                        icon: 'ne_arrow',
                        favicon: parseURL(href).origin.replace(/^(https?):\/\/.+$/i, ($0, $1, $$, $_) => furnish.span().text($1.toUpperCase()).css(`background:${ ($1.equals('https') ? '#22FA7C' : '#FCC21B') } !important!innate;`).html()),
                        action: event => top.open(href, '_blank'),
                    }, {
                        text: `Copy link address`,
                        icon: 'bolt',
                        action: event => navigator.clipboard.writeText(href),
                    });
                } break;
            }

            extras.push({});
        }

        // Image
        else if(defined(image)) {
            const { src } = image;
            let [tail = 'png', ...name] = parseURL(src).filename?.split('.')?.reverse() ?? [];

            name = (name ?? [image.alt]).join('.');
            tail = /^(bmp|[gt]if+|ico|p?j(fif|p(e?g)?)|a?png|svg|webp)$/i.test(tail) ? tail : 'jpeg';

            let type = `image/${ tail }`
                , real = MIME_Types.find(type);

            if(type == real)
                [,real] = type.split('/');

            extras.push({
                text: `Open image in new tab`,
                icon: 'popout',
                action: event => top.open(src, '_blank'),
            }, {
                text: `Save image as...`,
                icon: 'download',
                action: event => showSaveFilePicker({
                    suggestedName: image.alt || tail,
                    types: [{
                        description: `${ tail.toUpperCase() } Image`,
                        accept: { [type]: [`.${ real }`] },
                    }],
                }),
            }, {
                text: `Copy image`,
                icon: 'loot',
                action: event => image.copy(),
            }, {
                text: `Copy image address`,
                icon: 'bolt',
                action: event => navigator.clipboard.writeText(src),
            });
        }

        // Video
        else if(defined(video)) {
            const VideoClips = {
                dvr: parseBool(Settings.video_clips__dvr),
                filetype: (Settings.video_clips__file_type ?? 'webm'),
                quality: (Settings.video_clips__quality ?? 'auto'),
                length: parseInt(Settings.video_clips__length ?? 60) * 1000,
            };

            extras.push({
                text: `Open video in new tab`,
                icon: 'popout',
                action: event => top.open(`//player.twitch.tv/?channel=${ STREAMER.name }&parent=twitch.tv`, '_blank'),
            }, {
                text: GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X.toTitle(),
                icon: 'loot',
                shortcut: (defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X) ? 'alt+shift+x' : ''),
                action: event => $.all('video').pop().copyFrame(),
            }, {
                text: `Record the next ${ toTimeString(VideoClips.length) }`,
                icon: 'video',
                shortcut: (defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z) ? 'alt+z' : ''),
                action: event => {
                    SetQuality().then(() => {
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', altKey: true }));

                        wait(VideoClips.length).then(() => phantomClick($(`.tt-prompt-footer button.okay`, $(`input[controller][anchor="${ $('video[uuid]').uuid }"i]`)?.closest('.tt-prompt-container'))));
                    });
                },
            });
        }

        // Iframe
        else if(defined(iframe)) {
            extras.push({
                text: `Open video in new tab`,
                icon: 'popout',
                action: event => top.open(`//player.twitch.tv/?channel=${ STREAMER.name }&parent=twitch.tv`, '_blank'),
            })
        }

        // ---- ---- STOP ---- ---- //

        if(extras.length)
            extras.splice(0, 0, {});

        let MAX = 10;

        while(nullish(extras.at(-1)?.text) && --MAX > 0)
            extras.splice(-1, 1);

        new ContextMenu({
            inherit: event,

            options: [{
                text: `Reload page`,
                icon: 'rerun',
                shortcut: 'ctrl+r',
                action: event => top.ReloadPage(),
            }, {
                // break
            }, {
                text: `Save page (HTML)`,
                icon: 'download',
                shortcut: 'ctrl+s',
                action: async event => {
                    alert.timed(`Gathering resources. Saving page in the background...<p tt-x>${ (new UUID).value }</p>`, 7000);

                    const DOM = document.cloneNode(true);
                    const type = DOM.contentType
                        , name = DOM.title;

                    // Remove all TTV Tools helpers
                    for(const element of $.all('[id*="tt-"i], [class*="tt-"i], [data-a-target*="tt-"i]', DOM))
                        element.remove();

                    // Download all scripts
                    let scripts = $.all('script[src]', DOM).filter(script => /^(https?|\/\/)/i.test(parseURL(script.src).scheme))
                        , JS_index = 0, JS_length = scripts.length;

                    // Remove non-HTTP(s) sources
                    $.all('script[src]', DOM)
                        .filter(script => !/^(https?|\/)/i.test(parseURL(script.src).scheme))
                        .map(script => script.remove());

                    for(const script of scripts) {
                        fetchURL(script.src, { timeout: 10_000, native: true })
                            .then(response => response.text())
                            .then(js => {
                                $log("Saving scripts...", script.src, (100 * (JS_index / JS_length)).suffix('%', 2), (js.length).suffix('B', 2, 'data'));

                                script.removeAttribute('src');
                                script.textContent = js;
                            })
                            .catch(error => {
                                if(error.name == 'AbortError')
                                    throw `The request to [ ${ script.src } ] timed out.`;
                                else
                                    script.setAttribute('src', `https://api.allorigins.win/raw?url=${ encodeURIComponent(script.src) }`);
                            })
                            .finally(() => ++JS_index);
                    }

                    // Download all styles
                    let styles = $.all('style[href], link[rel="stylesheet"i]', DOM).filter(style => /^(https?|\/\/)/i.test(parseURL(style.href).scheme))
                        , CSS_index = 0, CSS_length = styles.length;

                    // Remove non-HTTP(s) sources
                    $.all('style[href], link[rel="stylesheet"i]', DOM)
                        .filter(style => !/^(https?|\/)/i.test(parseURL(style.href).scheme))
                        .map(style => style.remove());

                    for(const style of styles) {
                        fetchURL(style.href, { timeout: 10_000, native: true })
                            .then(response => response.text())
                            .then(css => {
                                $log("Saving styles...", style.href, (100 * (CSS_index / CSS_length)).suffix('%', 2), (css.length).suffix('B', 2, 'data'));

                                style.removeAttribute('href');
                                style.textContent = css;
                            })
                            .catch(error => {
                                if(error.name == 'AbortError')
                                    throw `The request to [ ${ style.href } ] timed out.`;
                                else
                                    style.setAttribute('href', `https://api.allorigins.win/raw?url=${ encodeURIComponent(style.href) }`);
                            })
                            .finally(() => ++CSS_index);
                    }

                    // Wait for completion
                    when(() => ((JS_index >= JS_length) && (CSS_index >= CSS_length))).then(() => {
                        const blob = new Blob([
                            `<!DOCTYPE ${ DOM.doctype.name }${ DOM.doctype.publicId.replace(/^([^$]+)$/, ' PUBLIC "$1"') }${ DOM.doctype.systemId.replace(/^([^$]+)$/, ' "$1"') }>\n${ DOM.documentElement.outerHTML }`
                        ], { type });

                        const link = furnish('a', { href: URL.createObjectURL(blob), download: `${ name }.html`, hidden: true }, [name, (new Date).toJSON()].join('/'));

                        document.head.append(link);
                        link.click();

                        alert.silent(`HTML content <a href="${ link.href }">ready to save</a>!`);
                    });
                },
            }, {
                text: `Print...`,
                icon: 'export',
                shortcut: 'ctrl+p',
                action: event => top.print(),
            }, ...extras],

            fineTuning: { top: (y > innerHeight * (0.85 - extras.length * 0.05) ? innerHeight * 0.7 : y), left: (x > innerWidth * (0.85 - extras.length * 0.00) ? innerWidth * 0.7 : x) },
        });
    }, {
        capture: false,
        once: false,
        passive: false,
    });
} catch(error) {
    // Most likely in a child frame...
    // $remark("Moving to chat child frame...");
    if(!parseBool(parseURL(location).searchParameters?.hidden))
        $warn(error);
}

/**
 * Updates the current page pathname and refreshes the lists of searchable and visible channels.
 * @returns {Promise<void>}
 */
async function update() {
    // The location
    window.PATHNAME = PATHNAME = window.location.pathname;

    NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1');

    // All Channels under Search
    window.SEARCH = SEARCH = [
        ...SEARCH,
        // Current (followed) streamers
        ...$.all(`.search-tray a[href^="/"]:not([href*="/search?"i]):not([href$="${ PATHNAME }"i])`)
            .map(element => {
                const icon = $('img', element)?.src;
                const channel = {
                    element,

                    from: 'SEARCH',
                    href: element.href,
                    icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                    get live() {
                        let { href } = element
                            , url = parseURL(href)
                            , { pathname } = url;

                        const parent = $(`.search-tray [href$="${ pathname }"i]:not([href*="/search?"])`);

                        if(nullish(parent))
                            return true;

                        const live = $.defined(`[data-test-selector="live-badge"i]`, parent);

                        return live;
                    },
                    name: ($('img', element)?.alt || parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
                };

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                SEARCH_CACHE.set(channel.name?.toLowerCase?.(), { ...channel });

                return channel;
            }),
    ].filter(uniqueChannels);

    // All visible Channels
    window.CHANNELS = CHANNELS = [
        ...CHANNELS,
        // Current (followed) streamers
        ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section a:not([href$="${ PATHNAME }"i])`)
            .map(element => {
                const icon = $('img', element)?.src;
                const streamer = {
                    from: 'CHANNELS',
                    href: element.href,
                    icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                    get live() {
                        let { href } = element
                            , url = parseURL(href)
                            , { pathname } = url;

                        const parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                        if(nullish(parent))
                            return UnlistedLive(pathname);

                        const live = defined(parent)
                            && $.nullish(`[class*="--offline"i]`, parent);

                        return live;
                    },
                    name: ($('img', element)?.alt || parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
                };

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All followed Channels
    window.STREAMERS = STREAMERS = [
        ...STREAMERS,
        // Current (followed) streamers
        ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a:not([href$="${ PATHNAME }"i])`)
            .map(element => {
                const icon = $('img', element)?.src;
                const streamer = {
                    from: 'STREAMERS',
                    href: element.href,
                    icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                    get live() {
                        let { href } = element
                            , url = parseURL(href)
                            , { pathname } = url;

                        const parent = $(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href$="${ pathname }"i]`);

                        if(nullish(parent))
                            return UnlistedLive(pathname);

                        const live = defined(parent)
                            && $.nullish(`[class*="--offline"i]`, parent);

                        return live;
                    },
                    name: ($('img', element)?.alt || parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
                };

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // All Notifications
    window.NOTIFICATIONS = NOTIFICATIONS = [
        ...NOTIFICATIONS,
        // Notification elements
        ...$.all('[data-test-selector^="onsite-notifications"i] [data-test-selector^="onsite-notification"i]').map(
            element => {
                const icon = $('img', element)?.src;
                const streamer = {
                    live: true,
                    href: $('a', element)?.href,
                    icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                    name: $('[class$="text"i]', element)?.textContent?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $2, $3, $$, $_) => $1),
                };

                if(nullish(streamer.name))
                    return;

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                return streamer;
            }),
    ].filter(uniqueChannels);

    // Every channel
        // Putting the channels in this order guarantees channels already defined aren't overridden
    window.ALL_CHANNELS = ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);
}

let // Features that require the experimental flag
    EXPERIMENTAL_FEATURES = ['auto_focus', 'convert_emotes', 'greedy_raiding', 'soft_unban'].map(AsteriskFn)

    // Features that need the page reloaded when changed
    , SENSITIVE_FEATURES = ['away_mode*~schedule', 'auto_accept_mature', 'fine_details', 'first_in_line*', 'prevent_#', 'soft_unban*', '!up_next+', 'view_mode'].map(AsteriskFn)

    // Features that need to be run on a "normal" page
    , NORMALIZED_FEATURES = ['away_mode*~schedule', 'auto_follow+', 'first_in_line*', 'prevent_#', 'kill+'].map(AsteriskFn)

    // Features that need to be refreshed when changed
    , REFRESHABLE_FEATURES = ['auto_focus*', 'bttv_emotes*', 'filter_messages', 'highlight_phrases', 'native_twitch_reply', '*placement'].map(AsteriskFn);

/*** Initialization #MARK:initializer
*      _____       _ _   _       _ _          _   _
*     |_   _|     (_) | (_)     | (_)        | | (_)
*       | |  _ __  _| |_ _  __ _| |_ ______ _| |_ _  ___  _ __
*       | | | '_ \| | __| |/ _` | | |_  / _` | __| |/ _ \| '_ \
*      _| |_| | | | | |_| | (_| | | |/ / (_| | |_| | (_) | | | |
*     |_____|_| |_|_|\__|_|\__,_|_|_/___\__,_|\__|_|\___/|_| |_|
*
*
*/;

// A non-repeating token representing the current window
const PRIVATE_SYMBOL = Symbol(new UUID);

/** Streamer Array (Backup) - the current streamer/channel
 * @prop {string} call       - The streamer's login ID
 * @prop {string} date       - A date string representing the current stream's start time
 * @prop {number} game       - The current game/category
 * @prop {string} head       - The title of the stream
 * @prop {string} icon       - Link to the channel's icon/image
 * @prop {string} lang       - The language of the broadcast
 * @prop {boolean} live      - Is the channel currently live
 * @prop {string} name       - The channel's username
 * @prop {number} sole       - The channel's ID
 * @prop {array} tags        - Tags of the current stream
 */
const LIVE_CACHE = new Map();

const TWITCH_PATHNAMES = [
        '$', '[up]/',

        'activate',
        'bits(-checkout/?)?',
        'clips',
        'checkout/', 'collections/?', 'communities/?',
        'dashboard/?', 'directory/?', 'downloads?', 'drops/?',
        'event/?',
        'following', 'friends?',
        'inventory',
        'jobs?',
        'luna',
        'moderator',
        'popout', 'prime/?', 'products/?',
        'search', 'settings/?', 'store/?', 'subs/?', 'subscriptions?',
        'team', 'turbo',
        'user',
        'videos?',
        'wallet', 'watchparty',
    ]
    , RESERVED_TWITCH_PATHNAMES = RegExp(`/(${ TWITCH_PATHNAMES.join('|') })(?:[/#?$])`, 'i');

const UNSAFE_PATHNAMES = window.UNSAFE_PATHNAMES = [
        '[up]/',

        'activate',
        'bits(-checkout/?)?',
        'checkout/', 'collections/?', 'communities/?',
        'dashboard/?', 'downloads?',
        'event/?',
        'following', 'friends?',
        'jobs?',
        'luna',
        'prime/?', 'products/?',
        'schedule',
        'settings/?', 'store/?', 'subs/?', 'subscriptions?',
        'team', 'turbo',
        'user',
        'videos?',
        'wallet',
    ]
    , UNSAFE_TWITCH_PATHNAMES = window.UNSAFE_TWITCH_PATHNAMES = RegExp(`/(${ UNSAFE_PATHNAMES.join('|') })(?:[/#?$])`, 'i');

/*** First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon
 *      ______ _          _     _         _      _              _    _      _
 *     |  ____(_)        | |   (_)       | |    (_)            | |  | |    | |
 *     | |__   _ _ __ ___| |_   _ _ __   | |     _ _ __   ___  | |__| | ___| |_ __   ___ _ __ ___
 *     |  __| | | '__/ __| __| | | '_ \  | |    | | '_ \ / _ \ |  __  |/ _ \ | '_ \ / _ \ '__/ __|
 *     | |    | | |  \__ \ |_  | | | | | | |____| | | | |  __/ | |  | |  __/ | |_) |  __/ |  \__ \
 *     |_|    |_|_|  |___/\__| |_|_| |_| |______|_|_| |_|\___| |_|  |_|\___|_| .__/ \___|_|  |___/
 *                                                                           | |
 *                                                                           |_|
 */;

let FIRST_IN_LINE_JOB = null           // The current job (interval)
    , FIRST_IN_LINE_HREF = '#'           // The upcoming HREF
    , FIRST_IN_LINE_BOOST                // The "Up Next Boost" toggle
    , FIRST_IN_LINE_TIMER                // The current time left before the job is accomplished
    , FIRST_IN_LINE_PAUSED = false       // The pause-state
    , FIRST_IN_LINE_PAUSED_AT            // The pause-state's start time
    , FIRST_IN_LINE_BALLOON              // The balloon controller
    , FIRST_IN_LINE_DUE_DATE             // The due date of the next job
    , ALL_FIRST_IN_LINE_JOBS = []        // All First in Line jobs
    , FIRST_IN_LINE_WAIT_TIME            // The wait time (from settings)
    , FIRST_IN_LINE_LISTING_JOB          // The job (interval) for listing all jobs (under the ballon)
    , FIRST_IN_LINE_WARNING_JOB          // The job for warning the user (via timed confirmation dialog)
    , FIRST_IN_LINE_SAFETY_CATCH         // Keeps the alert from not showing properly
    , FIRST_IN_LINE_SORTING_HANDLER      // The Sortable object to handle the balloon
    , FIRST_IN_LINE_WARNING_TEXT_UPDATE;  // Sub-job for the warning text

let DO_NOT_AUTO_ADD = []; // List of names to ignore for auto-adding; the user already canceled the job

let ALREADY_EXPANDED = false;

/**
 * Restarts a one-shot placement job once the stream's live timer (`.live-time`) appears, if the feature is still on.
 * One wait per job; an offline channel otherwise restarted these every second.
 * @param {string} job - The job to restart
 * @returns {Promise<void>}
 */
function WaitForLiveTime(job) {
    WaitForLiveTime.waiting ??= new Set;

    if(WaitForLiveTime.waiting.has(job))
        return;

    WaitForLiveTime.waiting.add(job);

    return when.defined(() => $('.live-time'), 2_500).then(() => {
        WaitForLiveTime.waiting.delete(job);

        if(defined(Settings[job]) && `${ Settings[job] }`.unlike('null'))
            RestartJob(job, 'live_time');
    });
}

/**
 * The left-hand navigation. Twitch re-renders it, so its state is read fresh and every change is checked.
 */
const SideNav = {
    /** Whether the navigation is expanded. */
    get open() {
        return $.defined('[data-a-target="side-nav-header-expanded"i], [data-a-target="side-nav-search-input"i]')
            && $.nullish('[data-a-target="side-nav-header-collapsed"i]');
    },

    /**
     * Expands or collapses the navigation, clicking its (freshly found) toggle until it reports the wanted state.
     * @param {boolean} open - Whether it should be expanded
     * @returns {Promise<boolean>} Whether it ended up that way
     */
    async set(open) {
        for(let tries = 0; tries < 3 && this.open != open; ++tries) {
            $('[data-a-target="side-nav-arrow"i]')?.click();
            await wait(250);
        }

        return this.open == open;
    },
};

/**
 * The live status of a channel that isn't listed right now (side nav collapsed, trimmed or scrolled). Unlisted isn't offline:
 * use its Search result (which refreshes itself every 5 minutes), asked for once; `false` only until that answers.
 * @param {string} pathname - The channel's path (`/name`)
 * @returns {boolean} Whether the channel is live
 */
function UnlistedLive(pathname) {
    const name = String(pathname).slice(1).toLowerCase();

    if(!SEARCH_CACHE.has(name) && !(UnlistedLive.asked ??= new Set).has(name))
        UnlistedLive.asked.add(name), new Search(name).catch($ignore);

    return SEARCH_CACHE.get(name)?.live ?? false;
}

// Intializes the extension
    // Initialize(START_OVER:boolean) → undefined
// Shared between features and their plugins (src/plugins/); Initialize() assigns them
let GLOBAL_EVENT_LISTENERS, EXACT_POINTS_SPENT, LIVE_REMINDERS__LISTING_INTERVAL, STARTED_TIMERS, NOTIFICATION_EVENTS, NOTIFICATION_SOUND, NOTIFIED, AwayModeStatus, InitialVolume, MAINTAIN_VOLUME_CONTROL, STARTED_WATCHING, CURRENT_WATCHTIME_NAME, GET_WATCH_TIME, VideoClips, MASTER_VIDEO;

/**
 * Initializes extension settings, logging configurations, and global API and event listener objects.
 * @param {boolean} [START_OVER=false] - Whether to restart the initialization process
 * @returns {Promise<void>}
 */
let Initialize = async(START_OVER = false) => {
    // Modify the logging feature via the settings
    if(!parseBool(Settings.display_in_console))
        $log =
            $warn =
                $error =
                    $remark =
                        $notice =
                            $ignore = ($=>$);

    if(!parseBool(Settings.display_in_console__log))
        $log = ($=>$);

    if(!parseBool(Settings.display_in_console__warn))
        $warn = ($=>$);

    if(!parseBool(Settings.display_in_console__error))
        $error = ($=>$);

    if(!parseBool(Settings.display_in_console__remark))
        $remark = ($=>$);

    if(!parseBool(Settings.display_in_console__notice))
        $notice = ($=>$);

    if(!parseBool(Settings.display_in_console__ignore))
        $ignore = ($=>$);

    // Time how long jobs take to complete properly
    class StopWatch {
        static #WATCHES = new Map;

        constructor(name, interval) {
            interval ??= Timers[name];

            StopWatch.#WATCHES.set(name, this);

            return Object.assign(this, {
                name, interval,

                start: new Date,
                stop: null,
                span: null,
                max: Math.abs(interval) * 1.1,
            });
        }

        static stop(name) {
            StopWatch.#WATCHES.get(name)?.time();
        }

        time() {
            const stop = this.stop = new Date;
            const span = this.span = Math.abs(this.start - stop);
            const { max, name } = this;

            if(span > max)
                $warn(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['', ' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    .toNativeStack();
        }
    }

    // What plugins (src/plugins/) get from this scope; see docs/PLUGINS.md
    const PLUGIN_CONTEXT = { StopWatch };

    // Initialize all settings/features //


    const GLOBAL_TWITCH_API = (window.GLOBAL_TWITCH_API ??= {});

    GLOBAL_EVENT_LISTENERS = (window.GLOBAL_EVENT_LISTENERS ??= {
        KEYDOWN_ALT_X: function Clip() {/* Managed by Twitch */},
        KEYDOWN_ALT_T: function Toggle_Theatre_Mode() {/* Managed by Twitch */},
    });

    if(SPECIAL_MODE) {
        let { $1, $2 } = RegExp
            , normalized = [];

        for(const key in Settings)
            if(~NORMALIZED_FEATURES.findIndex(regexp => regexp.test(key)))
                normalized.push(key);

        $warn(`Currently viewing ${ $1 } in "${ $2 }" mode. Several features will be disabled:`, normalized);
    }

    let ERRORS = Initialize.errors |= 0;

    if(START_OVER) {
        for(const job in Jobs)
            UnregisterJob(job, 'reinit');
        ERRORS = Initialize.errors++;
    }

    // Disable experimental features
    if(!Settings.experimental_mode) {
        for(const setting in Settings)
            if(~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(setting)))
                Settings[setting] = null;
    }

    // Disable normalized features
    if(SPECIAL_MODE) {
        for(const setting in Settings)
            if(~NORMALIZED_FEATURES.findIndex(feature => feature.test(setting)))
                Settings[setting] = null;
    }

    const GLOBAL_ANCHORS = new Map;

    setInterval(() => {
        $.all('a[href]')
            .filter(a => !GLOBAL_ANCHORS.has(a))
            .filter(a => /^(((https?:)?\/\/)?www\.)twitch\.tv\//i.test(a.href))
            .filter(a => !RESERVED_TWITCH_PATHNAMES.test(a.href))
            .map(a => {
                GLOBAL_ANCHORS.set(a, (function(event) {
                    GetNextStreamer.href = this.href;
                }).bind(a));

                a.addEventListener('mousedown', GLOBAL_ANCHORS.get(a));
            });
    }, 250);

    top.GetNextStreamer =
    // Gets the next available channel (streamer)
        // GetNextStreamer(except:string?) → Object<Channel>
    function GetNextStreamer(except = '') {
        if(defined(GetNextStreamer.href))
            return {
                from: 'GET_NEXT_STREAMER',
                href: GetNextStreamer.href,
                name: parseURL(GetNextStreamer.href).pathname.slice(1).split('/').shift(),
            };

        if(defined(GetNextStreamer.pinnedStreamer) && ((ALL_FIRST_IN_LINE_JOBS?.length | 0) < 1) && !STREAMER?.live) {
            Cache.remove(['PinnedStreamer']);

            return ({
                from: 'GET_NEXT_STREAMER__PINNED',
                href: `/${ GetNextStreamer.pinnedStreamer }`,
                name: GetNextStreamer.pinnedStreamer,
            });
        }

        // Next channel in "Up Next"
        if(ALL_FIRST_IN_LINE_JOBS?.length && !parseBool(Settings.first_in_line_none))
            return GetNextStreamer.cachedStreamer = (null
                ?? ALL_CHANNELS.find(channel => channel?.name?.unlike(except) && parseURL(channel?.href)?.pathname?.equals(parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname))
                ?? {
                    from: 'GET_NEXT_STREAMER',
                    href: parseURL(ALL_FIRST_IN_LINE_JOBS[0]).href,
                    name: parseURL(ALL_FIRST_IN_LINE_JOBS[0]).pathname.slice(1).split('/').shift(),
                }
            );

        if(parseBool(Settings.stay_live) && defined(GetNextStreamer.cachedStreamer))
            return GetNextStreamer.cachedStreamer;

        Cache.load('ChannelPoints', ({ ChannelPoints = {} }) => {
            const { random, round } = Math;
            let online = [...STREAMERS, ...(GetNextStreamer.cachedReminders ??= [])].filter(isLive)
                , mostWatched = null
                , mostPoints = 0
                , mostLeft = 0
                , mostProgressNeeded = 0
                , furthestFromCompletion = null
                , leastWatched = null
                , leastPoints = +Infinity
                , leastLeft = +Infinity
                , leastProgressNeeded = +Infinity
                , closestToCompletion = null;

            const [randomChannel] = online.shuffle();

            filtering:
            for(const channel in ChannelPoints) {
                const [streamer] = online.filter(({ name }) => name.equals(channel));

                if(nullish(streamer))
                    continue filtering;

                let [amount, fiat, face, notEarned, pointsToEarnNext] = ChannelPoints[channel].split('|');

                amount = parseCoin(amount);
                notEarned = parseInt(notEarned);
                pointsToEarnNext = parseFloat(pointsToEarnNext);

                wealth:
                // this channel has the most points
                if(amount > mostPoints) {
                    mostWatched = channel;
                    mostPoints = amount;
                }
                // this channel has the least points
                else if(amount < leastPoints) {
                    leastWatched = channel;
                    leastPoints = amount;
                }

                progress:
                // this channel is the furthest from having all rewards & challenges
                if(notEarned >= mostLeft) {
                    // Pick the channel that needs the most points to reach the closest goal
                    if(notEarned == mostLeft && pointsToEarnNext > mostProgressNeeded) {
                        furthestFromCompletion = channel;
                        mostProgressNeeded = pointsToEarnNext;

                        continue filtering;
                    }

                    furthestFromCompletion = channel;
                    mostLeft = notEarned;
                }
                // this channel is the closest to having all rewards & challenges; but not completed
                else if(notEarned <= leastLeft && notEarned > 0) {
                    // Pick the channel that needs the least points to reach the closest goal
                    if(notEarned == leastLeft && pointsToEarnNext < leastProgressNeeded) {
                        closestToCompletion = channel;
                        leastProgressNeeded = pointsToEarnNext;

                        continue filtering;
                    }

                    closestToCompletion = channel;
                    leastLeft = notEarned;
                }
            }

            next_channel:
            switch(Settings.next_channel_preference) {
                // The most popular channel (most amount of current viewers)
                case 'popular': {
                    GetNextStreamer.cachedStreamer = online[0];
                } break;

                // The least popular channel (least amount of current viewers)
                case 'unpopular': {
                    GetNextStreamer.cachedStreamer = online[online.length - 1];
                } break;

                // Most watched channel (most channel points)
                case 'rich': {
                    GetNextStreamer.cachedStreamer = online.find(channel => channel.name.equals(mostWatched));
                } break;

                // Least watched channel (least channel points)
                case 'poor': {
                    GetNextStreamer.cachedStreamer = online.find(channel => channel.name.equals(leastWatched));
                } break;

                // Most un-earned Rewards & Challenges
                case 'furthest': {
                    GetNextStreamer.cachedStreamer = online.find(channel => channel.name.equals(furthestFromCompletion));
                } break;

                // Least un-earned Rewards & Challenges
                case 'closest': {
                    GetNextStreamer.cachedStreamer = online.find(channel => channel.name.equals(closestToCompletion));
                } break;

                // Do not use this feature
                case 'none': {
                    return null;
                } break;

                // A random channel
                case 'random':
                default: {
                    GetNextStreamer.cachedStreamer = randomChannel;
                } break;
            } // :next_channel | switch Settings.next_channel_preference

            // There isn't a channel that fits the criteria
            if(parseBool(Settings.stay_live) && nullish(GetNextStreamer?.cachedStreamer) && online?.length) {
                const preference = Settings.next_channel_preference
                    , channel = (GetNextStreamer.cachedStreamer ??= randomChannel);

                // `randomChannel` is one channel (not a list), so this warning never used to show
                if(defined(channel))
                    $warn(`No channel fits the "${ preference }" criteria. Assuming a random channel ("${ channel.name }") is desired:`, channel);
            }

            // @performance
            PrepareForGarbageCollection(ChannelPoints);
        });

        return when.defined(() => GetNextStreamer.cachedStreamer);
    };

    Cache.load('PinnedStreamer', ({ PinnedStreamer }) => {
        GetNextStreamer.pinnedStreamer = PinnedStreamer;
    });

    if(true
        // && UP_NEXT_ALLOW_THIS_TAB
        && (top === window)
    )
        try {
            Cache.load('LiveReminders', async({ LiveReminders }) => {
                try {
                    LiveReminders = JSON.parse(LiveReminders || '{}');
                } catch(error) {
                    // Probably an object already...
                    LiveReminders ??= {};
                }

                const cachedReminders = [...(GetNextStreamer.cachedReminders ??= [])];

                for(const name in LiveReminders) {
                    const now = new Date
                        , time = new Date(LiveReminders[name]);

                    cachedReminders.push({
                        name,

                        from: 'LIVE_REMINDERS',
                        href: `https://www.twitch.tv/${ name }`,
                        live: await Search.getUserStatus(name),
                    });
                }

                // @performance
                PrepareForGarbageCollection(LiveReminders);

                GetNextStreamer.cachedReminders = cachedReminders.isolate();
            });
        } catch(error) {
            // Do nothing...
        }

    /** Search Array - all channels/friends that appear in the search panel (except the currently viewed one)
     * @prop {string} href   - Link to the channel
     * @prop {string} icon   - Link to the channel's image
     * @prop {boolean} live  - Is the channel live (<b>getter</b>)
     * @prop {string} name   - The channel's name
     */
    SEARCH = [
        // Current (followed) streamers
        ...$.all(`.search-tray a[href^="/"]:not([href*="/search?"i]):not([href$="${ NORMALIZED_PATHNAME }"i]), [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"i])`)
            .map(element => {
                const icon = $('img', element)?.src;
                const channel = {
                    element,

                    from: 'SEARCH',
                    href: element.href,
                    icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                    get live() {
                        let { href } = element
                            , url = parseURL(href)
                            , { pathname } = url;

                        const parent = $(`.search-tray [href$="${ pathname }"i]:not([href*="/search?"])`);

                        if(nullish(parent))
                            return UnlistedLive(pathname);

                        const live = $.defined(`[data-test-selector="live-badge"i]`, parent);

                        return live;
                    },
                    name: ($('img', element)?.alt || parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
                };

                element.setAttribute('draggable', true);
                element.ondragstart ??= event => {
                    event.dataTransfer.dropEffect = 'move';
                };

                SEARCH_CACHE.set(channel.name?.toLowerCase?.(), { ...channel });

                return channel;
            }),
    ].filter(uniqueChannels);

    /** Streamer Array - the current streamer/channel
     * @prop {string} aego       - The channel's complementary accent color (if applicable)
     * @prop {array} chat        - An array of the current chat, sorted the same way messages appear. The last message is the last array entry
     * @prop {number} coin       - How many channel points (floored to the nearest 100) does the user have
     * @prop {array} coms        - Returns the channel commands (if available)
     * @prop {number} cult       - The estimated number of followers
     * @prop {object} data       - extra data about the channel
     * @prop {string} desc       - The status (description/title) of the stream
     * @prop {boolean} done      - Are all of the channel point rewards purchasable
     * @prop {string} face       - A URL to the channel points image (if applicable)
     * @prop {string} fiat       - Returns the name of the channel points (if applicable)
     * @prop {function} follow   - follows the current channel
     * @prop {string} from       - Returns where the data was collected for the object
     * @prop {string} game       - The name of the current game/category
     * @prop {string} href       - link to the channel (usually the current href)
     * @prop {string} icon       - link to the channel's icon/image
     * @prop {array} jump        - Extra data from the Apollo data-stream
     * @prop {boolean} like      - Is the user following the current channel
     * @prop {boolean} live      - Is the channel currently live
     * @prop {boolean} main      - Returns whether the stream is the user's Prime Subscription
     * @prop {number} mark       - Returns an activity score based on the channel's tags
     * @prop {string} name       - the channel's username
     * @prop {boolean} paid      - Is the user  subscribed
     * @prop {boolean} ping      - Does the user have notifications on
     * @prop {boolean} plug      - Is there an advertisement running
     * @prop {number} poll       - How many viewers are watching the channel
     * @prop {number} rank       - What is the user's assumed rank--based on the amount of channel points they possess
     * @prop {boolean} redo      - Is the channel streaming a rerun (VOD)
     * @prop {array} shop        - Returns a list (sorted, ascending price) of the channel's rewards
     * @prop {number} sole       - The channel's ID
     * @prop {array} tags        - Tags of the current stream
     * @prop {string} team       - The team the channel is affiliated with (if applicable)
     * @prop {number} time       - How long has the channel been live
     * @prop {string} tint       - The channel's accent color (if applicable)
     * @prop {string} tone       - The channel's opposing lightness color (if applicable)
     * @prop {function} unfollow - unfollows the current channel
     * @prop {boolean} veto      - Determines if the user is banned from the chat or not
     * @prop {array} vods        - Returns a list (up to 25) of the channel's VODs

     * Only available with Fine Details enabled
     * @prop {boolean} ally      - is the channel partnered?
     * @prop {boolean} fast      - is the channel using turbo?
     * @prop {boolean} nsfw      - is the channel deemed NSFW (mature)?
     */
    STREAMER = window.STREAMER = {
        get chat() {
            return Chat.get();
        },

        get coin() {
            const exact = STREAMER.jump?.[STREAMER?.name?.toLowerCase()]?.stream?.points?.balance
                , current = parseCoin($.last('[data-test-selector*="balance-string"i]')?.textContent)
                , _e = exact?.suffix('', 1, 'natural')?.replace('.0', '')
                , _c = current?.suffix('', 1, 'natural')?.replace('.0', '');

            if(nullish(exact))
                return current;
            return _e == _c ? exact : current;
        },

        get coms() {
            return (async channel => {
                if(COMMANDS?.length > 0)
                    return COMMANDS;
                COMMANDS = [{ aliases: [], command: STREAMER.name, reply: '$(channel.display_name) is streaming $(game) for $(channel.viewers) viewers', availability: 'owner', enabled: false, cost: 0 }];

                /** User Levels → StreamElements | NightBot
                 * Everyone         →   100 | everyone
                 * Subscriber       →   250 | subscriber
                 * Regular          →   300 | regular
                 * VIP              →   400 | twitch_vip
                 * Moderator        →   500 | moderator
                 * Super Moderator  →   1000 | admin
                 * Broadcaster      →   1500 | owner
                 */
                const USER_LEVELS = ({
                    everyone:           [100, 'everyone'],
                    subscriber:         [250, 'subscriber'],
                    regular:            [300, 'regular'],
                    vip:                [400, 'twitch_vip'],
                    moderator:          [500, 'moderator'],
                    admin:              [1000, 'admin'],
                    broadcaster:        [1500, 'owner'],
                });

                /**
                 * Finds the user level key that contains the specified level.
                 * @param {*} level - The level to match against USER_LEVELS
                 * @returns {*} The matching user level key, or undefined
                 */
                const match = level => Object.keys(USER_LEVELS).find(key => USER_LEVELS[key].contains(level));

                // StreamElements
                    // accessLevel: 100
                    // aliases: []
                    // channel: "5f5989e007c66e281ad711ac"
                    // command: "uptime"
                    // cooldown: { user: 30, global: 30 }
                    // cost: 0
                    // createdAt: "2020-09-10T02:07:05.487Z"
                    // enabled: true
                    // enabledOffline: true
                    // enabledOnline: true
                    // hidden: false
                    // keywords: []
                    // reply: "$(twitch $(channel) \"{{displayName}} has been live for {{uptimeLength}}\")"
                    // type: "say"
                    // updatedAt: "2020-09-10T02:07:05.487Z"
                    // _id: "5f598a4986ca683315a3f402"
                await fetchURL.fromDisk(`https://api.streamelements.com/kappa/v2/channels/${ channel.name }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                    .then(r => r?.json?.())
                    .then(json => json?._id)
                    .then(async id => {
                        const commands = {};

                        if(nullish(id))
                            return [];

                        for(const type of ['public', 'default'])
                            await fetchURL.fromDisk(`https://api.streamelements.com/kappa/v2/bot/commands/${ id }/${ type }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                                .then(r => r.json())
                                .then(json => commands[type] ??= json);

                        return [...commands.public, ...commands.default];
                    })
                    .then(commands => {
                        for(const metadata of commands) {
                            const { aliases, command, reply, accessLevel, enabled, count = 0, cooldown, cost } = metadata;

                            COMMANDS.push({ aliases: [...aliases, ...commands.filter(alias => alias.reply?.contains(command)).map(alias => alias.command)], command, reply, availability: match(accessLevel), enabled, origin: 'StreamElements', variables: { count, coolDown: cooldown.global, cost } });
                        }
                    })
                    .catch($warn);

                // NightBot
                    // coolDown: 30
                    // count: 0
                    // createdAt: "2021-07-31T05:33:56.000Z"
                    // message: "hello my cute little pogchamp kyootbHeart"
                    // name: "hi"
                    // updatedAt: "2021-07-31T05:33:56.305Z"
                    // userLevel: "everyone"
                    // _id: "6104e0c44038915692edaeed"
                await fetchURL.fromDisk(`https://api.nightbot.tv/1/channels/t/${ channel.name }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                    .then(r => r?.json?.())
                    .then(json => json?.channel?._id)
                    .then(async id => {
                        let commands = [];

                        if(nullish(id))
                            return commands;

                        await fetchURL.fromDisk(`https://api.nightbot.tv/1/commands?nid=${ id }`, { mode: 'cors', headers: { 'nightbot-channel': id }, hoursUntilEntryExpires: 168 })
                            .then(r => r.json())
                            .then(json => {
                                if(!json.status.toString().startsWith('2'))
                                    return [];

                                commands = [...commands, ...json.commands];
                            });

                        return commands;
                    })
                    .then(commands => {
                        for(const metadata of commands) {
                            let { name, message, userLevel, enabled = true, count, coolDown, cost = 0 } = metadata
                                , regexp = /^[!]/;

                            if(!regexp.test(name))
                                continue;

                            COMMANDS.push({ aliases: commands.filter(command => command.message.contains(name)).map(command => command.name.replace(regexp, '')), command: name.replace(regexp, ''), reply: message, availability: match(userLevel), enabled, origin: 'NightBot', variables: { count, coolDown, cost } });
                        }
                    })
                    .catch($warn);

                const commands = new Map;

                for(const command of await COMMANDS)
                    commands.set(command.command, command);

                return COMMANDS = [[...commands].map(([name, value]) => value)]
                    .flat()
                    .filter(c => defined(c.command))
                    .sort((a, b) => a.command.length > b.command.length ? -1 : +1);
            })(STREAMER);
        },

        get cult() {
            return (STREAMER.data?.followers) || parseCoin($('.about-section span')?.getElementByText(/\d/)?.textContent);
        },

        // Gets values later...
        data: {},

        get desc() {
            return $('[data-a-target="stream-title"i]')?.textContent;
        },

        get done() {
            return (async() => {
                const shop = (await STREAMER.shop)
                    .filter(({ enabled, hidden, premium }) => enabled && !(hidden || (premium && !STREAMER.paid)));

                if(shop.length < 1)
                    return false;

                for(const item of shop)
                    if(STREAMER.coin < item.cost)
                        return false;

                return true;
            })();
        },

        get face() {
            const balance = $.last('[data-test-selector*="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_face;

            const container = balance?.closest('button')
                , icon = $.last('img[alt]', container);

            return icon?.src;
        },

        get fiat() {
            const balance = $.last('[data-test-selector*="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_name;

            const container = balance?.closest('button')
                , icon = $.last('img[alt]', container);

            return icon?.alt ?? 'Channel Points';
        },

        get from() {
            return 'STREAMER';
        },

        get game() {
            const element = $.all('[data-a-target$="game-link"i], [data-a-target$="game-name"i]').pop()
                , name = element?.textContent
                , game = new String(name ?? '');

            Object.defineProperties(game, {
                href: {
                    value: Object.defineProperties(new String(element?.href ?? ''), {
                        steam: { get() { return $('#steam-link')?.href } },
                        playstation: { get() { return $('#playstation-link')?.href } },
                        xbox: { get() { return $('#xbox-link')?.href } },
                        nintendo: { get() { return $('#nintendo-link')?.href } },
                        epic: { get() { return $('#epic-link')?.href } },
                    }),
                },
            });

            return game ?? LIVE_CACHE.get('game');
        },

        get href() {
            return parseURL($(`a[href$="${ NORMALIZED_PATHNAME }"i]`)?.href).href;
        },

        get icon() {
            const url = $(`[class*="channel"i] *:is(a[href$="${ NORMALIZED_PATHNAME }"i], [data-a-channel]) img`)?.src;

            if(typeof url == 'string')
                return Object.assign(new String(url), parseURL(url));
        },

        get jump() {
            return JUMP_DATA;
        },

        get like() {
            return $.defined('[data-a-target="unfollow-button"i]');
        },

        get live() {
            const playerCard = $.queryBy(`[class*="video-player"i] [class*="media-card"i]`)?.first;
            const statusNode = $.queryBy(`[class*="channel"i][class*="status"i]`)?.first;

            const liveText =
                playerCard?.textContent
                ?? (
                    statusNode
                    && !statusNode.classList.contains('offline')
                    && !statusNode.classList.contains('autohost')
                        ? statusNode.textContent
                        : null
                );

            const statusClasses = statusNode?.classList?.value || '';

            const probe = (statusClasses || liveText || '').toLowerCase();
            const looksOffline = !probe || /\boffline\b/.test(probe) || /\bautohost\b/.test(probe);

            if(SPECIAL_MODE)
                return true;

            return (true
                && $.defined(`
                    [class*="channel"i][class*="info"i] [class*="home"i][class*="head"i] [status="live"i]
                    , [class*="channel"i][class*="info"i] [id*="live"i][id*="channel"i]
                    , [class*="channel"i][class*="info"i] [id*="live"i][id*="stream"i]
                    , [class*="channel-root--live"i] [class*="channel-status-info--live"i]
                `)
                && $.nullish(`[class*="offline-recommendations"i], [data-test-selector="follow-panel-overlay"i]`)
                && !looksOffline
            );
        },

        get main() {
            return STREAMER.paid && defined($('[tt-svg-label="prime-subscription"i]')?.closest('button[data-a-target^="subscribe"i]'));
        },

        get mark() {
            const tags = []
                , f = furnish;

            $.all('.tw-tag').map(element => {
                const { href } = element.closest('a[href]');

                if(parseBool(Settings.show_stats)) {
                    const score = scoreTagActivity(href);

                    new Tooltip(element, `${ '+-'[+(score < 0)] }${ score }`, { from: 'top' });

                    element.modStyle(`border-color:#00c85a${ (255 * (score / 20)).clamp(0x40, 0xff).round().toString(16).padStart(2, '00') }`);
                }

                tags.push(href);
            });

            const score = scoreTagActivity(...tags);

            if(parseBool(Settings.show_stats) && $.nullish('#tt-mark-total'))
                when.defined(() => $('[id*="channel"i][id*="info"i] [class*="metadata"i][class*="support"i] + * div:not([class]) div[class] > *:last-child > div'))
                    .then(container => $.nullish('#tt-mark-total') && container.append(
                            f(`#tt-mark-total[style="font-size:var(--font-size-7)!important;display:inline-block!important;margin-bottom:0.5rem!important;margin-left:0.5rem!important;vertical-align:middle!important"]`).with(
                                f(`a[@score="${ score }" href="#!/score:${ score }" style="display:inline-block;border-radius:var(--border-radius-rounded);font-weight:var(--font-weight-semibold);background-color:var(--color-background-tooltip);border:var(--border-width-tag) solid #0000;color:var(--color-text-tooltip);height:2rem;max-width:100%;text-decoration:none;"]`).with(
                                    f(`[style="display:flex;-webkit-box-align:center;align-items:center;font-size:var(--font-size-7);padding:0 .8rem;"]`).with(
                                        f(`[style="white-space:nowrap;text-overflow:ellipsis;overflow:hidden"]`).with(
                                            f(`span`, {}, `Score: +${ score }`)
                                        )
                                    )
                                )
                            )
                    )
                    );

            return score;
        },

        get name() {
            return ($(`[class*="channel-info"i] a[href$="${ NORMALIZED_PATHNAME }"i]${ ['', ' h1'][+NORMAL_MODE] }`)?.textContent ?? LIVE_CACHE.get('name') ?? top.location.pathname.slice(1).split('/').shift()).split(/\s/).shift();
        },

        get paid() {
            return $.defined('[data-a-target="subscribed-button"i]');
        },

        mods: [],
        vips: [],

        /** User Levels → StreamElements | NightBot
         * Broadcaster      →   1500 | owner
         * Super Moderator  →   1000 | admin
         * Moderator        →   500  | moderator
         * VIP              →   400  | twitch_vip
         * Follower         →   300  | regular
         * Subscriber       →   250  | subscriber
         * Everyone         →   100  | everyone
         */
        get perm() {
            let level = 0;
            const levels = [
                (
                    STREAMER.name == USERNAME
                        ? (level ||= 1500, 'owner')
                        : ''
                ),
                (
                    parseBool(Search.cookies?.twilight_user?.roles?.isStaff)
                        ? (level ||= 1000, 'admin')
                        : ''
                ),
                (
                    (STREAMER.mods = Chat.mods).contains(mod => mod.equals(USERNAME))
                        ? (level ||= 500, 'moderator')
                        : ''
                ),
                (
                    (STREAMER.vips = Chat.vips).contains(vip => vip.equals(USERNAME))
                        ? (level ||= 400, 'vip')
                        : ''
                ),
                (
                    STREAMER.ping
                        ? (level ||= 300, 'regular')
                        : ''
                ),
                (
                    STREAMER.paid
                        ? (level ||= 250, 'subscriber')
                        : ''
                ),
                (level ||= 100, 'everyone')
            ].filter(level => level.length);

            const string = new String(levels[0]);

            Object.defineProperties(string, {
                find: {
                    value(permission) {
                        const levels = {
                            owner: 1500,
                            broadcaster: 1500,
                            administrator: 1000,
                            moderator: 500,
                            vip: 400,
                            subscriber: 300,
                            regular: 250,
                            follower: 250,
                            everyone: 100,
                            anyone: 100,
                        };

                        for(const level in levels)
                            if(level.startsWith(permission?.toLowerCase?.()))
                                return levels[level];

                        return permission;
                    }
                },
                level: { value: level },
                lacks: { value(permission) { return this.level < this.find(permission) } },
                not: { value(permission) { return this.level != this.find(permission) } },
                is: { value(permission) { return this.level == this.find(permission) } },
                has: { value(permission) { return this.level >= this.find(permission) } },
                all: { value: levels },
            });

            return string;
        },

        get ping() {
            return $.defined('[data-a-target^="live-notifications"i][data-a-target$="on"i]');
        },

        get plug() {
            return $.defined('[data-a-target*="ad-countdown"i]');
        },

        get poll() {
            return parseInt($('[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]')?.textContent?.replace(/\D+/g, '')) | 0;
        },

        get rank() {
            let epoch = +new Date('2019-12-16T00:00:00.000Z')
                // epoch → when channel points were first introduced
                    // https://blog.twitch.tv/en/2019/12/16/channel-points-an-easy-way-to-engage-with-your-audience/
                , start = +new Date(STREAMER.data.firstSeen)
                , now = +new Date;

            start = epoch.max(start || epoch);

            const intervals = (((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) / 900_000) * (((now - start) / 86_400_000) * ((STREAMER.data?.activeDaysPerWeek ?? 5) / 7))) // How long the channel has been streaming (15min segments)
                , followers = (STREAMER.data.followers ?? STREAMER.cult) // The number of followers the channel has
                , watchers = (STREAMER.poll || followers).ceilToNearest(1000) // The current number of people watching
                , pointsPerInterval = 80 // The user normally gets 80 points per 15mins
                , maximum = (intervals * pointsPerInterval).round(); // The absolute maximum nubmer of points anyone (except the streamer) on the channel can have

            return (followers - (followers * (STREAMER.coin / maximum))).clamp(0, followers).round();
        },

        get redo() {
            return /\brerun\b/i.test($(`[class*="video-player"i] [class*="media-card"i]`)?.textContent?.trim() ?? '');
        },

        __shop__: [],

        get shop() {
            const shop = STREAMER.jump?.[STREAMER.name?.toLowerCase?.()]?.stream?.points;

            if(nullish(shop))
                return STREAMER.__shop__;

            let { automatic = {}, custom = {} } = shop
                , inventory = [];

            const __ = { ...automatic, ...custom };

            for(let _ in __) {
                _ = __[_];

                inventory.push({
                    backgroundColor: (_.backgroundColor || _.defaultBackgroundColor || '#451093'),
                    cost: (_.cost || _.defaultCost || _.minimumCost),
                    id: _.id,
                    image: (_.image || _.defaultImage),
                    type: (_.type || 'CUSTOM').toUpperCase(),

                    enabled: _.isEnabled,
                    available: parseBool(_.isInStock),
                    count: parseInt(_.redemptionsRedeemedCurrentStream) | 0,
                    hidden: (STREAMER.paid && _.isHiddenForSubs),
                    maximum: {
                        global: (_.maxPerStreamSetting?.maxPerStream * +!!_.maxPerStreamSetting?.isEnabled) | 0,
                        user: (_.maxPerUserSetting?.maxPerStream * +!!_.maxPerUserSetting?.isEnabled) | 0,
                    },
                    needsInput: parseBool(_.isUserInputRequired),
                    paused: parseBool(_.isPaused),
                    premium: parseBool(_.isSubOnly),
                    prompt: (_.prompt || ''),
                    skips: parseBool(_.shouldRedemptionsSkipRequestQueue),
                    title: (_.title || '').trim(),
                    updated: (_.updatedForIndicatorAt || _.globallyUpdatedForIndicatorAt),
                });
            }

            // Add any missing items...
            for(const __item__ of STREAMER.__shop__)
                if(inventory.missing(item => item.title.equals(__item__.title) && (item.cost == __item__.cost)))
                    inventory.push(__item__);

            const cachedShopAddress = `points_shop_${ STREAMER.sole }`;

            Cache.large.load(cachedShopAddress, shop => {
                shop = shop[cachedShopAddress];

                if(nullish(shop))
                    return;

                for(const item of shop)
                    if(!~inventory.findIndex(i => i.id == item.id)) {
                        let j;

                        if(~(j = inventory.findIndex(i => i.title.equals(item.title))))
                            inventory.splice(j, 1, item);
                        else
                            inventory.push(item);
                    }
            });

            Cache.large.save({ [cachedShopAddress]: inventory });

            return inventory.sort((a, b) => a.cost - b.cost);
        },

        get sole() {
            const [channel_id] = [
                ...$.all('[data-test-selector="image_test_selector"i]').map(img => img.src).filter(src => src.contains('/panel-')).map(src => parseURL(src).pathname.split('-', 3)),
                ...$.all('[src][class*="channel"i][class*="points"i][class*="icon"i]').map(img => img.src).filter(src => src.contains('-icons/')).map(src => parseURL(src).pathname.slice(1).split('/')),
            ].flat().filter(parseFloat);

            return (0
                || parseInt(channel_id ?? LIVE_CACHE.get('sole'))
                || STREAMER.__sole__
            );
        },

        get song() {
            const element = $('[class*="soundtrack"i]');
            const song = new String(element?.textContent ?? '');

            // Object.defineProperties(song, {
            //     href: { value: element?.closest('[href]')?.href }
            // });

            return song;
        },

        get tags() {
            const tags = [];

            $.all('.tw-tag').map(element => {
                const name = element.textContent.toLowerCase()
                    , { href } = element.closest('a[href]');

                tags.push(name);
                tags[name] = href;

                return name;
            });

            return tags ?? LIVE_CACHE.get('tags');
        },

        get team() {
            const element = $('[href^="/team"]')
                , team = new String((element?.textContent ?? '').trim());

            Object.defineProperties(team, {
                href: { value: element?.href }
            });

            return team;
        },

        get time() {
            return parseTime(($('.live-time')?.innerText ?? '0').replace(/^\s*([\d\:]+)[^$]*$/, '$1'));
        },

        get tint() {
            const color = window
                ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                ?.getPropertyValue?.('--color-accent');

            return (color || '#9147FF').toUpperCase();
        },

        get tone() {
            const { H, S, L, R, G, B } = Color.HEXtoColor(STREAMER.tint)
                , [min, max] = [[0, 30], [70, 100]][+(THEME.unlike('dark'))];

            return Color.HSLtoRGB(H, S, (100 - L).clamp(min, max)).HEX.toUpperCase();
        },

        get aego() {
            const { H, S, L, R, G, B } = Color.HEXtoColor(STREAMER.tint);

            return Color.HSLtoRGB(H + 180, S, L).HEX.toUpperCase();
        },

        get veto() {
            return !!$.all('[id*="banned"i], [class*="banned"i]').length;
        },

        get vods() {
            const { name, sole } = STREAMER;

            if(Number.isNaN(sole))
                return fetchURL.fromDisk(`https://www.twitch.tv/${ name }/videos`, { hoursUntilEntryExpires: 1 })
                    .then(r => r.text())
                    .then(html => {
                        const dom = (new DOMParser).parseFromString(html, 'text/html');
                        const scripts = $.all('script[type*="json"i]', dom);
                        const data = [];

                        for(const script of scripts)
                            data.push(JSON.parse(script?.innerText ?? null));
                        return data.filter(defined);
                    })
                    .then(json => {
                        for(const child of json)
                            if(child instanceof Array)
                                for(const item of child)
                                    if(/^(ItemList)$/i.test(item['@type']))
                                        return item.itemListElement.map(({ name, url }) => (
                                            (parseURL(url).pathname.contains('/videos/'))
                                                ? { name, href: url }
                                                : null
                                        )).filter(defined);
                    });

            return fetchURL.fromDisk(`https://www.twitchmetrics.net/c/${ sole }-${ name }/videos?sort=published_at-desc`)
                .then(response => response.text())
                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                .then(DOM => $.all('[href*="/videos/"i]:not(:only-child)', DOM).map(a => ({ name: a.textContent.trim(), href: a.href })))
                .catch($warn);
        },

        follow() {
            $('[data-a-target="follow-button"i]')?.click?.();
        },

        unfollow() {
            $('[data-a-target="unfollow-button"i]')?.click?.();
        },

        __eventlisteners__: {
            onhost: new Set,
            onraid: new Set,
        },

        set onhost(job) {
            STREAMER.__eventlisteners__.onhost.add(job);
        },

        set onraid(job) {
            STREAMER.__eventlisteners__.onraid.add(job);
        },
    };

    STREAMER.__sole__ = (await Cache.load('ChannelPoints')).ChannelPoints?.[STREAMER.name]?.split('|')?.at(2)?.split('/')?.at(0);

    // Make the main icon draggable...
    const StreamerMainIcon = $(`main a[href$="${ NORMALIZED_PATHNAME }"i]`)
        , StreamerFilteredData = { ...STREAMER };

    if(nullish(StreamerMainIcon))
        return /* Leave the main function (Initialize) if there's no streamer icon... Probably not in a stream */;

    for(const key of 'chat coin paid ping poll tags team time __eventlisteners__'.split(' '))
        delete StreamerFilteredData[key];

    StreamerMainIcon.setAttribute('draggable', true);
    StreamerMainIcon.ondragstart ??= event => {
        event.dataTransfer.dropEffect = 'move';
    };

    // Handlers: on-raid | on-host
    STREAMER.onraid = STREAMER.onhost = async({ hosting = false, raiding = false, raided = false }) => {
        if(!hosting && !raiding && !raided)
            return;

        const next = await GetNextStreamer();

        $log("Resetting timer. Reason:", { hosting, raiding, raided }, "Moving onto:", next);

        Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() });
    };

    /** Notification Array - the visible, actionable notifications
     * href:string   - link to the channel
     * icon:string   - link to the channel's image
     * live:boolean  - Is the channel live
     * name:string   - the channel's name
     */
    NOTIFICATIONS = [
        ...$.all('[data-test-selector^="onsite-notifications"i] [data-test-selector^="onsite-notification"i]')
            .map(element =>{
                const icon = $('img', element)?.src;

                return {
                    live: true,
                    href: $('a', element)?.href,
                    icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                    name: $('[class$="text"i]', element)?.textContent?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $2, $3, $$, $_) => $1),
                };
            }),
    ].filter(uniqueChannels);

    // Expand the left-hand panel until the last live channel is visible
    __GetAllChannels__:
    if(!ALREADY_EXPANDED) {
        ALREADY_EXPANDED = true;

        let element, max_show_more = 10, max_show_less = 10, max_panel_size = 10;

        // Open the Side Nav (only if it isn't already), and remember how it was
        const alreadyOpen = SideNav.open;

        if(!alreadyOpen)
            await SideNav.set(true);

        // Click "show more" as many times as possible
        show_more: while(true
            && --max_show_more
            && defined(element = $('[id*="side"i][id*="nav"i] [data-a-target$="show-more-button"i]'))
        )
            element.click();

        const ALL_LIVE_SIDE_PANEL_CHANNELS = $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a').filter(e => $.nullish('[class*="--offline"i]', e));

        try {
            /** Hidden Channels Array - all channels/friends that appear on the side panel
             * href:string   - link to the channel
             * icon:string   - link to the channel's image
             * live:boolean  - Is the channel live
             * name:string   - the channel's name
             */
            ALL_CHANNELS = [
                // Current (followed) streamers
                ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section a`)
                    .map(element => {
                        const icon = $('img', element)?.src;
                        const streamer = {
                            from: 'ALL_CHANNELS',
                            href: element.href,
                            icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                            get live() {
                                let { href } = element
                                    , url = parseURL(href)
                                    , { pathname } = url
                                    , name = pathname.slice(1).toLowerCase();

                                // Then the actual "does the channel show up" result
                                const parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                                if(nullish(parent))
                                    return UnlistedLive(pathname);

                                // The "is it offline" result
                                const live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                                return live;
                            },
                            name: ($('img', element)?.alt || parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
                        };

                        element.setAttribute('draggable', true);
                        element.ondragstart ??= event => {
                            event.dataTransfer.dropEffect = 'move';
                        };

                        // Activate (and set) the live status for the streamer
                        const { live } = streamer;

                        return streamer;
                    }),
            ].filter(uniqueChannels);

            /** Channels Array - all channels/friends that appear on the side panel (except the currently viewed one)
             * @prop {string} href   - Link to the channel
             * @prop {string} icon   - Link to the channel's image
             * @prop {boolean} live  - Is the channel live
             * @prop {string} name   - The channel's name
             */
            CHANNELS = [
                // Current (followed) streamers
                ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section a:not([href$="${ NORMALIZED_PATHNAME }"i])`)
                    .map(element => {
                        const icon = $('img', element)?.src;
                        const streamer = {
                            from: 'CHANNELS',
                            href: element.href,
                            icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                            get live() {
                                let { href } = element
                                    , url = parseURL(href)
                                    , { pathname } = url;

                                const parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                                if(nullish(parent))
                                    return UnlistedLive(pathname);

                                const live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                                return live;
                            },
                            name: ($('img', element)?.alt || parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
                        };

                        element.setAttribute('draggable', true);
                        element.ondragstart ??= event => {
                            event.dataTransfer.dropEffect = 'move';
                        };

                        return streamer;
                    }),
            ].filter(uniqueChannels);

            /** Streamers Array - all followed channels that appear on the "Followed Channels" list (except the currently viewed one)
             * @prop {string} href   - Link to the channel
             * @prop {string} icon   - Link to the channel's image
             * @prop {boolean} live  - Is the channel live
             * @prop {string} name   - The channel's name
             */
            STREAMERS = [
                // Current streamers
                ...$.all(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a:not([href$="${ NORMALIZED_PATHNAME }"i])`)
                    .map(element => {
                        const icon = $('img', element)?.src;
                        const streamer = {
                            from: 'STREAMERS',
                            href: element.href,
                            icon: (typeof icon == 'string' ? Object.assign(new String(icon), parseURL(icon)) : null),
                            get live() {
                                let { href } = element
                                    , url = parseURL(href)
                                    , { pathname } = url;

                                const parent = $(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href$="${ pathname }"i]`);

                                if(nullish(parent))
                                    return UnlistedLive(pathname);

                                const live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                                return live;
                            },
                            name: ($('img', element)?.alt || parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
                        };

                        element.setAttribute('draggable', true);
                        element.ondragstart ??= event => {
                            event.dataTransfer.dropEffect = 'move';
                        };

                        return streamer;
                    }),
            ].filter(uniqueChannels);
        } catch(error) {
            $warn(error);
        }

        // Click "show less" as many times as possible
        show_less: while(true
            && --max_show_less
            && defined(element = $('[data-a-target$="show-less-button"i]'))
        )
            element.click();

        let PANEL_SIZE = 0;

        // Only re-open sections if they contain live channels
        show_more_again: while(true
            && --max_panel_size
            && defined(element = $('[id*="side"i][id*="nav"i] [data-a-target$="show-more-button"i]'))
            && (++PANEL_SIZE * 12) < ALL_LIVE_SIDE_PANEL_CHANNELS.length
        )
            element.click();

        // Put the Side Nav back the way it was (#42: a stale toggle could leave it collapsed)
        if(!alreadyOpen)
            wait().then(() => SideNav.set(false));
    } // :__GetAllChannels__

    // Every channel
    ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);

    // Load the streamer's data from Twitch as a backup...
    await new Search(null, 'auto')
        .then(Search.convertResults)
        .then(streamer => {
            for(const key in streamer)
                LIVE_CACHE.set(key, streamer[key]);
        })
        .catch($warn)
        .finally(async() => {
            if(nullish(STREAMER))
                return;

            const element = $(`a[href$="${ NORMALIZED_PATHNAME }"i]`)
                , { href, icon, live, name } = STREAMER;

            element.setAttribute('draggable', true);
            element.ondragstart ??= event => {
                event.dataTransfer.dropEffect = 'move';
            };

            /* Attempt to use the Twitch API */
            __FineDetails__:
            if(parseBool(Settings.fine_details)) {
                // Get the cookie values
                const { cookies } = Search;

                USERNAME = window.USERNAME = cookies.login || USERNAME;

                // Get the channel/vod information
                let channelName
                    , videoID;

                const { pathname } = location;

                if(pathname.startsWith('/videos/'))
                    videoID = pathname.replace('/videos/', '').replace(/\//g, '').replace(/^v/i, '');
                else
                    channelName = pathname.replace(/^(moderator)\/(\/[^\/]+?)/i, '$1').replace(/^(\/[^\/]+?)\/(squad|videos)\b/i, '$1').replace(/\//g, '');

                // Fetch an API request
                const type = (defined(videoID) ? 'vod' : 'channel')
                    , value = (defined(videoID) ? videoID : channelName)
                    , token = cookies.auth_token;

                if(!STREAMER.name?.length)
                    break __FineDetails__;

                // Get Twitch analytics data
                    // activeDaysPerWeek:number         → the average number of days the channel is live (per week)
                    // actualStartTime:Date             → the time (date) when the stream started
                    // dailyBroadcastTime:number        → the average number of hours streamed (per day)
                    // dailyStartTimes:array<string>    → an object of usual start times for the stream (strings are formatted as 24h time strings)
                    // dailyStopTimes:array<string>     → an object of usual stop times for the stream (strings are formatted as 24h time strings)
                    // dataRetrievedAt:Date             → when was the data last retrieved (successfully)
                    // dataRetrievedOK:boolean          → was the data retrieval successful
                    // daysStreaming:array<string>      → abbreviated names of days the stream is normally live
                    // projectedLastCall:Date           → the assumed last time to activate First in Line according to the user's settings
                    // projectedWindDownPeriod:Date     → the assumed "dying down" period before the stream ends (90% of the stream will have passed)
                    // projectedStopTime:Date           → the assumed time (date) when the stream will end
                    // usualStartTime:string            → the normal start time for the stream on the current day (formatted as 24h time string)
                    // usualStopTime:string             → the normal stop time for the stream on the current day (formatted as 24h time string)

                // First, attempt to retrieve the cached data (no older than 4h)
                try {
                    await Cache.load(`data/${ STREAMER.name }`, cache => {
                        let data = cache[`data/${ STREAMER.name }`]
                            , { dataRetrievedAt, dataRetrievedOK } = data;

                        dataRetrievedAt ||= 0;
                        dataRetrievedOK ||= false;

                        // Only refresh every 4h
                        if(!parseBool(dataRetrievedOK))
                            throw new Error(`The data was not saved correctly`);
                        else if((dataRetrievedAt + (4 * 60 * 60 * 1000)) < +new Date)
                            throw new Error(`The data has expired`);
                        else
                            STREAMER.data = { ...STREAMER.data, ...data, streamerID: STREAMER.sole };

                        $remark(`Cached details about "${ STREAMER.name }"`, data);

                        // PrepareForGarbageCollection(cache);
                    });
                } catch(exception) {
                    let { name, sole } = STREAMER;

                    if(!sole)
                        await new Search(name)
                            .then(Search.convertResults)
                            .then(streamer => sole = streamer.sole);

                    if(!sole)
                        break __FineDetails__;

                    const $ErrGet = `TTV-Tools-failed-to-get`;
                    const ErrGet = JSON.parse(null
                        ?? sessionStorage.getItem($ErrGet)
                        ?? '[]'
                    );

                    let FETCHED_OK = false;

                    // You have to make proper CORS requests to fetch HTML data! //

                    /***
                     *      _______       _ _       _       __  __      _        _
                     *     |__   __|     (_) |     | |     |  \/  |    | |      (_)
                     *        | |_      ___| |_ ___| |__   | \  / | ___| |_ _ __ _  ___ ___
                     *        | \ \ /\ / / | __/ __| '_ \  | |\/| |/ _ \ __| '__| |/ __/ __|
                     *        | |\ V  V /| | || (__| | | | | |  | |  __/ |_| |  | | (__\__ \
                     *        |_| \_/\_/ |_|\__\___|_| |_| |_|  |_|\___|\__|_|  |_|\___|___/
                     *
                     *
                     */
                    // Stream details (JSON) → /StreamerDisplayName
                        // activeDaysPerWeek:number<int>
                        // actualStartTime:string<Date-ISO>
                        // dailyBroadcastTime:number<int>
                        // dailyStartTimes:object<{ "${ Index }": string<Date-Time<{HH:MM}>>, ... }>
                        // dailyStopTimes:object<{ "${ Index }": string<Date-Time<{HH:MM}>>, ... }>
                        // dataRetrievedAt:number<Date-Absolute>
                        // dataRetrievedOK:boolean
                        // daysStreaming:array[@activeDaysPerWeek]<{ string<Date-DayName>, ... }>
                        // projectedLastCall:string<Date-ISO>
                        // projectedStopTime:string<Date-ISO>
                        // projectedWindDownPeriod:string<Date-ISO>
                        // usualStartTime:string<Date-Time<{HH:MM}>>
                        // usualStopTime:string<Date-Time<{HH:MM}>>
                    www_twitchmetrics_net: if(!FETCHED_OK) {
                        // Keep the ID that was checked: `STREAMER.sole` is a getter, and a second read can be empty (`/c/undefined-…`)
                        when(() => (sole => defined(sole) ? { name: STREAMER.name, sole } : false)(STREAMER.sole)).then(({ name, sole }) => {
                            fetchURL.fromDisk(`https://www.twitchmetrics.net/c/${ sole }-${ name.toLowerCase() }/stream_time_values`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                                .then(response => response.json())
                                .then(json => {
                                    // A list of `[start, stop]` pairs; anything else is an error page (e.g. a CORS proxy's own error, sent as a 200)
                                    if(defined(json) && !Array.isArray(json))
                                        throw `Unexpected stream-time data: ${ JSON.stringify(json)?.slice(0, 120) }`;

                                    const data = { dailyBroadcastTime: 0, activeDaysPerWeek: 0, usualStartTime: '00:00', usualStopTime: '00:00', daysStreaming: [], dailyStartTimes: {}, dailyStopTimes: {} }
                                        , today = new Date;

                                    const getWeekDays = (...days) => days.sort().map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]);

                                    const avgStartTime = [], avgStreamSpan = [], avgStopTime = [], dlyStartTime = {}, dlyStopTime = {};

                                    const daysWithStreams = new Set()
                                        , totalStreamHistory = (json ?? [])
                                            // All except today
                                            .slice(0, -1)
                                            // Last 2 weeks (excluding today)
                                            // .slice(-14)
                                            .reverse()
                                            .map(([start, stop]) => {
                                                const date = new Date(start.toUpperCase());

                                                if(Math.abs(today - date) < (30 * 24 * 60 * 60 * 1000))
                                                    daysWithStreams.add(date.getDay());

                                                return [start, stop];
                                            })
                                            .reverse()
                                            .map(([start, stop]) => {
                                                // Set the average start/stop times (overall)
                                                const [S_, _S] = [start, stop].map(date => new Date(date));

                                                avgStartTime.push([S_.getHours(), S_.getMinutes(), S_.getDay()]);
                                                avgStreamSpan.push(Math.abs(+S_ - +_S));
                                                avgStopTime.push([_S.getHours(), _S.getMinutes(), _S.getDay()]);

                                                return [start, stop];
                                            });

                                    // Set the daily start time
                                    avgStartTime.map(([h, m, d]) => (dlyStartTime[d] ??= []).push([h, m]));

                                    for(const day in dlyStartTime) {
                                        let avgH = 0, avgM = 0;

                                        dlyStartTime[day]
                                            .map(([h, m]) => {
                                                avgH += h;
                                                avgM += m;
                                            })
                                            .filter((v, i, a) => !i)
                                            .map(() => {
                                                const { length } = dlyStartTime[day];

                                                avgH = Math.round(avgH / length);
                                                avgM = (avgM / length).floorToNearest(15);

                                                data.dailyStartTimes[day] = data.dailyStartTimes[getWeekDays(day)] = [avgH, avgM].map(t => ('00' + t).slice(-2)).join(':');
                                            });
                                    }

                                    // Set the average stream length
                                    avgStreamSpan.map(t => data.dailyBroadcastTime += t);
                                    data.dailyBroadcastTime = (data.dailyBroadcastTime / avgStreamSpan.length) | 0;

                                    // Set the daily stop time
                                    avgStopTime.map(([h, m, d]) => (dlyStopTime[d] ??= dlyStartTime[d]));

                                    for(const day in dlyStartTime) {
                                        const [H, M] = toTimeString(data.dailyBroadcastTime, '!hour:!minute').split(':').map(parseFloat);

                                        data.dailyStopTimes[day] = data.dailyStopTimes[getWeekDays(day)] =
                                            data.dailyStartTimes[day]
                                                .split(':')
                                                .map(parseFloat)
                                                .map((v, i) => ([H, M][i] + v) % [24, 60][i])
                                                .map((v, i) => i ? v.floorToNearest(15) : v)
                                                .map(t => ('00' + t).slice(-2))
                                                .join(':');
                                    }

                                    // Set today's start/stop times
                                    data.usualStartTime = data.dailyStartTimes[today.getDay()];
                                    data.usualStopTime = data.dailyStopTimes[today.getDay()];

                                    data.daysStreaming = getWeekDays(...daysWithStreams);
                                    data.activeDaysPerWeek = data.daysStreaming.length;

                                    data.actualStartTime = new Date(+new Date - STREAMER.time);
                                    data.projectedStopTime = new Date(+data.actualStartTime + data.dailyBroadcastTime);
                                    data.projectedWindDownPeriod = new Date(+data.actualStartTime + (data.dailyBroadcastTime * .9));
                                    data.projectedLastCall = new Date(+data.projectedStopTime - (
                                        (
                                            parseBool(Settings.first_in_line)
                                                ? Settings.first_in_line_time_minutes
                                                : parseBool(Settings.first_in_line_plus)
                                                    ? Settings.first_in_line_plus_time_minutes
                                                    : parseBool(Settings.first_in_line_all)
                                                        ? Settings.first_in_line_all_time_minutes
                                                        : parseBool(Settings.first_in_line_now)
                                                            ? 0
                                                            : 15
                                        ) * 60_000
                                    ));

                                    $remark(`Stream details about "${ STREAMER.name }"`, data);

                                    return STREAMER.data = { ...STREAMER.data, ...data };
                                })
                                .then(data => {
                                    data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.dailyBroadcastTime)), dataRetrievedAt: +new Date };

                                    Cache.save({ [`data/${ STREAMER.name }`]: data });
                                })
                                .catch(error => {
                                    $warn(`Failed to get STREAM details (1§1): ${ error }`);
                                    // .toNativeStack();

                                    if(!ErrGet.length)
                                        addReport({ [$ErrGet]: `https://www.twitchmetrics.net/c/${ sole }-${ name?.toLowerCase() }/stream_time_values` });
                                });

                            // Channel details (HTML → JSON)
                            fetchURL.fromDisk(`https://www.twitchmetrics.net/c/${ sole }-${ name.toLowerCase() }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                                .then(response => response.text())
                                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                .then(DOM => {
                                    const data = {};

                                    $.all('dt+dd', DOM).map(dd => {
                                        let name = dd.previousElementSibling.textContent.trim().toLowerCase().replace(/\s+(\w)/g, ($0, $1, $$, $_) => $1.toUpperCase())
                                            , value = dd.textContent.trim();

                                        value = (
                                            /^(followers)$/i.test(name)
                                                ? parseInt(value.replace(/\D/g, ''))
                                                : /^((first|last)seen)$/i.test(name)
                                                    ? new Date($('time', dd).getAttribute('datetime'))
                                                    : value
                                        );

                                        data[name] = value;
                                    });

                                    $remark(`Channel details about "${ STREAMER.name }"`, data);

                                    return STREAMER.data = { ...STREAMER.data, ...data };
                                })
                                .then(data => {
                                    data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.firstSeen)), dataRetrievedAt: +new Date };

                                    Cache.save({ [`data/${ STREAMER.name }`]: data });
                                })
                                .catch(error => {
                                    $warn(`Failed to get CHANNEL details (1§2): ${ error }`);
                                    // .toNativeStack();

                                    if(!ErrGet.length)
                                        addReport({ [$ErrGet]: `https://www.twitchmetrics.net/c/${ sole }-${ name?.toLowerCase() }` });
                                });
                        }, 1e3)
                    } // :__FineDetails__ | :www_twitchmetrics_net

                    /***
                     *      _______       _ _       _        _____ _        _
                     *     |__   __|     (_) |     | |      / ____| |      | |
                     *        | |_      ___| |_ ___| |__   | (___ | |_ __ _| |_ ___
                     *        | \ \ /\ / / | __/ __| '_ \   \___ \| __/ _` | __/ __|
                     *        | |\ V  V /| | || (__| | | |  ____) | || (_| | |_\__ \
                     *        |_| \_/\_/ |_|\__\___|_| |_| |_____/ \__\__,_|\__|___/
                     *
                     *
                     */
                    // Channel details (HTML → JSON) → /StreamerDisplayName
                        // TEAMS:string
                        // averageViewers:number<int>
                        // averageViewersRanked:number<int>
                        // firstSeen:object<Date>
                        // followers:number<int>
                        // followersRanked:number<int>
                        // games: object<{ "${ Game_Name }":number<int>, ... }>
                        // highestViewers:number<int>
                        // highestViewersRanked:number<int>
                        // lastSeen:object<Date>
                        // streamLang:string[2]<Language-Code>
                        // subCount:number<int>
                        // totalViews:number<int>
                        // totalViewsRanked:number<int>
                    twitchstats_net: if(!FETCHED_OK)
                        fetchURL.fromDisk(`https://twitchstats.net/streamer/${ name.toLowerCase() }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                            .then(response => response.text())
                            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                            .then(dom => {
                                const children = $.all('.conta > :not(:first-child, :last-child)', dom);
                                const obj = { games: {} };

                                /**
                                 * Parses a string into a normalized time, number, date, or empty string.
                                 * @param {string} [string=''] - The string to parse
                                 * @returns {string} The parsed value as a string
                                 */
                                const parse = (string = '') =>
                                    (
                                        /\b(da?y|h(?:ou)?r|min(?:ute)?)s?\b/i.test(string)
                                            ? parseTime(string.replace(/([a-z\s,]+)/gi, ':').replace(/:?$/, '00'))
                                            : /^([-])$/.test(string)
                                                ? ''
                                                : /^\d/.test(string)
                                                    ? parseFloat(string.replace(/[^\d\.]+/g, '')) + ''
                                                    : /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(string)
                                                        ? new Date(string) + ''
                                                        : string
                                    );

                                parsing: for(const child of children)
                                    if($.nullish('#allgames', child))
                                        parsing_stats: for(const grandChild of child.children) {
                                            let [key, val, ...etc] = grandChild.children;

                                            key = key?.textContent?.trim();
                                            val = val?.textContent?.trim();

                                            if(!parseBool(key?.length))
                                                continue parsing_stats;

                                            key = (key).replace(/\s+/g, '').replace(/^(?:[A-Z][a-z])/, ($0, $$, $_) => $0.toLowerCase());
                                            val = parse(val);

                                            switch(key) {
                                                case 'accStart': {
                                                    key = 'firstSeen';
                                                } break;

                                                case 'lastOnline': {
                                                    key = 'lastSeen';

                                                    if(val?.equals('now'))
                                                        val = new Date;
                                                    else
                                                        val = new Date((+new Date) - val);
                                                } break;
                                            }

                                            obj[key] = val;

                                            for(const e of etc) {
                                                const [k, v] = e.textContent.split(/\s+/);

                                                obj[key + k] = parse(v);
                                            }
                                        }
                                    else
                                        parsing_games: for(const game of $.all('#allgames > *', child)) {
                                            const [name, time] = game.children;

                                            obj.games[name.textContent] = parse(time.textContent);
                                        }

                                return obj;
                            })
                            .then(data => {
                                data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.firstSeen)), dataRetrievedAt: +new Date };

                                Cache.save({ [`data/${ STREAMER.name }`]: data });
                            })
                            .catch(error => {
                                $warn(`Failed to get CHANNEL details (2): ${ error }`);
                                // .toNativeStack();

                                if(!ErrGet.length)
                                    addReport({ [$ErrGet]: `https://twitchstats.net/streamer/${ name?.toLowerCase() }` });
                            });

                    /***
                     *      _______       _ _       _       _______             _
                     *     |__   __|     (_) |     | |     |__   __|           | |
                     *        | |_      ___| |_ ___| |__      | |_ __ __ _  ___| | _____ _ __
                     *        | \ \ /\ / / | __/ __| '_ \     | | '__/ _` |/ __| |/ / _ \ '__|
                     *        | |\ V  V /| | || (__| | | |    | | | | (_| | (__|   <  __/ |
                     *        |_| \_/\_/ |_|\__\___|_| |_|    |_|_|  \__,_|\___|_|\_\___|_|
                     *
                     *
                     */
                    // Channel details (JSON)
                    twitchtracker_com: if(!FETCHED_OK)
                        fetchURL.fromDisk(`https://twitchtracker.com/api/channels/summary/${ name.toLowerCase() }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                            .then(text => text.json())
                            .then(json => {
                                const data = {};
                                const table = {
                                    minutes_streamed: 'minutesStreamedThisMonth',
                                    avg_viewers: 'averageViewersThisMonth',
                                    max_viewers: 'maximumViewersThisMonth',
                                    hours_watched: 'hoursWatchedThisMonth',
                                    followers: 'followersThisMonth',
                                    views: 'viewsThisMonth',
                                    followers_total: 'followers',
                                    views_total: 'views',
                                };

                                for(const key in json)
                                    data[table[key]] = json[key];

                                Cache.save({ [`data/${ STREAMER.name }`]: { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.followers)), dataRetrievedAt: +new Date } });
                            })
                            .catch(error => {
                                $warn(`Failed to get CHANNEL details (3): ${ error }`);
                                // .toNativeStack();

                                if(!ErrGet.length)
                                    addReport({ [$ErrGet]: `https://twitchtracker.com/api/channels/summary/${ name?.toLowerCase() }` });
                            });

                    /*** OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE OBSOLETE
                     *      _______       _ _       _
                     *     |__   __|     (_) |     | |
                     *        | |_      ___| |_ ___| |__
                     *        | \ \ /\ / / | __/ __| '_ \
                     *        | |\ V  V /| | || (__| | | |
                     *        |_| \_/\_/ |_|\__\___|_| |_|
                     *
                     *
                     */
                    // Channel details (JSON)
                        // data:array<{
                        //     id:string«User ID»,
                        //     login:string«User login»,
                        //     display_name:string«User name»,
                        //     type:string<"admin" | "global_mod" | "staff" | "">,
                        //     broadcaster_type:string<"affiliate" | "partner" | "">,
                        //     description:string,
                        //     profile_image_url:string<URL>,
                        //     offline_image_url:string<URL>,
                        //     view_count:number?<integer>!Deprecated,
                        //     email:string?<e-mail>,
                        //     created_at:string<Date.UTC>,
                        // }>
                    api_twitch_tv: if(!FETCHED_OK)
                        // The OAuth token loads later (Search helpers, below); asking before it's set gets a 401
                            // Signed-out viewers never get one: stop waiting after 30s
                        when.defined((until => () => (Search.validated ? Search.authorization : void null) ?? (+new Date > until ? when.null : void null))(+new Date + 30_000), 250).then(authorization => fetchURL.fromDisk(`https://api.twitch.tv/helix/users?id=${ STREAMER.sole }`, {
                            headers: {
                                Authorization: authorization,
                                'Client-Id': Search.clientID,
                            },
                            mode: 'cors',
                            hoursUntilEntryExpires: 168,
                        }))
                            .then(response => response.json())
                            .then(json => json.data?.[0])
                            .then(json => {
                                if(nullish(json))
                                    throw "Fine Detail JSON data could not be parsed...";

                                $remark("Getting fine details...", { [type]: value, cookies }, json);

                                const conversion = {
                                    ally: 'broadcaster_type',
                                    perm: 'type',
                                    sole: 'id',
                                };

                                const data = {};

                                for(const key in conversion)
                                    data[key] = json[conversion[key]];

                                return data;
                            })
                            .then(data => {
                                data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.ally)), dataRetrievedAt: +new Date };

                                Cache.save({ [`data/${ STREAMER.name }`]: data });
                            })
                            .catch(error => {
                                $warn(`Failed to get CHANNEL details (4): ${ error }`);
                                // .toNativeStack();

                                if(!ErrGet.length)
                                    addReport({ [$ErrGet]: `https://api.twitch.tv/helix/users?id=${ STREAMER.sole }` });
                            });
                }
            } // :__FineDetails__
        });

    setInterval(update, 2_5_0);

    LIVE_REMINDERS__LISTING_INTERVAL = void null; // List the live time of Live Reminders

    if(parseBool(Settings.up_next__one_instance)) {
        $log("This tab is the Up Next owner", UP_NEXT_ALLOW_THIS_TAB);

        // Set the anon-ID
        fetchURL.idempotent(`/directory/category/just-chatting`, { timeout: 5_000 })
            .then(response => response.text())
            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
            .then(DOM => {
                const regexp = /client_?id\s?[:=](["'`])(\w+)\1/gi;

                $.getElementByText.call(DOM, regexp).innerText.replace(regexp, ($0, stringBarrier, hardcodedID, $$, $_) => Search.anonID = hardcodedID);
            });

        if(UP_NEXT_ALLOW_THIS_TAB) {
            // Search helpers...
                // https://chrome.google.com/webstore/detail/twitch-username-and-user/laonpoebfalkjijglbjbnkfndibbcoon
            Cache.load(['clientID', 'oauthToken'], async({ clientID = 's8glgfv1nm23ts567xdsmwqu5wylof', oauthToken }) => {
                if(clientID?.equals('.DENIED') || oauthToken?.equals('.DENIED'))
                    return;

                if(nullish(clientID) || nullish(oauthToken)) {
                    fetchURL(`https://id.twitch.tv/oauth2/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: top['atоb']('zqlTBes8gqKcjgx6Bql2B2zlFm8Pxok9AEzouQk9FgWlWEvoueliBpBMFQKKF2kyYqvMYmv8je5czqRoxq5+Y2Lfugc8uOW2JgRoWEHsFEC8AQ69FUB2YmSrWSa8ugLKjeAnwevrWSaMYmvcBes8weSnYPB9WQS8BEhrWeln')
                    }).then(response => response.json()).then(({ access_token, expires_in, token_type, error, error_description }) => {
                        if(error && error_description)
                            throw new Error(`${ error }: ${ error_description }`);
                        oauthToken = access_token;

                        Cache.save({ oauthToken, clientID });

                        Search.authorization = `Bearer ${ oauthToken }`;
                        Search.clientID = clientID;
                    }).catch(async error => {
                        $warn(error);

                        const { oauthToken: savedToken } = await Settings.get('oauthToken');

                        if(defined(savedToken) && savedToken?.unlike('.DENIED')) {
                            Cache.save({ oauthToken: savedToken, clientID });

                            Search.authorization = `Bearer ${ savedToken }`;
                            Search.clientID = clientID;

                            return /* @yetval fix for #38 */;
                        }

                        confirm(`<div controller
                            okay="Grant access"
                            deny="Never ask again"
                            >TTV Tools would like to use Twitch's APIs on your behalf.</div>`)
                            .then(answer => {
                                if(answer === false)
                                    return Cache.save({ clientID: '.DENIED', oauthToken: '.DENIED' });

                                const redirectURI = encodeURIComponent('https://ephellon.github.io/TTVAuth')
                                    , scope = encodeURIComponent(['user:read:follows', 'user:read:subscriptions', 'chat:read'].join(' '))
                                    , state = (new UUID).value;

                                const oauth = open(`https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${ clientID }&redirect_uri=${ redirectURI }&response_type=token&scope=${ scope }&state=${ state }`, '_blank');

                                when(() => oauth.closed).then(async() => {
                                    const { oauthToken } = await Settings.get('oauthToken');

                                    Cache.save({ oauthToken, clientID });

                                    Search.authorization = `Bearer ${ oauthToken }`;
                                    Search.clientID = clientID;
                                });
                            });
                    })
                } else {
                    Cache.save({ oauthToken, clientID });

                    Search.authorization = `Bearer ${ oauthToken }`;
                    Search.clientID = clientID;
                }
            })
        } else {
            Cache.load(['clientID', 'oauthToken'], async({ clientID = 's8glgfv1nm23ts567xdsmwqu5wylof', oauthToken }) => {
                if(false
                    || nullish(clientID)
                    || nullish(oauthToken)
                    || clientID.equals('.DENIED')
                    || oauthToken.equals('.DENIED')
                )
                    return;

                fetchURL(`https://id.twitch.tv/oauth2/validate`, {
                    method: 'GET',
                    headers: { Authorization: `OAuth ${ oauthToken }` },

                    timeout: 30_000,
                }).then(response => response.json()).then(({ client_id, login, scopes, user_id, expires_in, status, message }) => {
                    if(status && message)
                        throw new TypeError(`HTTP Error (${ status }): ${ message }`);

                    Search.authorization = `Bearer ${ oauthToken }`;
                    Search.clientID = client_id;

                    Cache.save({ clientID: client_id, oauthToken });
                }).catch(error => {
                    $warn(error);

                    fetchURL(`https://id.twitch.tv/oauth2/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: top['atоb']('zqlTBes8gqKcjgx6Bql2B2zlFm8Pxok9AEzouQk9FgWlWEvoueliBpBMFQKKF2kyYqvMYmv8je5czqRoxq5+Y2Lfugc8uOW2JgRoWEHsFEC8AQ69FUB2YmSrWSa8ugLKjeAnwevrWSaMYmvcBes8weSnYPB9WQS8BEhrWeln')
                    }).then(response => response.json()).then(({ access_token, expires_in, token_type, error, error_description }) => {
                        if(error && error_description) {

                            throw new Error(`${ error }: ${ error_description }`)
                        }
                        oauthToken = access_token;

                        Cache.save({ oauthToken, clientID });

                        Search.authorization = `Bearer ${ oauthToken }`;
                        Search.clientID = clientID;
                    }).catch($warn);
                });
            })
        }

        // The token decides the Client-Id: a cached, default or `null` one gets a 401 from every Helix call. Ask Twitch
        when.defined(() => Search.authorization, 1000).then(authorization => fetchURL(`https://id.twitch.tv/oauth2/validate`, { headers: { Authorization: authorization.replace(/^Bearer\b/, 'OAuth') } }))
            .then(response => response.json())
            .then(({ client_id }) => client_id && Cache.save({ clientID: Search.clientID = client_id }))
            .catch($warn)
            .finally(() => Search.validated = true);
    } else {
        top.UP_NEXT_ALLOW_THIS_TAB = UP_NEXT_ALLOW_THIS_TAB = true;
        Runtime.sendMessage({ action: 'WAIVE_UP_NEXT' });
    }

    /*** Automation
     *                    _                        _   _
     *         /\        | |                      | | (_)
     *        /  \  _   _| |_ ___  _ __ ___   __ _| |_ _  ___  _ __
     *       / /\ \| | | | __/ _ \| '_ ` _ \ / _` | __| |/ _ \| '_ \
     *      / ____ \ |_| | || (_) | | | | | | (_| | |_| | (_) | | | |
     *     /_/    \_\__,_|\__\___/|_| |_| |_|\__,_|\__|_|\___/|_| |_|
     *
     *
     */
    // Auto-Join → src/plugins/automation/auto-join.js
    await TTV.run('auto_accept_mature', PLUGIN_CONTEXT);

    // Auto-Focus → src/plugins/automation/auto-focus.js
    await TTV.run('auto_focus', PLUGIN_CONTEXT);

    // Lurking → src/plugins/automation/lurking.js
    await TTV.run('away_mode', PLUGIN_CONTEXT);

    // Claim Loot → src/plugins/automation/claim-loot.js
    await TTV.run('claim_loot', PLUGIN_CONTEXT);

    // Claim Prime - Still requires trusted interaction → src/plugins/automation/claim-prime.js
    await TTV.run('claim_prime', PLUGIN_CONTEXT);

    // Claim Reward → src/plugins/automation/claim-reward.js
    await TTV.run('claim_reward', PLUGIN_CONTEXT);

    // Claim Drops → src/plugins/automation/claim-drops.js
    await TTV.run('claim_drops', PLUGIN_CONTEXT);

    // First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon → src/plugins/up-next/helpers.js
    await TTV.run('up_next_helpers', PLUGIN_CONTEXT);

    // First in Line → src/plugins/up-next/first-in-line.js
    await TTV.run('first_in_line', PLUGIN_CONTEXT);

    // First in Line+ (on creation) → src/plugins/automation/first-in-line-plus.js
    await TTV.run('first_in_line_plus', PLUGIN_CONTEXT);

    // Live Reminders → src/plugins/automation/live-reminders.js
    await TTV.run('live_reminders', PLUGIN_CONTEXT);

    // Game Overview Card | Store Integration → src/plugins/customization/store-integration.js
    await TTV.run('game_overview_card', PLUGIN_CONTEXT);

    // Auto-Follow → src/plugins/automation/auto-follow.js
    await TTV.run('auto_follow', PLUGIN_CONTEXT);

    // Kill Extensions → src/plugins/automation/kill-extensions.js
    await TTV.run('kill_extensions', PLUGIN_CONTEXT);

    // Parse Commands → src/plugins/automation/parse-commands.js
    await TTV.run('parse_commands', PLUGIN_CONTEXT);

    // Auto-Badge → src/plugins/automation/auto-badge.js
    await TTV.run('auto_badge', PLUGIN_CONTEXT);

    // Stop Raiding → src/plugins/automation/prevent-raiding.js
    await TTV.run('prevent_raiding', PLUGIN_CONTEXT);

    // Greedy Raiding → src/plugins/automation/greedy-raiding.js
    await TTV.run('greedy_raiding', PLUGIN_CONTEXT);

    // Stay Live → src/plugins/automation/stay-live.js
    await TTV.run('stay_live', PLUGIN_CONTEXT);

    // Time Zones → src/plugins/automation/time-zones.js
    await TTV.run('time_zones', PLUGIN_CONTEXT);

    // @notImplemented → src/plugins/automation/not-implemented.js
    await TTV.run('not_implemented', PLUGIN_CONTEXT);

    // View Mode → src/plugins/automation/view-mode.js
    await TTV.run('view_mode', PLUGIN_CONTEXT);

    // Notification Sounds → src/plugins/chat/notification-sounds.js
    await TTV.run('notification_sounds', PLUGIN_CONTEXT);

    // Mention Audio → src/plugins/chat/mention-audio.js
    await TTV.run('mention_audio', PLUGIN_CONTEXT);

    // Phrase Audio → src/plugins/chat/phrase-audio.js
    await TTV.run('phrase_audio', PLUGIN_CONTEXT);

    // Whisper Audio → src/plugins/chat/whisper-audio.js
    await TTV.run('whisper_audio', PLUGIN_CONTEXT);

    // Customization → src/plugins/customization/block-banners.js
    await TTV.run('block_banners', PLUGIN_CONTEXT);

    // Points Receipt & Ranking → src/plugins/currencies/points-receipt.js
    await TTV.run('points_receipt_placement', PLUGIN_CONTEXT);

    // Point Watcher → src/plugins/customization/point-watcher.js
    await TTV.run('point_watcher_placement', PLUGIN_CONTEXT);

    // Stream Preview → src/plugins/customization/stream-preview.js
    await TTV.run('stream_preview', PLUGIN_CONTEXT);

    // Watch Time Placement → src/plugins/customization/watch-time.js
    await TTV.run('watch_time_placement', PLUGIN_CONTEXT);

    // Auto DVR → src/plugins/networking/auto-dvr.js
    await TTV.run('video_clips__dvr', PLUGIN_CONTEXT);

    // Recover Frames → src/plugins/video-recovery/recover-frames.js
    await TTV.run('recover_frames', PLUGIN_CONTEXT);

    // Recover Stream → src/plugins/video-recovery/recover-stream.js
    await TTV.run('recover_stream', PLUGIN_CONTEXT);

    // Recover Video → src/plugins/video-recovery/recover-video.js
    await TTV.run('recover_video', PLUGIN_CONTEXT);

    // User Intent Listener - NOT A SETTING. Observe the user's intent, and prevent over-riding it → src/plugins/video-recovery/user-intent.js
    await TTV.run('user_intent', PLUGIN_CONTEXT);

    // Private Viewing - NOT A SETTING. Create a "private viewing" button for live, searched streams → src/plugins/video-recovery/private-viewing.js
    await TTV.run('private_viewing', PLUGIN_CONTEXT);

    // Recover Pages → src/plugins/video-recovery/recover-pages.js
    await TTV.run('recover_pages', PLUGIN_CONTEXT);

    // Developer Features → src/plugins/developer/developer-features.js
    await TTV.run('extra_keyboard_shortcuts', PLUGIN_CONTEXT);

    // Miscellaneous → src/plugins/misc/miscellaneous.js
    await TTV.run('miscellaneous', PLUGIN_CONTEXT);

};
// End of Initialize

let PAGE_CHECKER
    , WAIT_FOR_PAGE
    , PAGE_IS_READY = false
    , RECOVERY_TRIALS = 0
    , VIDEO_AD_COUNTDOWN
    , NORMALIZED_AD_VOLUME = false
    , NORMALIZED_AD_COUNTER = 0
    , NORMALIZED_AD_COUNTER_CURRENT = 1
    , LAST_TIME_AD_WAS_CHECKED
    , LAST_VALUE_WHEN_AD_WAS_CHECKED;

// Do NOT run on iframes...
if(top == window) {
    // Load jump (cached) data
    Cache.large.load('JumpedData', ({ JumpedData }) => {
        Object.assign(JUMP_DATA, JumpedData ?? {});

        // @performance
        PrepareForGarbageCollection(JumpedData);
    });

    // Only releases the data from memory every 10:54.321
    setInterval(() => {
        // @performance
        PrepareForGarbageCollection(JUMP_DATA);

        Cache.large.load('JumpedData', ({ JumpedData }) => {
            Object.assign(JUMP_DATA, JumpedData ?? {});

            // @performance
            PrepareForGarbageCollection(JumpedData);
        });
    }, 654_321);

    top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
        // @performance
        PrepareForGarbageCollection(JUMP_DATA);
    };

    // Keep the background alive (every 3 minutes)
    /** @protected
     * @event PONG
     * @fires PING
     * @desc Keeps the background script alive.
     *
     * @author GitHub {@link https://github.io/wOxxOm @wOxxOm}
     *
     * @see https://stackoverflow.com/a/66618269/4211612
     */
    setInterval(() => {
        const KeepAlive = Runtime.connect({ name: 'PING' });

        KeepAlive.postMessage('PING', () => KeepAlive.disconnect());
    }, 180e3);

    Runtime.sendMessage({ action: 'GET_VERSION' }, async({ version = null }) => {
        const isProperRuntime = Manifest.version === version;

        PAGE_CHECKER = !isProperRuntime
            ? $error(`The current runtime (v${ Manifest.version }) is not correct (v${ version })`)
                .toNativeStack()
            : setInterval(WAIT_FOR_PAGE = async() => {
                // Do NOT run on unsafe pages
                if(UNSAFE_TWITCH_PATHNAMES.test(location.pathname))
                    return false;

                const sadOverlay = $('[data-test-selector*="sad"i][data-test-selector*="overlay"i]');
                const adCountdown = $('[data-a-target*="ad-countdown"i]');

                // Ensure settings are loaded
                if(nullish(Settings?.versionRetrivalDate))
                    await Settings.get();

                // Set the ad volume, if applicable
                // Ensures the volume gets set once; just in case the user actually wants to hear it
                NORMALIZED_AD_VOLUME = true
                    && $.defined('[data-a-target*="ad-countdown"i]')
                    && (NORMALIZED_AD_COUNTER != NORMALIZED_AD_COUNTER_CURRENT)
                    && (false
                        || SetVolume(Settings.away_mode__volume)
                        || (NORMALIZED_AD_COUNTER = NORMALIZED_AD_COUNTER_CURRENT)
                    );

                // Ensures the ad does not freeze the page
                refresh_on_ad_freeze: if(defined(sadOverlay) || defined(adCountdown)) {
                    if(nullish(LAST_TIME_AD_WAS_CHECKED)) {
                        LAST_TIME_AD_WAS_CHECKED = +new Date;
                        LAST_VALUE_WHEN_AD_WAS_CHECKED = adCountdown?.textContent;

                        break refresh_on_ad_freeze;
                    }

                    if(true
                        && (+new Date - LAST_TIME_AD_WAS_CHECKED) > (VIDEO_AD_COUNTDOWN + 2_500)
                        && LAST_VALUE_WHEN_AD_WAS_CHECKED.equals(adCountdown.textContent)
                    ) {
                        $warn(`The advertisement seems to be stalled... Refreshing page...`);

                        ReloadPage(false);
                    }
                }

                // Enables previews on the home page (#19)
                live_previews_on_hompage: if(top.location.pathname == '/')
                    when(() => parseBool(Settings?.stream_preview), 3e3).then(() => {
                        const scale = parseFloat(Settings.stream_preview_scale) || 1
                            , muted = !parseBool(Settings.stream_preview_sound)
                            , quality = (scale > 1 ? 'auto' : '720p')
                            , controls = false;

                        $.all('[data-a-target*="preview"i][data-a-target*="card"i]:not([data-test-selector])').map(a => {
                            a.addEventListener('mouseenter', ({ currentTarget }) => {
                                const { href } = currentTarget;
                                const name = (parseURL(href).pathname ?? '/').slice(1).split('/').shift();

                                if(!name?.length)
                                    return;

                                const isOnline = $.defined('[class*="status"i][class*="indicator"i]', currentTarget);

                                if($.defined('#tt-stream-preview--iframe'))
                                    return;

                                const iframe = furnish(`iframe#tt-stream-preview--iframe[@index=0][@name=${ name }][@live=${ isOnline }][@controls=${ controls }][@muted=${ muted }][@quality=${ quality }]`, {
                                    allow: 'autoplay',
                                    src: parseURL(`https://player.twitch.tv/`).addSearch(
                                    isOnline
                                        ? ({
                                            channel: name,
                                            parent: 'twitch.tv',

                                            controls, muted, quality,
                                        })
                                        : href
                                    ).href,

                                    height: '100%',
                                    width: '100%',
                                    style: `display:block;position:absolute;z-index:99999;`,
                                });

                                currentTarget.insertAdjacentElement('afterbegin', iframe);
                            });

                            a.addEventListener('mouseleave', ({ currentTarget }) => {
                                $.all('#tt-stream-preview--iframe', currentTarget).map(iframe => iframe.remove());
                            });
                        });
                    });

                const ready = (true
                    // There is a valid username
                    && defined(USERNAME)

                    // The follow button exists
                    && $.defined(`[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]`)

                    // There are channel buttons on the side
                    && parseBool($.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label]')?.length)

                    // There isn't an advertisement playing
                    && nullish(sadOverlay)
                    && nullish(adCountdown)

                    // There are proper containers
                    && (false
                        // There is a message container
                        || $.defined('[data-test-selector$="message-container"i]')

                        // There is an ongoing search
                        || (true
                            && $.defined('[data-test-selector*="search-result"i][data-test-selector$="name"i]')
                            && $.defined('[data-a-target^="threads-box-"i]')
                        )

                        // The page is a channel viewing page
                        // || /^((?:Channel|Video)Watch|(?:Squad)Stream)Page$/i.test($('#root')?.dataset?.aPageLoadedName)

                        // There is an error message
                        || $.defined('[data-a-target*="error"i][data-a-target*="message"i], [data-test-selector*="content"i][data-test-selector*="overlay"i]')

                        // There is a "muted segments" warning
                        || $.defined('[data-test-selector*="muted"i][data-test-selector*="overlay"i]')
                    )
                );

                if(!ready)
                    return when.defined(() => $('[data-a-target*="ad-countdown"i]'))
                        .then(countdown => {
                            if(ready || defined(VIDEO_AD_COUNTDOWN))
                                return;

                            let { count = 1, time = 15 } = (/(?:(?<count>\d+)\D+)?(?<time>(?<minute>\d{1,2})(?<seconds>:[0-5]\d))/.exec(countdown.textContent)?.groups ?? {});

                            if('00:00'.contains(time))
                                return;

                            count = parseInt(count);
                            time = (parseTime(time) + 10).floorToNearest(15);

                            NORMALIZED_AD_COUNTER_CURRENT = count;

                            alert.timed(`${ Manifest.name } will resume after the ad-break.`, VIDEO_AD_COUNTDOWN = count * time);
                        });

                Runtime.sendMessage({ action: 'CLAIM_UP_NEXT' }, async info => top.UP_NEXT_ALLOW_THIS_TAB = UP_NEXT_ALLOW_THIS_TAB = info?.owner ?? true);

                $log("Main container ready");

                // Set the user's language
                const [documentLanguage] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toLowerCase().split('-');

                window.LANGUAGE = LANGUAGE = Settings.user_language_preference || documentLanguage;

                // Give the storage 3s to perform any "catch-up"
                wait(3000, ready).then(async ready => {
                    await Initialize(ready)
                        .then(() => {
                            // TTV Tools has the max Timer amount to initilize correctly...
                            const REINIT_JOBS =
                                when(() => {
                                    const NOT_LOADED_CORRECTLY = []
                                        , ALL_LOADED_CORRECTLY = (true
                                            // Lurking
                                            && parseBool(
                                            parseBool(Settings.away_mode)
                                                ? (false
                                                    || $.defined('#away-mode')
                                                    // No player to put the button on (an offline channel)
                                                    || $.nullish('[data-a-target="player-controls"i]')
                                                    // A stream that has ended: Away Mode waits for the next one
                                                    || (!STREAMER.live && !/\/videos?\//i.test(location.pathname))
                                                    // "Do not display" (the default placement): there's no button to find
                                                    || (Settings.away_mode_placement ?? 'null') == 'null'

                                                    || !NOT_LOADED_CORRECTLY.push('away_mode')
                                                )
                                                : true
                                            )

                                            // Auto-Claim Bonuses
                                            && parseBool(
                                            parseBool(Settings.auto_claim_bonuses)
                                                ? (false
                                                    || $.defined('#tt-auto-claim-bonuses')
                                                    || $.nullish('[data-test-selector*="balance-string"i]')
                                                    || parseBool(Settings.view_mode)
                                                    || STREAMER.veto

                                                    || !NOT_LOADED_CORRECTLY.push('auto_claim_bonuses')
                                                )
                                                : true
                                            )

                                            // Up Next
                                            && parseBool(
                                            !parseBool(Settings.first_in_line_none)
                                                ? (false
                                                    || $.defined('[up-next--container]')

                                                    || !NOT_LOADED_CORRECTLY.push('first_in_line')
                                                )
                                                : true
                                            )

                                            // Watch Time
                                            && parseBool(
                                            parseBool(Settings.watch_time_placement)
                                                ? (false
                                                    || $.defined('#tt-watch-time')
                                                    // Placed next to the live timer; there's none when offline
                                                    || $.nullish('.live-time')

                                                    || !NOT_LOADED_CORRECTLY.push('watch_time_placement')
                                                )
                                                : true
                                            )

                                            // Channel Points Receipt
                                            && parseBool(
                                            parseBool(Settings.points_receipt_placement)
                                                ? (false
                                                    || $.defined('#tt-points-receipt')
                                                    // Placed next to the live timer; there's none when offline
                                                    || $.nullish('.live-time')

                                                    || !NOT_LOADED_CORRECTLY.push('points_receipt_placement')
                                                )
                                                : true
                                            )
                                        );

                                    if(false
                                        // This page shouldn't be touched...
                                        || RESERVED_TWITCH_PATHNAMES.test(location.pathname)

                                        // Everything loaded just fine
                                        || ALL_LOADED_CORRECTLY
                                    )
                                        return PAGE_IS_READY = !clearInterval(REINIT_JOBS);

                                    $warn(`The following did not activate properly: ${ NOT_LOADED_CORRECTLY }. Reloading...`);

                                    for(const job of NOT_LOADED_CORRECTLY)
                                        if(defined(job))
                                            RestartJob(job, 'FAILED_TO_ACTIVATE');

                                    if(parseBool(Settings.recover_pages)) {
                                        if(++RECOVERY_TRIALS <= 10)
                                            return false;

                                        // Reload once per page every 5 minutes at most; a page that still can't load its
                                        // features after that would otherwise reload forever
                                        const RELOADED = JSON.parse(sessionStorage.getItem('ttv-tools:reinit-reload') || '{}');

                                        // Don't stop watching, though: the jobs above keep restarting until they load (e.g. Up
                                        // Next once an offline channel goes live), as v5 did; only the reload waits
                                        if(RELOADED.path == location.pathname && (+new Date - RELOADED.at) < 300_000) {
                                            if(!PAGE_IS_READY)
                                                $warn(`Still not activated after a reload: ${ NOT_LOADED_CORRECTLY }. Retrying without reloading.`);

                                            PAGE_IS_READY = true;

                                            return false;
                                        }

                                        sessionStorage.setItem('ttv-tools:reinit-reload', JSON.stringify({ path: location.pathname, at: +new Date }));
                                        addReport(NOT_LOADED_CORRECTLY.map(fail => ({ [`fail-to-load-${ fail }`]: true })), true);

                                        return false;
                                    }

                                    // Failed to activate job at...
                                    // addReport({ 'TTV-Tools-failed-to-load-module': new Date().toString() }, true);

                                    return ready;
                                }, Math.max(...Object.values(Timers))).then(ready => Initialize.ready = ready);
                        });

                    // Handle coin related bulletins
                    setInterval(async() => {
                        const { sole, name, fiat } = STREAMER;
                        const line = $('[data-test-selector="user-notice-line"i]:not([data-uuid])');

                        if(nullish(line))
                            return;

                        let [head, body] = line.children
                            , type = 'unknown';

                        if($.defined(`img[class*="channel-points"i][class*="icon"i][alt="${ fiat }"i], [class*="channel-points"i][class*="icon"i] svg`, head))
                            type = 'coin';
                        else if($.defined(`a[target="_blank"i]:is([rel~="noopener"i], [rel~="noreferrer"i])`))
                            type = 'shoutout';

                        const [user] = ($('[data-a-target$="username"i]', body) || head).textContent.split(' ');

                        const badges = $.all('img.chat-badge', body).map(badge => badge.alt.toLowerCase() + badge.src.replace(/^.*?\/(?:v(\d+))\/.*$/i, '/$1'))
                            , color = Color.destruct($('[data-a-target$="username"i]', body)?.style?.color || '#9147FF').HEX
                            , mod = +STREAMER.perm.is('mod')
                            , sub = +STREAMER.paid
                            , shopID = await STREAMER.shop.find(entry => (true
                                && head.textContent.contains(entry.title)
                                && head.textContent.contains(comify(entry.cost))
                            ))?.id
                            , spotlight = $('a[target="_blank"i]', body)?.textContent;

                        line.dataset.uuid = UUID.from(line.getPath());

                        let data = `@color=${ color };display-name=${ user };login=${ user.toLowerCase() };mod=${ mod };msg-id=pointsredeemed;<!>;subscriber=${ sub } :tmi.twitch.tv USERNOTICE #${ name } :${ [head, body].filter(defined).map(element => element.innerText.trim().replace(/\s+/g, ' ')).join(' ') }`;

                        if(defined(shopID))
                            data = data.replace('<!>', `msg-param-shop-id=${ shopID }`);
                        else if(defined(spotlight))
                            data = data.replace('<!>', `msg-param-spotlight=${ spotlight }`);
                        data = data.replace('<!>;', '');

                        TTV_IRC.socket?.reflect?.({ data });
                    }, 100);

                    // Handle saved states...
                    wait(1000).then(() => {
                        const { mini = '' } = parseURL(location).searchParameters;

                        if(mini.length)
                            MiniPlayer = mini;
                    });
                });

                PAGE_CHECKER = clearInterval(PAGE_CHECKER);

                window.MAIN_CONTROLLER_READY = true;

                // Observe the volume changes
                VolumeObserver: {
                    $.all(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls *:is([data-a-target*="volume"i], [data-a-target*="mute"i])')
                        .map(element => {
                            element.addEventListener('mousedown', ({ currentTarget, isTrusted }) => {
                                currentTarget.closest('.player-controls').dataset.isTrusted = isTrusted;

                                for(const [name, callback] of GetVolume.__onchange__)
                                    callback(currentTarget.value, { isTrusted });
                            });

                            element.addEventListener('mouseup', ({ currentTarget, isTrusted }) => {
                                currentTarget.closest('.player-controls').dataset.isTrusted = isTrusted;

                                for(const [name, callback] of GetVolume.__onchange__)
                                    callback(currentTarget.value, { isTrusted });
                            });

                            element.addEventListener('change', ({ currentTarget, isTrusted }) => {
                                currentTarget.closest('.player-controls').dataset.isTrusted = isTrusted;

                                for(const [name, callback] of GetVolume.__onchange__)
                                    callback(currentTarget.value, { isTrusted });
                            });
                        });
                }

                // Set the SVGs' section IDs
                SectionLabeling: {
                    const conversions = {
                        favorite: [
                            'followed',
                        ],

                        video: [
                            'related',
                            'suggested',
                        ],

                        people: [
                            'watch-channel-trailer',
                            'friends',
                        ],

                        inform: [
                            'live-reminders',
                        ],

                        checkmark: [
                            'live-reminders',
                        ],

                        rewind: [
                            'rewind-stream',
                        ],

                        crown: [
                            'prime-subscription',
                        ],

                        button_2to1_transparent: [
                            'theatre-mode-off'
                        ],

                        button_2to1_opaque: [
                            'theatre-mode-on'
                        ],
                    };

                    for(const container of $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label], .about-section__actions > * > *, [data-target^="channel-header"i] button, :is([data-test-selector*="video-player"i], [data-test-selector*="video-container"i]) button')) {
                        const svg = $('svg', container);

                        if(nullish(svg))
                            continue;

                        comparing:
                        for(const glyph in Glyphs)
                            if(Glyphs.__exclusionList__.contains(glyph))
                                continue comparing;
                            else if(conversions[glyph]?.length)
                                resemble(svg.toImage())
                                    .compareTo(Glyphs.modify(glyph, { height: '20px', width: '20px' }).asNode.toImage())
                                    .ignoreColors()
                                    .scaleToSameSize()
                                    .onComplete(async data => {
                                        let { analysisTime, misMatchPercentage } = data;

                                        analysisTime = parseInt(analysisTime);
                                        misMatchPercentage = parseFloat(misMatchPercentage);

                                        const matchPercentage = 100 - misMatchPercentage;

                                        if(matchPercentage < 80 || container.getAttribute('tt-svg-label')?.length)
                                            return;

                                        const family = conversions[glyph].pop();

                                        if(!family)
                                            return;

                                        // $notice(`Labeling section "${ family[family.length - 1] }" (${ matchPercentage }% match | "${ glyph }")...`, container);

                                        container.setAttribute('tt-svg-label', family);

                                        if(family.missing('-mode-'))
                                            return;

                                        // Auto-toggle
                                        const observer = new MutationObserver(function(mutations) {
                                            for(const { target, attributeName, oldValue } of mutations) {
                                                if(attributeName.unlike('aria-label'))
                                                    continue;

                                                let [state, ...name] = target.getAttribute('tt-svg-label').split('-').reverse();

                                                name = name.reverse().join('-');

                                                target.setAttribute('tt-svg-label', [name, ['on', 'off'][+state.equals('on')]].join('-'));
                                            }
                                        });

                                        observer.observe(container, { attributes: true, subtree: true });
                                    });
                    }

                    // Twitch's side-nav sections no longer carry an icon to match: find "followed" by its cards (#42)
                        // The cards only exist while the nav is expanded, and Twitch re-renders sections: keep checking
                    top.FOLLOWED_SECTION_LABELER ??= setInterval(() => {
                        for(const container of $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label]:not([tt-svg-label])'))
                            if($.defined('[data-a-id^="followed-channel"i], [data-test-selector="followed-channel"i]', container))
                                container.setAttribute('tt-svg-label', 'followed');
                    }, 1000);
                } // :SectionLabeling

                top.onlocationchange = () => {
                    $warn("[Parent] Re-initializing...");

                    Balloon.get('Up Next')?.remove();

                    // Do NOT soft-reset ("turn off, turn on") these settings
                    // They will be destroyed, including any data they are using
                    const VOLATILE = window.VOLATILE = ['first_in_line*'].map(AsteriskFn);

                    DestroyingJobs:
                    for(const job in Jobs)
                        if(~VOLATILE.findIndex(name => name.test(job)))
                            continue DestroyingJobs;
                        else
                            RestartJob(job, 'job-destruction');

                    Reinitialize:
                    if(NORMAL_MODE) {
                        if(parseBool(Settings.keep_popout)) {
                            PAGE_CHECKER ??= setInterval(WAIT_FOR_PAGE, 500);

                            // Save states...
                            const states = {
                                mini: (MiniPlayer?.dataset?.name),
                                redo: (parseURL(window.location).searchParameters?.redo ?? ''),
                            };

                            for(const key in states)
                                if(parseBool(states[key]))
                                    addToSearch({ [key]: states[key] });

                            break Reinitialize;
                        }

                        ReloadPage();
                    }
                };

                // Add custom styling
                CustomCSSInitializer: {
                    const [accent, contrast] = (Settings.accent_color || 'blue/12').split('/');

                    AddCustomCSSBlock('tools.js', `
                    :root {
                        --user-accent-color: var(--color-${ accent });
                        --user-contrast-color: var(--color-${ accent }-${ contrast });
                        --user-complement-color: var(--channel-color-opposite);

                        /* z-index meanings */
                        --always-on-top:    9999;
                        --normal:           999;
                        --always-on-bottom: 99;
                        --baseline:         9;
                    }

                    /* Little fixes */
                    .social-media-link {
                        min-width: 20rem;
                    }

                    /* First Run */
                    .tt-first-run {
                        background-color: var(--color-blue);
                        border-radius: 3px;

                        transition: background-color 1s;
                    }

                    [animationID] a { cursor: grab }
                    [animationID] a:active { cursor: grabbing }

                    [class*="theme"i][class*="dark"i] [tt-light], [class*="theme"i][class*="dark"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-w-4) !important }
                    [class*="theme"i][class*="light"i] [tt-light], [class*="theme"i][class*="light"i] [class*="chat"i][class*="status"i] { background-color: var(--color-opac-b-4) !important }

                    /* Keyborad Shortcuts */
                    .tt-extra-keyboard-shortcuts td {
                        padding: 0.5rem;
                    }

                    .tt-extra-keyboard-shortcuts td:first-child {
                        text-align: left;
                    }

                    .tt-extra-keyboard-shortcuts td:last-child {
                        text-align: right;
                    }

                    /* Up Next */
                    [up-next--body] {
                        background-color: var(--user-accent-color);
                        border-radius: 0.5rem;
                        color: var(--color-hinted-grey-${ contrast });
                    }

                    [up-next--body][empty="true"i] {
                        background-image: url("${ Runtime.getURL('up-next-tutorial.png') }");
                        background-repeat: no-repeat;
                        background-size: 35rem;
                        background-position: bottom center;
                    }

                    [class*="theme"i][class*="dark"i] [up-next--body][empty="true"i]:is([tt-mix-blend$="contrast"i]) {
                        /* background-blend-mode: color-burn; */
                    }

                    [class*="theme"i][class*="light"i] [up-next--body][empty="true"i]:is([tt-mix-blend$="contrast"i]) {
                        /* background-blend-mode: darken; */
                    }

                    [up-next--body][allowed="false"i] {
                        background-image: url("${ Runtime.getURL('256.png') }") !important;
                        background-repeat: repeat !important;
                        background-size: 5rem !important;
                        background-position: center center !important;
                        background-blend-mode: difference !important;
                    }

                    #up-next-boost[speeding="true"i] {
                        animation: fade-in 1s alternate infinite;
                    }

                    /* Live Reminders */
                    #tt-reminder-listing:not(:empty) ~ [live] { display:none }

                    .tt-time-elapsed {
                        color: var(--color-text-live);
                        text-shadow: 0 0 3px var(--color-background-base);

                        float: right;
                    }

                    /** Old CSS...
                    #tt-reminder-listing:not(:empty)::before, #tt-reminder-listing:not(:empty)::after {
                        animation: fade-in 1s 1;

                        display: block;
                        text-align: center;

                        margin: 0.5em 0px;

                        width: 100%;
                    }

                    #tt-reminder-listing:not(:empty)::before { content: "Live Reminders" }
                    #tt-reminder-listing:not(:empty)::after { content: "Up Next" }
                    */

                    /* Auto-Focus */
                    [tt-auto-claim-enabled="false"i] { --filter: grayscale(1) }

                    [tt-auto-claim-enabled] .text, [tt-auto-claim-enabled] #tt-auto-claim-indicator { font-size: 2rem; transition: all .3s }
                    [tt-auto-claim-enabled="false"i] .text { margin-right: -4rem }
                    [tt-auto-claim-enabled="false"i] #tt-auto-claim-indicator { margin-left: 2rem !important }

                    [tt-auto-claim-enabled] svg, [tt-auto-claim-enabled] img { transition: transform .3s ease 0s }
                    [tt-auto-claim-enabled] svg[hover="true"i], [tt-auto-claim-enabled] img[hover="true"i] { transform: translateX(0px) scale(1.2) }

                    #tt-auto-focus-stats:not(:hover) ~ #tt-auto-focus-differences {
                        opacity: 0.7;
                        margin-top: -100%;
                    }

                    .tt-emote-captured [data-test-selector="badge-button-icon"i],
                    .tt-emote-bttv [data-test-selector="badge-button-icon"i] {
                        left: 0;
                        top: 0;
                    }

                    [tt-live-status-indicator] {
                        background-color: var(--color-hinted-grey-6);
                        border-radius: var(--border-radius-rounded);
                        width: 0.8rem;
                        height: 0.8rem;
                        display: inline-block;
                        position: relative;
                    }

                    [tt-live-status-indicator="true"i] { background-color: var(--color-fill-live) }

                    /* Change Up Next font color */
                    [class*="theme"i][class*="dark"i] [tt-mix-blend$="contrast"i] { /* mix-blend-mode:lighten */ }
                    [class*="theme"i][class*="light"i] [tt-mix-blend$="contrast"i] { /* mix-blend-mode:darken */ }

                    /* Lurking */
                    #away-mode svg[id^="tt-away-mode"i] {
                        display: inline-block;

                        transform: translateX(0px) scale(1);
                        transition: all 100ms ease-in;
                    }

                    #tt-away-mode--hide {
                        position: absolute;
                    }

                    #tt-away-mode--hide, #tt-away-mode--show {
                        fill: var(--color-text-base);
                    }

                    [tt-away-mode-enabled="true"i] #tt-away-mode--hide, [tt-away-mode-enabled="false"i] #tt-away-mode--show, svg[id^="tt-away-mode"i][preview="false"i] {
                        opacity: 0;
                    }

                    svg[id^="tt-away-mode"i][preview="true"i] {
                        opacity: 1 !important;
                        transform: translateX(0px) scale(1.2) !important;
                    }

                    /* Rich tooltips */
                    [role] [data-popper-placement="right-start"i] [role] {
                        width: max-content;
                    }

                    [role="tooltip"i][class*="tt-tooltip"i] {
                        white-space: normal;

                        max-width: 50em;
                        width: max-content;
                    }

                    /* Bits */
                    [aria-describedby*="bits"i] [data-test-selector*="wrapper"i], [aria-labelledby*="bits"i] [data-test-selector*="wrapper"i] {
                        max-width: 45rem;
                    }

                    /* Stream Preview */
                    .tt-stream-preview {
                        border-radius: 0.6rem;
                        box-shadow: #000 0 4px 8px, #000 0 0 4px;
                        display: block;
                        visibility: visible;

                        transition: all 0.5s ease-in;

                        position: fixed;
                        margin-left: 7rem;
                        z-index: 999;

                        height: 9rem;
                        width: 16rem;
                    }

                    .tt-stream-preview--poster {
                        background-color: #0008;
                        background-size: cover;
                        border-radius: inherit;
                        display: block;

                        transition: all 1.5s ease-in;

                        position: absolute;
                        margin: 0;
                        padding: 0;
                        left: 0;
                        top: 0;
                        z-index: 999;

                        height: 100% !important;
                        width: 100% !important;
                    }

                    #tt-stream-preview--iframe {
                        display: block;
                        border-radius: inherit;
                        opacity: 1;
                        visibility: inherit;
                    }

                    .invisible {
                        opacity: 0;
                    }

                    .tt-stream-preview[data-vods][data-position="above"i]::after, .tt-stream-preview[data-vods][data-position="below"i]::before {
                        content: "Choose VOD (↑ / ↓)";

                        background-color: var(--color-background-tooltip);
                        border-radius: .4rem;
                        color: var(--color-text-tooltip);
                        display: inline-block;
                        font-family: inherit;
                        font-size: 100%;
                        font-weight: 600;
                        line-height: 1.2;
                        padding: .5rem;
                        pointer-events: none;
                        text-align: left;
                        user-select: none;
                        white-space: nowrap;

                        position: absolute;
                        left: 50%;
                        transform: translate(-50%,0);
                        z-index: 9999;

                        animation: 1s fade-out 1 forwards 7s;
                    }

                    .tt-stream-preview[data-vods="false"i][data-position="above"i]::after, .tt-stream-preview[data-vods="false"i][data-position="below"i]::before {
                        content: "Send to miniplayer (z) \\b7  Add to Live Reminders (r)";
                    }

                    :is(video, [class*="video"i][class*="render"i]) ~ * .player-controls :is([data-a-target*="mute"i] svg, [data-test-selector*="fill-value"i], [data-a-target$="slider"i]::-webkit-slider-thumb, [data-a-target$="slider"i]::-moz-range-thumb) {
                        transition: all 1s;
                    }

                    :is(video, [class*="video"i][class*="render"i]) ~ * .player-controls[data-automatic="true"i] [data-a-target*="mute"i] svg {
                        fill: var(--color-warn);
                    }

                    :is(video, [class*="video"i][class*="render"i]) ~ * .player-controls[data-automatic="true"i] [data-test-selector*="fill-value"i] {
                        background-color: var(--color-warn);
                    }

                    :is(video, [class*="video"i][class*="render"i]) ~ * .player-controls[data-automatic="true"i] :is([data-a-target$="slider"i]::-webkit-slider-thumb, [data-a-target$="slider"i]::-moz-range-thumb) {
                        border: var(--border-width-default) solid var(--color-warn);
                        background-color: var(--color-warn);
                    }

                    [data-test-selector="picture-by-picture-player-background"i] ~ [data-test-selector="picture-by-picture-player-background"i] {
                        display: none !important;
                    }

                    /* Chat */
                    [class*="chat-list"i] [class*="simple"i] {
                        overflow-x: hidden !important;

                        margin-bottom: -14px !important;
                    }

                    /* Ads */
                    [class*="stream"][class*="-ad"i] {
                        display: none !important;
                    }
                `);
                } // :CustomCSSInitializer

                // Update the settings
                SettingsInitializer: {
                    switch(Settings.onInstalledReason) {
                        // Is this the first time the extension has run?
                        // If so, then point out what's been changed
                        case INSTALL: {
                            // Detect the user's desired language
                                // Capitalizing the language code notifies the Settings page the code was not manually input
                            const [user_language_preference] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toUpperCase().split('-');

                            Settings.set({ user_language_preference });

                            // Point out the newly added buttons
                            wait(10_000).then(() => {
                                for(const element of $.all('#tt-auto-claim-bonuses, [up-next--container]'))
                                    element.classList.add('tt-first-run');

                                const style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px', fill: '#ff9ab4' });

                                // Make sure the user goes to the Settings page
                                alert
                                    .timed(`Please visit the <a href="#" onmouseup="top.postMessage({action:'open-options-page'})">Settings</a> page or click the ${ Glyphs.modify('channelpoints', { style, ...style.toObject() }) } to finalize setup`, 30_000, true)
                                    .then(action => $.all('.tt-first-run').forEach(element => element.classList.remove('tt-first-run')));
                            });
                        } break;
                    }

                    Settings.set({ onInstalledReason: null });
                }

                // Jump some frames
                FrameJumper: {
                    document.head.append(
                    furnish('script', {
                        src: Runtime.getURL('ext/jump.js'),
                        onload() {
                            // Do something when the data is jumped...
                        },
                    })
                    );
                }

                // Add message listeners; wait until the page is ready before adding this to ensure the background script can handle bad instances properly //
                // Receive messages from the background service worker
                Runtime.onMessage.addListener(async(request, sender, respond) => {
                    if(sender.id.unlike(Runtime.id))
                        return /* Not meant for us... */;

                    const R = RegExp;

                    switch(request?.action) {
                        case 'heap-audit': {
                            respond({ ok: true, results: [window.performance?.memory?.usedJSHeapSize | 0, window.performance?.now?.() | 0] });
                        } break;

                        case 'notify': {
                            $notice(request.message);
                            confirm.timed(request.message, (request.timeout | 0) || 15e3)
                                .then(answer => {
                                    // Is this tab active: taking input, hovering a link, or contains an active element?
                                    const meta = {
                                        isOkay: (answer == true),
                                        isDeny: (answer === false),
                                        isDead: (answer == null),
                                        isActive: $.defined('input:focus, a:hover, *:active'),
                                    };

                                    // OK
                                    if(answer)
                                        Runtime.sendMessage({ action: request.onAccept, meta });
                                    // Cancel
                                    else if(answer === false)
                                        Runtime.sendMessage({ action: request.onDeny, meta });
                                    // Timeout
                                    else
                                        Runtime.sendMessage({ action: request.onIgnore, meta });
                                });
                        } break;

                        case 'report-back': {
                            respond({ ok: true, performance: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize), timestamp: +new Date });
                        } break;

                        case 'consume-up-next': {
                            let { next, obit } = request
                                , name = parseURL(next).pathname?.slice(1);

                            if(nullish(name))
                                return;

                            $notice(`Job stolen "${ name }" by "${ obit }" tab`);

                            // Can't be the next user if the job was stolen...
                            if(top.GetNextStreamer?.cachedStreamer?.name?.equals(name))
                                top.GetNextStreamer.cachedStreamer = null;

                            when.defined(name => $(`[id^="tt-balloon-job"i][name="${ name }"i]`), 100, name)
                                .then(element => {
                                    $('button[class*="del-btn"i]', element)?.click();
                                });
                        } break;

                        case 'reload': {
                            if(UP_NEXT_ALLOW_THIS_TAB || request.forced) {
                                Cache.load([`Watching`], ({ Watching }) => {
                                    Watching = Watching.filter(p => p.unlike(NORMALIZED_PATHNAME));

                                    Cache.save({ Watching });
                                });

                                await top.beforeleaving?.(new CustomEvent('locationchange', { from: NORMALIZED_PATHNAME, to: NORMALIZED_PATHNAME, persisted: document.readyState.unlike('unloading') }));

                                respond({ ok: true });
                            } else {
                                respond({ ok: false })
                            }
                        } break;

                        case 'close': {
                            Cache.load([`Watching`], ({ Watching }) => {
                                Watching = Watching.filter(p => p.unlike(NORMALIZED_PATHNAME));

                                Cache.save({ Watching });
                            });

                            await top.beforeleaving?.(new CustomEvent('locationchange', { from: NORMALIZED_PATHNAME, to: '', persisted: document.readyState.unlike('unloading') }));

                            respond({ ok: true });

                            wait(500).then(() => window.close());
                        } break;

                        case 'update-pinned-streamer': {
                            $log("Updating pinned streamer...", request);

                            when.defined(() => top.GetNextStreamer).then(_ => {
                                const imgSize = '70px';

                                unpin: if(defined(request.oldValue?.name)) {
                                    const pidged = $(`.tt-pinnable [data-name="${ request.oldValue.name }"i]`);

                                    delete _.pinnedStreamer;
                                    $('#pinned-streamer').innerHTML = Glyphs.pinned;

                                    if(nullish(pidged))
                                        break unpin;

                                    pidged.dataset.pinned = false;
                                    pidged.closest('.tt-pinnable').modStyle(`background:var(--color-background-base);`);
                                    $('.tt-balloon-message strong', pidged).modStyle(`color:!delete`);
                                    $('strong', pidged).html(`${ name } &bull; Click to pin \uD83D\uDCCC`);

                                    pidged.closest('form')?.insertAdjacentElement('afterend', pidged.closest('.tt-pinnable'));
                                }

                                pin: if(defined(request.newValue?.name)) {
                                    const currentTarget = $(`.tt-pinnable [data-name="${ request.newValue.name }"i]`);

                                    _.pinnedStreamer = request.newValue.name;
                                    $('#pinned-streamer')?.html(furnish(`.tt-border-radius-rounded`).with(furnish.img({ src: request.newValue.icon, style: `min-width:calc(${ imgSize }/2); border-radius:${ imgSize }` })).outerHTML);

                                    if(nullish(currentTarget))
                                        break pin;

                                    currentTarget.dataset.pinned = true;
                                    currentTarget.closest('.tt-pinnable').modStyle(`background:var(--color-background-chat);`);
                                    $('.tt-balloon-message strong', currentTarget).modStyle(`color:var(--color-amazon)`);
                                    $('strong', currentTarget).html(`${ name } &bull; Pinned. Click to unpin`);

                                    currentTarget.closest('[id$="listing"i]').querySelector('form')?.insertAdjacentElement('beforeend', currentTarget.closest('.tt-pinnable'));

                                    Cache.save({ PinnedStreamer: _.pinnedStreamer });
                                } else {
                                    Cache.remove(['PinnedStreamer'])
                                }
                            });
                        } break;
                    } // switch request?.action
                });

                // Lag reporter
                Runtime.sendMessage({ action: `${ (Settings.auto_tab_reloads ? 'BEGIN' : 'WAIVE') }_REPORT` });
            }, 500);
    });

    document.body.onload = event => {
        // Move on from banned/moved channels
        AntiTimeMachine:
        when.defined(() => $('main [data-a-target*="error"i][data-a-target*="message"i] ~ * [href$="directory"i]'))
            .then(() => {
                const ErrorMessage = $('main [data-a-target*="error"i][data-a-target*="message"i]')?.textContent;

                when.defined(() => $(`[id*="side"i][id*="nav"i] .side-nav-section a:not([href$="${ PATHNAME }"i])`))
                    .then(channel => {
                        $warn(`${ location.pathname.slice(1) } is not available: ${ ErrorMessage }\nHeading to ${ channel.href }`);

                        goto(channel.href);
                    });
            });

        // Color compontents
        ColorComponents:
        if($.nullish('#tt-custom-css')) {
            let color = window
                ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                ?.getPropertyValue?.('--color-accent');

            color = Color.destruct(color || '#9147FF');

            AddCustomCSSBlock('Color Components', `:root { --user-accent-color:${ color.HSL }; --user-complement-color:hsl(${ [color.H + 180, color.S, color.L].map((v, i) => v + '%deg'.slice(+!i, 1 + 3 * !i)) }) }`);
        }

        // Alerts for users
        DisplayNews:
        Cache.load('ReadNews', async({ ReadNews }) => {
            const TTVToolsNewsURL = `https://github.com/Ephellon/Twitch-Tools/wiki/News?fetched-at=${ +new Date }`
                , TTVToolsNewsArticles = ReadNews || [];

            fetchURL(TTVToolsNewsURL)
                .then(r => r.text())
                .then(html => {
                    const dom = (new DOMParser).parseFromString(html, 'text/html');

                    return $('#wiki-body', dom)?.children ?? [];
                })
                .then(([main, footer]) => {
                    if(nullish(main))
                        return;

                    const articles = main.getAllElementsByText(/(\d{4}-\d{2}-\d{2})/)
                        .filter(({ tagName }) => /^h\d$/i.test(tagName))
                        .map(header => {
                            const content = [];

                            let e = header;

                            while(defined(e = e.nextElementSibling) && !/^h\d$/i.test(e.tagName))
                                content.push(e);

                            return { header, content };
                        }).map(({ header, content }) => {
                            const articleID = UUID.from(header.textContent, true).value;

                            if(TTVToolsNewsArticles.contains(articleID))
                                return;
                            if(!content?.length)
                                return;
                            TTVToolsNewsArticles.push(articleID);

                            header.textContent = new Date(header.textContent).toLocaleDateString();

                            const article = furnish(`#tt-news-${ articleID }`).with(
                                furnish('details.details').with(
                                    furnish('summary').with(header),
                                    ...content
                                )
                            );

                            $.all('a.anchor, svg.action-link', article).map(a => a.remove());
                            $.all('[href]').map(a => a.target = '_blank');

                            return article.outerHTML;
                        })
                        .filter(defined);

                    if(articles.length)
                        confirm.silent(`<input hidden controller icon="${ Glyphs.utf8.unread }" title="News" deny="Ignore"/> ${ articles.join('<br>') }`)
                            .then(ok => ok && Cache.save({ ReadNews: TTVToolsNewsArticles.isolate() }));
                });
        });

        // Observe chat & whispers
        let CHAT_SELF_REFLECTOR;

        CommsObserver: if(!RESERVED_TWITCH_PATHNAMES.test(location.pathname)) {
            let [CHANNEL] = location.pathname.toLowerCase().slice(1).split('/').slice(+IS_A_FRAMED_CONTAINER)
                , USERNAME = Search.cookies.login ?? `User_Not_Logged_In_${ +new Date }`;

            CHANNEL = `#${ CHANNEL }`;

            // Whispers come over Hermes, not IRC; one relay per tab (top frame only)
            if(!IS_A_FRAMED_CONTAINER)
                startWhisperRelay();

            // Simple WebSocket → https://dev.twitch.tv/docs/irc
            if(defined(TTV_IRC.socket))
                return;

            Object.defineProperty(TTV_IRC, 'wsURL', {
                value: `wss://irc-ws.chat.twitch.tv:443`,

                writable: false,
                enumerable: false,
                configurable: false,
            });

            let socket = (TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL));

            const START_WS = socket.onopen = event => {
                $log(`Chat Relay (main) connected to "${ CHANNEL }"`);

                // CONNECTING → 0; OPEN → 1; CLOSING → 2; CLOSED → 3
                when(() => socket.readyState === WebSocket.OPEN)
                    .then(() => {
                        socket.send(`CAP REQ :twitch.tv/commands twitch.tv/membership twitch.tv/tags`);
                        socket.send(`PASS oauth:${ Search.cookies.auth_token }`);
                        socket.send(`NICK ${ USERNAME.toLowerCase() }`);
                    });

                const restrictions = (TTV_IRC.restrictions ??= new Map);

                socket.onmessage = socket.reflect = CHAT_SELF_REFLECTOR = async event => {
                    const messages = event.data.trim().split('\r\n').map(TTV_IRC.parseMessage).filter(defined);

                    // $remark('Chat Relay received messages', messages);

                    for(const { command, parameters, source, tags } of messages) {
                        const channel = (command.channel ?? CHANNEL).toLowerCase();
                        const usable = parseBool(channel.equals(CHANNEL));

                        switch(command.command) {

                            // The signed-in viewer's state in this channel: keep their badges (TTV DSL `[badge]` at the top level)
                            case 'USERSTATE': {
                                Chat.viewerBadges = Object.keys(tags?.badges ?? {});
                            } break;

                            // Successful login attempt
                            case '001': {
                                socket.send(`JOIN ${ CHANNEL }`);
                                // @TODO | To be removed Feb 18, 2024 → https://dev.twitch.tv/docs/irc/chat-commands/#migration-guide
                                socket.send(`PRIVMSG ${ CHANNEL } :/mods`);
                                socket.send(`PRIVMSG ${ CHANNEL } :/vips`);
                            } break;

                            // PONG the server back...
                            case 'PING': {
                                socket.send(`PONG ${ parameters }`);
                            } break;

                            // Someone joined the server
                            case 'JOIN': {
                                // $log(`New user "${ source.nick }" on ${ channel }`);

                                Chat.gang.push(source.nick);
                            } break;

                            // Kicked!
                            case 'PART': {
                                // $warn(`Unable to relay messages from "${ source.nick }" on ${ channel }`);

                                if(USERNAME.equals(source.nick))
                                    socket.close();

                                Chat.gang = Chat.gang.filter(user => user.unlike(source.nick));
                            } break;

                            // Something happened...
                            case 'NOTICE': {
                                if('room_mods mod_success unmod_success no_mods vips_success vip_success unvip_success no_vips'.contains(tags?.msg_id)) {
                                    const msg = tags.msg_id
                                        , typ = msg.replace(/.*((?:mod|vip)s?).*/i, '$1').toLowerCase();

                                    if(msg.startsWith('no_'))
                                        /* Do nothing */;
                                    else if(/^(mod|vip)_/i.test(msg))
                                        Chat[typ].push(parameters.replace(/.*added\s+(\S+).*/i, '$1').toLowerCase());
                                    else if(/^un(mod|vip)_/i.test(msg))
                                        Chat[typ] = Chat[typ].filter(name => name.unlike(parameters.replace(/.*removed\s+(\S+).*/i, '$1')));
                                    else
                                        Chat[typ].push(...parameters.replace(/^[^:]*(.+?)\.?$/, ($0, $1, $$, $_) => $1.replace(/[:\s]+/g, '').toLowerCase()).split(','));
                                } else if('host_on host_off'.contains(tags?.msg_id)) {
                                    if(!usable)
                                        continue;

                                    when.defined(() => STREAMER)
                                        .then(() => {
                                            for(const callback of STREAMER.__eventlisteners__.onhost)
                                                when(() => PAGE_IS_READY, 250).then(() => callback({ hosting: parameters.toLowerCase().startsWith('now hosting') }));
                                        });
                                } else {
                                    if(/^((?:bad|msg|no|un(?:available|recognized))_|(?:invalid)|_(?:banned|error|limit|un(?:expected)))/i.test(tags?.msg_id))
                                        $warn(`There's an error on ${ channel }: ${ parameters }`, { command, parameters, source, tags });
                                    else
                                        $warn(`Something's happening on ${ channel }: ${ parameters }`, { command, parameters, source, tags });

                                    // socket.send(`PART ${ channel }`);
                                }
                            } break;

                            // Status(es) of the room
                            case 'ROOMSTATE': {
                                const { room_id, emote_only, followers_only, r9k, slow, subs_only } = tags;

                                restrictions.set(channel, {
                                    room_id,
                                    emote_only: parseBool(+emote_only),
                                    followers_only: (+followers_only > 0 ? +followers_only * 60_000 : !1),
                                    r9k: parseBool(+r9k),
                                    slow: (+slow * 1000),
                                    subs_only: parseBool(+subs_only),
                                });
                            } break;

                            // Something happened (alert)
                            case 'USERNOTICE': {
                                const { id, msg_id, system_msg } = tags;

                                const message = (system_msg ?? parameters).replace(/\\s/g, ' ')
                                    , mentions = message.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase())
                                    , subject = (
                                        'sub resub'.split(' ').contains(msg_id)
                                            ? 'dues'
                                            : 'giftpaidupgrade anongiftpaidupgrade'.split(' ').contains(msg_id)
                                                ? 'keep'
                                                : 'subgift rewardgift submysterygift rewardmysterygift'.split(' ').contains(msg_id)
                                                    ? 'gift'
                                                    : 'raid unraid'.split(' ').contains(msg_id)
                                                        ? 'raid' // incoming raids
                                                        : 'pointsredeemed'.split(' ').contains(msg_id)
                                                            ? 'coin'
                                                            // ritual (new_chatter, etc.); bitsbadgetier (100, 1000, 10000, etc.)
                                                            : 'note'
                                    )
                                    , element = when.defined((message, subject) =>
                                        // @TODO: get bullets via text content
                                        $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]) *:is(.tt-accent-region, [data-test-selector="user-notice-line"i], [class*="notice"i][class*="line"i], [class*="gift"i]:not([class*="count"i]), [data-test-selector="announcement-line"i], [class*="announcement"i][class*="line"i])')
                                            .find(element => {
                                                let A = message.mutilate();
                                                let B = element.textContent.mutilate();

                                                if(A.length < B.length)
                                                    [A, B] = [B, A];

                                                if(false
                                                    // The element already has a UUID and type
                                                    || (true
                                                        && element.dataset.uuid
                                                        && element.dataset.type
                                                    )
                                                    // The text matches less than 40% of the message
                                                    || A.slice(0, B.length).errs(B) > .6
                                                )
                                                    return false;

                                                if(subject?.equals('coin')) {
                                                    let I;

                                                    STREAMER.shop.map(item => {
                                                        if(true
                                                            && message.contains(item.title)
                                                            && item.title.mutilate().errs(A) < (I?.title?.mutilate()?.errs(A) ?? 1)
                                                            && item.available
                                                            && item.enabled
                                                            && !(item.hidden || item.paused)
                                                        )
                                                            I = item;
                                                    });

                                                    if(defined(I))
                                                        element.dataset.shopItemId = I.id;
                                                }

                                                element.dataset.uuid ||= UUID.from(element.getPath());
                                                element.dataset.type ||= subject;

                                                return message.mutilate().errs(element.textContent.mutilate()) < .2;
                                            })
                                    , 100, message, subject);

                                const results = {
                                    element,
                                    usable,
                                    message,
                                    subject,
                                    mentions,
                                    timestamp: new Date,

                                    // An incoming raid: who, and with how many (TTV DSL `raid` events; never an `unraid`)
                                    ...(msg_id == 'raid' ? { raider: (tags.msg_param_login ?? '').toLowerCase(), raid_size: parseInt(tags.msg_param_viewerCount) | 0 } : {}),

                                    // @TODO: see if there are extra `msg_id` values
                                    // msg_id,
                                };

                                Chat.__allbullets__.add(results);

                                for(const [name, callback] of Chat.__onbullet__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(const [name, callback] of Chat.__deferredEvents__.__onbullet__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 250, callback, results).then(([callback, results]) => callback(results));

                                for(const [name, callback] of Chat.__consumableEvents__.__onbullet__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onbullet__.delete(name);
                                        })
                                    );
                                }
                            } break; // switch command.command | 'USERNOTICE'

                            // The channel is hosting...
                            case 'HOSTTARGET': {
                                if(!usable)
                                    continue;

                                const [to, amount] = parameters.split(' ', 2);

                                when.defined(() => STREAMER)
                                    .then(() => {
                                        for(const callback of STREAMER.__eventlisteners__.onhost)
                                            when(() => PAGE_IS_READY, 250).then(() => callback({ hosting: to.unlike('-') }));
                                    });
                            } break;

                            // Got a message...
                            case 'PRIVMSG': {
                                // $remark('PRIVMSG:', { command, parameters, source, tags });

                                // Bot commands...
                                if(defined(command.botCommand)) {
                                    const results = { name: command.botCommand, arguments: command.botCommandParams };

                                    for(const [name, callback] of Chat.__oncommand__)
                                        when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                    for(const [name, callback] of Chat.__deferredEvents__.__oncommand__)
                                        when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                    for(const [name, callback] of Chat.__consumableEvents__.__oncommand__) {
                                        when(() => PAGE_IS_READY, 250).then(() =>
                                            callback(results).then(complete => {
                                                if(complete)
                                                    Chat.__consumableEvents__.__oncommand__.delete(name);
                                            })
                                        );
                                    }

                                    // A command is still a chat message: fall through to `onmessage` (TTV DSL scripts listen there)
                                }

                                const author = source.nick
                                    , badges = Object.keys(tags?.badges ?? {})
                                    , message = parameters.replace(/^([\u0001-\u0007\u000e-\u001f])((?:\w+)\s*)([^]+)\1$/g, '$3').trim()
                                    // Have to wait on the page to play catch-up...
                                    , element = when.defined((message, uuid) =>
                                        $.all('[data-test-selector$="message-container"i] [data-a-target$="message"i]')
                                            .find(div =>
                                                $.all(`[data-a-user="${ author }"i]`, div)
                                                    .map(div => div.closest('[data-test-selector$="message"i], [data-a-target$="message"i]'))
                                                    .filter(defined)
                                                    .find(div => {
                                                        const text = []
                                                            , body = $('[data-test-selector$="message-body"i], [class*="message-container"i]', div);

                                                        if(nullish(body))
                                                            return;

                                                        for(const child of $.all('[class*="username"i][class*="container"i] ~ :last-child > *', body))
                                                            if(child.dataset.testSelector?.contains('emote')) {
                                                                text.push($('img', child).alt)
                                                            } else if(child.dataset.aTarget?.contains('timestamp')) {
                                                                continue
                                                            } else if($.defined('var', child)) {
                                                                let { textContent } = child;

                                                                for(const v of $.all('var', child))
                                                                    textContent = textContent.replace(v.textContent, '');

                                                                child.textContent = textContent;
                                                            } else {
                                                                text.push(child.textContent)
                                                            }

                                                        const match = text.join('').mutilate(true).equals(message.mutilate(true));

                                                        if(match)
                                                            div.dataset.uuid = uuid;

                                                        return match;
                                                    })
                                            )
                                    , 100, message, tags.id)
                                    , emotes = Object.keys(tags.emotes ?? {}).map(key => {
                                        const emote = (tags.emotes[+key] || tags.emotes[key]).shift()
                                            , name = parameters.substring(+emote.startPosition, ++emote.endPosition)
                                            , url = `https://static-cdn.jtvnw.net/emoticons/v2/${ key }/default/${ THEME }/1.0`;

                                        Chat.__allemotes__.set(name, url);

                                        return name;
                                    })
                                    , handle = tags.display_name
                                    , mentions = parameters.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase())
                                    , raw = [(handle.unlike(author) ? `${ handle } (${ author })` : handle), message].join(': ')
                                    , reply = when.defined(e => e, 100, element).then(element => element?.querySelector('[class*="reply"i] button'))
                                    , style = `color: ${ tags.color || '#9147FF' };`
                                    , uuid = tags.id
                                    , sent = (new Date).toJSON();

                                const results = {
                                    raw,
                                    sent,
                                    uuid,
                                    reply,
                                    style,
                                    author,
                                    emotes,
                                    badges,
                                    handle,
                                    usable,
                                    element,
                                    message,
                                    mentions,
                                    timestamp: new Date,
                                    highlighted: when.defined(e => e, 100, element).then(element => parseBool(element.dataset.testSelector?.contains('notice'))),
                                };

                                Object.defineProperties(results, {
                                    deleted: {
                                        get:(async function() {
                                            return Promise.race([this, wait(100).then(() => null)]).then(self => {
                                                return (self === null) || nullish(self?.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [data-repetitive], [data-plagiarism])', self);
                                            });
                                        }).bind(element)
                                    },
                                });

                                Chat.__allmessages__.set(uuid, results);

                                for(const [name, callback] of Chat.__onmessage__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(const [name, callback] of Chat.__deferredEvents__.__onmessage__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(const [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onmessage__.delete(name);
                                        })
                                    );
                                }
                            } break; // switch command.command | 'PRIVMSG'

                            // Got a whisper
                            case 'WHISPER': {
                                const results = { unread: 1, from: channel, message: parameters, timestamp: new Date };

                                for(const [name, callback] of Chat.__onwhisper__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(const [name, callback] of Chat.__deferredEvents__.__onwhisper__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(const [name, callback] of Chat.__consumableEvents__.__onwhisper__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onwhisper__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            default: { continue }
                        } // switch command.command
                        ;
                    }
                };
            };

            socket.onerror = event => {
                $warn(`Chat Relay (main) failed to connect to "${ CHANNEL }" → ${ JSON.stringify(event) }`);

                socket = (TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL));
                START_WS(event);
            };

            socket.onclose = event => {
                $warn(`Chat Relay (main) closed unexpectedly → ${ JSON.stringify(event) }`);

                socket = (TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL));
                START_WS(event);
            };

            // The socket closed...
            when(() => TTV_IRC.socket?.readyState === WebSocket.CLOSED, 1000)
                .then(closed => {
                    $warn(`The WebSocket closed... Restarting in 5s...`);

                    wait(5000)
                        .then(() => {
                            if(parseBool(Settings.recover_chat))
                                return ReloadPage(true);
                            return TTV_IRC.socket = new WebSocket(TTV_IRC.wsURL);
                        })
                        .then(() => {
                            when(() => TTV_IRC.socket.readyState === WebSocket.OPEN, 500)
                                .then(() => TTV_IRC.socket.send(`JOIN ${ CHANNEL }`))
                                .then(() => TTV_IRC.socket.onmessage = TTV_IRC.socket.reflect = CHAT_SELF_REFLECTOR);
                        });
                });

            // Play catch-up...
            when.defined(() => $('[data-test-selector$="message-container"i]'), 100)
                .then(chat => {
                    const unhandled = $.all('[data-a-target="chat-line-message"i]:not([data-uuid])', chat);

                    for(const element of unhandled) {
                        let raw = $('[class*="message"i][class*="container"i]', element).textContent.trim().replace($('[data-a-target="chat-timestamp"]', element)?.textContent || '', '')
                            , uuid = UUID.from(raw).toString()
                            , reply = $('[class*="reply"i] button', element)
                            , style = $('[data-a-user]', element)?.getAttribute('style')?.trim()
                            , author = $('[data-a-user]', element).dataset.aUser
                            , emotes = new Set
                            , badges = new Set
                            , __bs__ = $.all('[class*="username"i][class*="container"i] [data-a-target*="badge"i] img', element).map(e => badges.add(e.alt.toLowerCase()))
                            , handle = $('[data-a-user]', element).textContent
                            , usable = false
                            , message = raw.replace(/^[^:]+?:/, '').trim()
                            , mentions = $.all('[data-a-target*="mention"i]', element).map(e => e.textContent)
                            , highlighted = parseBool(element.dataset.testSelector?.contains('notice'));

                        element.dataset.uuid = uuid;

                        emotes = [...emotes];
                        badges = [...badges];

                        const results = {
                            raw,
                            uuid,
                            reply,
                            style,
                            author,
                            emotes,
                            badges,
                            handle,
                            usable,
                            element,
                            message,
                            mentions,
                            highlighted,
                            deleted: $.defined('[data-a-target*="delete"i]', element),
                        };

                        Chat.__allmessages__.set(uuid, results);

                        for(const [name, callback] of Chat.__onmessage__)
                            when(() => PAGE_IS_READY, 250).then(() => callback(results));

                        for(const [name, callback] of Chat.__deferredEvents__.__onmessage__)
                            when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                        for(const [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                            when(() => PAGE_IS_READY, 250).then(() =>
                                callback(results).then(complete => {
                                    if(complete)
                                        Chat.__consumableEvents__.__onmessage__.delete(name);
                                })
                            );
                        }
                    }
                });
        } // :CommsObserver
    };
}
