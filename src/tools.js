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

let Queue = top.Queue = { balloons: [], bullets: [], bttv_emotes: [], emotes: [], messages: [], message_popups: [], popups: [] },
    Messages = top.Messages = new Map(),
    PostOffice = top.PostOffice = new Map(),
    UserMenuToggleButton, SignUpBanner,
    // These won't change (often)
    ACTIVITY,
    USERNAME,
    LANGUAGE,
    THEME,
    ANTITHEME,
    THEME__CHANNEL_DARK,
    THEME__CHANNEL_LIGHT,
    THEME__BASE_CONTRAST,
    THEME__PREFERRED_CONTRAST,
    LITERATURE,
    SPECIAL_MODE = $.defined('[data-test-selector="exit-button"i]'),
    NORMAL_MODE = !SPECIAL_MODE,
    // Hmm...
    JUMPED_FRAMES = false,
    JUMP_DATA = {},
    STASH_SAVED = false,
    UP_NEXT_ALLOW_THIS_TAB;

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
    top.WINDOW_STATE = (persisted? document.readyState: 'unloading');
};

// Twitch-wide errors
when(() => top.TWITCH_INTEGRITY_FAIL, 5_000).then(() => {
    let error = `<div hidden controller title="Twitch Integrity Fail" okay="OK" deny="OK. Do not show again">${ (new Date).toJSON() }</div>
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
let nth = (n, s = '') => {
    n += '';

    let c = (s = '') => {
        switch(s.trim()) {
            case 'ordinal-position': {
                switch(window.LANGUAGE) {
                    case 'bg': return ' място';
                    case 'cs': return ' místo';
                    case 'da': return ' plads';
                    case 'de': return ' Reihe';
                    case 'en': return ' in line';
                    case 'el': return ' θέση';
                    case 'es': return ' en línea';
                    case 'fi': return ' sija';
                    case 'fr': return 'ème en ligne';
                    case 'hu': return ' a sorban';
                    case 'it': return ' di fila';
                    case 'nl': return 'e in de rij';
                    case 'no': return ' i rekken';
                    case 'pl': return ' w kolejce';
                    case 'ro': return ' pe linie';
                    case 'ru': return ' в строке';
                    case 'sk': return ' v poradí';
                    case 'sv': return 'a i raden';
                    case 'tr': return ' sırada';
                    case 'vi': return ' trong dòng';

                    default: return '';
                }
            } break;

            default: switch(window.LANGUAGE) {
                case 'fr':
                case 'sv':
                    return 'e';
                case 'ro': return '';
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
    }

    return n;
}

// Returns a unique list of channels (used with `Array..filter`)
    // uniqueChannels(channel:object<Channel>, index:number, channels:array) → boolean
let uniqueChannels = (channel, index, channels) =>
    channels.filter(channel => defined(channel?.name)).findIndex(ch => ch.name === channel?.name) == index;

// Returns whether or not a channel is live (used with `Array..filter`)
    // isLive(channel:object<Channel>) → boolean
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
let PATHNAME = top.location.pathname,
    NORMALIZED_PATHNAME = PATHNAME
        // Remove common "modes"
        .replace(/^\/(?:moderator|popout)\/(\/[^\/]+?)/i, '$1')
        .replace(/^(\/[^\/]+?)\/(?:about|schedule|squad|videos)\b/i, '$1'),
    // The current streamer
    STREAMER,
    // The followed streamers (excluding STREAMER)
    STREAMERS,
    // All channels on the side-panel (excluding STREAMER)
    CHANNELS,
    // The currently searched-for channels (excluding STREAMER)
    SEARCH,
    SEARCH_CACHE = new Map(),
    // Visible, actionable notifications
    NOTIFICATIONS,
    // All channel commands
    COMMANDS = [],
    // All of the above
    ALL_CHANNELS;

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
                let f = furnish;
                let src = `https://player.twitch.tv/?channel=${ name }&controls=false&muted=true&parent=twitch.tv&quality=360p&private=true`;

                let pbyp = $('[class*="picture-by-picture-player"i] video'),
                    pip = $('#tt-pip-player');

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

                function keepOpen() {
                    when.defined(() => $('.picture-by-picture-player[class*="collapsed"i]'))
                        .then(player => {
                            let keep = $.defined('#tt-exit-pip');

                            if(keep)
                                player.classList.remove('picture-by-picture-player--collapsed');

                            return keep;
                        })
                        .then(keep => (keep? keepOpen(): null));
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

                let { dataRetrievedAt } = data;

                // If there isn't a proper date, remove the data...
                if(+dataRetrievedAt < 0)
                    return Cache.remove(key);

                let lastFetch = Math.abs(dataRetrievedAt - +new Date);

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
        let reload = false,
            refresh = [];

        for(let key in changes) {
            if(SPECIAL_MODE && !!~NORMALIZED_FEATURES.findIndex(feature => feature.test(key)))
                continue;

            let change = changes[key],
                { oldValue, newValue } = change;

            let name = key
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
                if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    $warn(`Disabling experimental feature: ${ name }`, new Date);
                else
                    $remark(`Disabling feature: ${ name }`, new Date);

                UnregisterJob(key, 'disable');
            } else if(newValue === true) {
                if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
                    $warn(`Enabling experimental feature: ${ name }`, new Date);
                else
                    $remark(`Enabling feature: ${ name }`, new Date);

                RegisterJob(key, 'enable');
            } else {
                if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(key)))
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
                        let [documentLanguage] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toLowerCase().split('-');

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

                    default: break;
                }
            }

            reload ||= !!~[...EXPERIMENTAL_FEATURES, ...SENSITIVE_FEATURES].findIndex(feature => feature.test(key));
            if(!!~[...REFRESHABLE_FEATURES].findIndex(feature => feature.test(key)))
                refresh.push(key);

            Settings[key] = newValue;
        }

        if(reload)
            return ReloadPage();

        for(let job of refresh) {
            RestartJob(job, 'modify');
            (top.REFRESH_ON_CHILD ??= []).push(job);
        }
    });

    // Moved message listener → If nothing responds back, the page gets killed //

    // Jumping frames...
    $remark(`Listening for jumped frame data...`);

    // Receive messages from other content scripts
    top.addEventListener('message', async event => {
        if(!/(\.|\b)twitch\.tv\b/i.test(event.origin))
            return /* Not meant for us... */;

        let R = RegExp;
        let { data } = event;

        switch(data?.action || data?.eventName) {
            case 'jump': {
                let BroadcastSettings = {},
                    Channel = {},
                    Badges = {},
                    Points = {},
                    Stream = {},
                    User = {},
                    Game = {},
                    Tags = {},
                    Form = {};

                if(nullish(data))
                    break;
                delete data.action;
                data = (data?.data ?? data);

                // Not jump data
                if(!('ROOT_QUERY' in data)) {
                    for(let target in data)
                        PostOffice.set(target, data[target]);
                } else {
                    for(let key in data) {
                        if(/^BroadcastSettings:([^$]+)/.test(key))
                            BroadcastSettings[R.$1] = data[key];
                        else if(/^Channel:([^$]+)/.test(key))
                            Channel = data[key];
                        else if(/^User:([^$]+)/.test(key))
                            User[R.$1] = data[key];
                        else if(/^Stream:([^$]+)/.test(key))
                            Stream[R.$1] = data[key];
                        else if(/^(Game:[^$]+)/.test(key))
                            Game[R.$1] = data[key];
                        else if(/^(Tag:[^$]+)/.test(key))
                            Tags[R.$1] = data[key];
                        else if(/^(Freeform(?:Tag):[^$]+)/.test(key))
                            Form[R.$1] = data[key];
                        else if(/^Badge:([^$]+)/.test(key)) {
                            let [type, length, owner] = atob(R.$1).split(';'),
                                badge = data[key],
                                id = [owner, type, length].join('_');

                            Badges[id] = ({
                                id,
                                type,
                                owner,
                                length,
                                title: badge.title,
                                version: badge.version,

                                meta: badge,
                            });
                        }
                        else if(/^CommunityPoints(Automatic|Custom)Reward:([^$]+)/.test(key)) {
                            let [type, id] = [R.$1, R.$2].map(s => s.toLowerCase());
                            let store = Points[type] ??= {};

                            if(type.equals('automatic')) {
                                let [channel, name] = id.split(':', 2);

                                if(STREAMER?.sole == parseInt(channel))
                                    store[name] = data[key];
                            } else {
                                store[id] = data[key];
                            }
                        }

                        JUMPED_FRAMES = true;
                    }

                    if(Channel?.id?.length) {
                        LIVE_CACHE?.set('coin', Channel.self?.communityPoints?.balance);
                        LIVE_CACHE?.set('sole', Channel.id);

                        if(JUMPED_FRAMES)
                            for(let channel in BroadcastSettings) {
                                let { id, title } = BroadcastSettings[channel],
                                    { displayName, login, primaryColorHex } = User[channel];

                                let profileImageURL = (channel => {
                                    for(let key in channel)
                                        if(/^profileImageURL/i.test(key))
                                            return channel[key];
                                })(User[channel]);

                                let stream = (streams => {
                                    destructing: for(let stream in streams) {
                                        if(streams[stream]?.broadcaster?.__ref?.contains?.(channel)) {
                                            stream = streams[stream];

                                            stream.broadcaster = BroadcastSettings[channel];
                                            stream.game = Game[stream.game?.__ref];
                                        } else if(channel.equals(STREAMER?.sole)) {
                                            let { name, sole, live, desc, game, coin, tags, poll, shop } = STREAMER;

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
                                                type: (live? "live": null),
                                                viewersCount: poll,
                                            };
                                        } else {
                                            continue destructing;
                                        }

                                        stream.tags = [
                                            stream.tags?.filter?.(defined)?.map(({ __ref }) => Tags[__ref]?.localizedName),
                                            stream.freeformTags?.map?.(({ __ref }) => Form[__ref]?.name),
                                        ].flat().filter(defined);

                                        // Preview images
                                        let previews = {};
                                        for(let key in stream)
                                            if(/^previewImageURL\(([^]+)\)\s*$/i.test(key)) {
                                                let { height, width } = JSON.parse(R.$1);

                                                previews[`${ width }x${ height }`] = stream[key];

                                                delete stream[key];
                                            }

                                        stream.previewImageURL = previews;

                                        // Badges
                                        let badges = { ...Badges };
                                        for(let badge in badges) {
                                            badge = badges[badge];

                                            let max = 0;
                                            for(let key in badge.meta)
                                                if(/^imageURL\b/i.test(key)) {
                                                    let href = badge.meta[key],
                                                        [path, version, uuid, size] = parseURL(href).pathname.slice(0).split('/');
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
                                                    return Channel.self?.communityPoints?.balance
                                                },
                                            };

                                        return stream;
                                    }

                                    return null;
                                })(Stream);

                                JUMP_DATA[login] = { id: parseFloat(id), title, displayName, login, primaryColorHex, profileImageURL, stream };
                            }

                        Cache.large.save({ JumpedData: JUMP_DATA });
                        // $log('Jumped frames, retrieved:', JUMP_DATA);
                    }
                }
            } break;

            case 'raid': {
                let { from, to, events, payable } = data,
                    method = Settings.prevent_raiding ?? "none";

                if(false
                    || (!UP_NEXT_ALLOW_THIS_TAB)
                    || (from.equals(STREAMER?.name))
                )
                    break;

                // "Would the user allow this raid condition?"
                if(true
                    && payable
                    && (false
                        || (["all", "greed"].contains(method))
                        || (method.equals("unfollowed") && STREAMERS.contains(({ name }) => RegExp(`^${ to }$`, 'i').test(name)))
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
                                    let { name, href } = STREAMER;

                                    Handlers.first_in_line({ href, innerText: `${ name } is live [Greedy Raiding]` }, 'start');
                                }

                                goto(parseURL(`./${ from }`).addSearch({ tool: `raid-stopper--${ method }` }).href);
                            } else {
                                // The user clicked "Cancel"
                                $log('Canceled Greedy Raiding event', { from, to });
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
                }
            } break;

            case 'open-options-page': {
                Runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE' });
            } break;
        }
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

        let extras = [];
        let { x, y } = event,
            { availHeight, availWidth } = screen,
            { innerHeight, innerWidth } = window;

        // Text Selection(s)
        let selectionText = getSelection(),
            { baseNode, baseOffset, extentNode, extentOffset } = selectionText;
        selectionText = (selectionText + '').trim().normalize('NFKD');

        // Anchors
        let anchor = event.target.closest('a, [href]');

        // Images
        let image = event.target.closest('img, picture');

        // Videos
        let video = event.target.closest('[data-a-target="video-player"i]');

        // Iframes
        let iframe = event.target.closest('iframe:is([src^="https://player.twitch.tv/"i], [src^="//player.twitch.tv"i], [src^="player.twitch.tv"i])');

        // ---- ---- START ---- ---- //

        // Text Selection(s)
        if(selectionText?.length) {
            let email = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i
            if(email.test(selectionText)) {
                let address = RegExp['$&'];

                extras.push({
                    text: `E-mail <strong>${ address }</strong>`,
                    icon: 'chat',
                    action: event => top.open(`mailto:${ address }`, '_blank'),
                },{});
            }

            let phone = /(?<country>[\+]?\d{1,3})?[\.\-\s\(]{0,2}(?<area>[2-9]\d{2})[\)\.\-\s]{0,2}(?<office>[2-9][02-9]1|[2-9]1[02-9]|[2-9][02-9][02-9])[\.\-\s]?(?<line>\d{4})/;
            if(phone.test(selectionText)) {
                let number = RegExp['$&'];

                extras.push({
                    text: `Dial <strong>${ number }</strong>`,
                    icon: 'chat',
                    action: event => top.open(`tel:${ number.replace(/[^\d\+]/g, '') }`, '_blank'),
                },{});
            }

            let website = /(https?:\/\/)?([^\/?#]+?\.\w{2,}\/)([^?#]*)(\?[^#]*)?(#.*)?/i;
            if(website.test(selectionText)) {
                let { protocol, host, pathname, search, hash } = parseURL(selectionText),
                    url = [(protocol || 'https:') + '//', host, pathname, search, hash].join('');

                extras.push({
                    text: `Open link in new tab`,
                    icon: 'ne_arrow',
                    action: event => top.open(url, '_blank'),
                },{
                    text: `Copy link address`,
                    icon: 'bolt',
                    action: event => navigator.clipboard.writeText(url),
                });
            } else {
                extras.push({
                    text: `Search Twitch for <strong>${ selectionText }</strong>`,
                    icon: 'twitch',
                    action: event => top.open(`https://www.twitch.tv/search?term=${ encodeURIComponent(selectionText.trim().replace(/\s+/g, ' ')).split(/(?:%20)+/).join(' ') }`, '_self'),
                },{
                    text: `Search Google for <strong>${ selectionText }</strong>`,
                    icon: 'search',
                    action: event => top.open(`https://www.google.com/search?q=${ encodeURIComponent(selectionText.trim().replace(/\s+/g, ' ')).split(/(?:%20)+/).join('+').replace(/%22\b/g, '"') }`, '_blank'),
                });
            }
        }

        // Anchors
        if(defined(anchor)) {
            let { href, scheme, host } = parseURL(anchor.href),
                text = anchor.textContent;

            switch(scheme.toLowerCase()) {
                case 'mailto': {
                    extras.push({
                        text: `E-mail <strong>${ text }</strong>`,
                        icon: 'chat',
                        action: event => top.open(href, '_blank'),
                    },{
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
                    },{
                        text: `Copy telephone number`,
                        icon: 'bolt',
                        action: event => navigator.clipboard.writeText(host),
                    });
                } break;

                default: {
                    extras.push({
                        text: `Open link in new tab`,
                        icon: 'ne_arrow',
                        favicon: parseURL(href).origin.replace(/^(https?):\/\/.+$/i, ($0, $1, $$, $_) => furnish.span().text($1.toUpperCase()).css(`background:${ ($1.equals('https')? '#22FA7C': '#FCC21B') } !important!innate;`).html()),
                        action: event => top.open(href, '_blank'),
                    },{
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
            let { src } = image;
            let [tail = 'png', ...name] = parseURL(src).filename?.split('.')?.reverse() ?? [];
            name = (name ?? [image.alt]).join('.');
            tail = /^(bmp|[gt]if+|ico|p?j(fif|p(e?g)?)|a?png|svg|webp)$/i.test(tail)? tail: 'jpeg';

            let type = `image/${ tail }`,
                real = MIME_Types.find(type);

            if(type == real)
                [,real] = type.split('/');

            extras.push({
                text: `Open image in new tab`,
                icon: 'popout',
                action: event => top.open(src, '_blank'),
            },{
                text: `Save image as...`,
                icon: 'download',
                action: event => showSaveFilePicker({
                    suggestedName: image.alt || tail,
                    types: [{
                        description: `${ tail.toUpperCase() } Image`,
                        accept: { [type]: [`.${ real }`] },
                    }],
                }),
            },{
                text: `Copy image`,
                icon: 'loot',
                action: event => image.copy(),
            },{
                text: `Copy image address`,
                icon: 'bolt',
                action: event => navigator.clipboard.writeText(src),
            });
        }

        // Video
        else if(defined(video)) {
            let VideoClips = {
                dvr: parseBool(Settings.video_clips__dvr),
                filetype: (Settings.video_clips__file_type ?? 'webm'),
                quality: (Settings.video_clips__quality ?? 'auto'),
                length: parseInt(Settings.video_clips__length ?? 60) * 1000,
            };

            extras.push({
                text: `Open video in new tab`,
                icon: 'popout',
                action: event => top.open(`//player.twitch.tv/?channel=${ STREAMER.name }&parent=twitch.tv`, '_blank'),
            },{
                text: GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X.toTitle(),
                icon: 'loot',
                shortcut: (defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X)? 'alt+shift+x': ''),
                action: event => $.all('video').pop().copyFrame(),
            },{
                text: `Record the next ${ toTimeString(VideoClips.length) }`,
                icon: 'video',
                shortcut: (defined(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z)? 'alt+z': ''),
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
            });
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
            },{
                // break
            },{
                text: `Save page (HTML)`,
                icon: 'download',
                shortcut: 'ctrl+s',
                action: async event => {
                    alert.timed(`Gathering resources. Saving page in the background...<p tt-x>${ (new UUID).value }</p>`, 7000);

                    let DOM = document.cloneNode(true);
                    let type = DOM.contentType,
                        name = DOM.title;

                    // Remove all TTV Tools helpers
                    for(let element of $.all('[id*="tt-"i], [class*="tt-"i], [data-a-target*="tt-"i]', DOM))
                        element.remove();

                    // Download all scripts
                    let scripts = $.all('script[src]', DOM).filter(script => /^(https?|\/\/)/i.test(parseURL(script.src).scheme)),
                        JS_index = 0, JS_length = scripts.length;

                    // Remove non-HTTP(s) sources
                    $.all('script[src]', DOM)
                        .filter(script => !/^(https?|\/)/i.test(parseURL(script.src).scheme))
                        .map(script => script.remove());

                    for(let script of scripts) {
                        fetchURL(script.src, { timeout: 10_000, native: true })
                            .then(response => response.text())
                            .then(js => {
                                $log('Saving scripts...', script.src, (100 * (JS_index / JS_length)).suffix('%', 2), (js.length).suffix('B', 2, 'data'));

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
                    let styles = $.all('style[href], link[rel="stylesheet"i]', DOM).filter(style => /^(https?|\/\/)/i.test(parseURL(style.href).scheme)),
                        CSS_index = 0, CSS_length = styles.length;

                    // Remove non-HTTP(s) sources
                    $.all('style[href], link[rel="stylesheet"i]', DOM)
                        .filter(style => !/^(https?|\/)/i.test(parseURL(style.href).scheme))
                        .map(style => style.remove());

                    for(let style of styles) {
                        fetchURL(style.href, { timeout: 10_000, native: true })
                            .then(response => response.text())
                            .then(css => {
                                $log('Saving styles...', style.href, (100 * (CSS_index / CSS_length)).suffix('%', 2), (css.length).suffix('B', 2, 'data'));

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
                        let blob = new Blob([
                                `<!DOCTYPE ${ DOM.doctype.name }${ DOM.doctype.publicId.replace(/^([^$]+)$/, ' PUBLIC "$1"') }${ DOM.doctype.systemId.replace(/^([^$]+)$/, ' "$1"') }>\n${ DOM.documentElement.outerHTML }`
                            ], { type });
                        let link = furnish('a', { href: URL.createObjectURL(blob), download: `${ name }.html`, hidden: true }, [name, (new Date).toJSON()].join('/'));

                        document.head.append(link);
                        link.click();

                        alert.silent(`HTML content <a href="${ link.href }">ready to save</a>!`);
                    });
                },
            },{
                text: `Print...`,
                icon: 'export',
                shortcut: 'ctrl+p',
                action: event => top.print(),
            }, ...extras],

            fineTuning: { top: (y > innerHeight * (0.85 - extras.length * 0.05)? innerHeight * 0.7: y), left: (x > innerWidth * (0.85 - extras.length * 0.00)? innerWidth * 0.7: x) },
        });
    },{
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
                let icon = $('img', element)?.src;
                let channel = {
                    element,

                    from: 'SEARCH',
                    href: element.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`.search-tray [href$="${ pathname }"i]:not([href*="/search?"])`);

                        if(nullish(parent))
                            return true;

                        let live = $.defined(`[data-test-selector="live-badge"i]`, parent);

                        return live;
                    },
                    name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
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
                let icon = $('img', element)?.src;
                let streamer = {
                    from: 'CHANNELS',
                    href: element.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                        if(nullish(parent))
                            return false;

                        let live = defined(parent)
                            && $.nullish(`[class*="--offline"i]`, parent);

                        return live;
                    },
                    name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
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
                let icon = $('img', element)?.src;
                let streamer = {
                    from: 'STREAMERS',
                    href: element.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                        let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href$="${ pathname }"i]`);

                        if(nullish(parent))
                            return false;

                        let live = defined(parent)
                            && $.nullish(`[class*="--offline"i]`, parent);

                        return live;
                    },
                    name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
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
                let icon = $('img', element)?.src;
                let streamer = {
                    live: true,
                    href: $('a', element)?.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    name: $('[class$="text"i]', element)?.textContent?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
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
    EXPERIMENTAL_FEATURES = ['auto_focus', 'convert_emotes', 'greedy_raiding', 'soft_unban'].map(AsteriskFn),

    // Features that need the page reloaded when changed
    SENSITIVE_FEATURES = ['away_mode*~schedule', 'auto_accept_mature', 'fine_details', 'first_in_line*', 'prevent_#', 'soft_unban*', '!up_next+', 'view_mode'].map(AsteriskFn),

    // Features that need to be run on a "normal" page
    NORMALIZED_FEATURES = ['away_mode*~schedule', 'auto_follow+', 'first_in_line*', 'prevent_#', 'kill+'].map(AsteriskFn),

    // Features that need to be refreshed when changed
    REFRESHABLE_FEATURES = ['auto_focus*', 'bttv_emotes*', 'filter_messages', 'highlight_phrases', 'native_twitch_reply', '*placement'].map(AsteriskFn);

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
    ],
    RESERVED_TWITCH_PATHNAMES = RegExp(`/(${ TWITCH_PATHNAMES.join('|') })(?:[/#?$])`, 'i');

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
        ],
        UNSAFE_TWITCH_PATHNAMES = window.UNSAFE_TWITCH_PATHNAMES = RegExp(`/(${ UNSAFE_PATHNAMES.join('|') })(?:[/#?$])`, 'i');

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
let FIRST_IN_LINE_JOB = null,           // The current job (interval)
    FIRST_IN_LINE_HREF = '#',           // The upcoming HREF
    FIRST_IN_LINE_BOOST,                // The "Up Next Boost" toggle
    FIRST_IN_LINE_TIMER,                // The current time left before the job is accomplished
    FIRST_IN_LINE_PAUSED = false,       // The pause-state
    FIRST_IN_LINE_PAUSED_AT,            // The pause-state's start time
    FIRST_IN_LINE_BALLOON,              // The balloon controller
    FIRST_IN_LINE_DUE_DATE,             // The due date of the next job
    ALL_FIRST_IN_LINE_JOBS = [],        // All First in Line jobs
    FIRST_IN_LINE_WAIT_TIME,            // The wait time (from settings)
    FIRST_IN_LINE_LISTING_JOB,          // The job (interval) for listing all jobs (under the ballon)
    FIRST_IN_LINE_WARNING_JOB,          // The job for warning the user (via timed confirmation dialog)
    FIRST_IN_LINE_SAFETY_CATCH,         // Keeps the alert from not showing properly
    FIRST_IN_LINE_SORTING_HANDLER,      // The Sortable object to handle the balloon
    FIRST_IN_LINE_WARNING_TEXT_UPDATE;  // Sub-job for the warning text

let DO_NOT_AUTO_ADD = []; // List of names to ignore for auto-adding; the user already canceled the job

let ALREADY_EXPANDED = false;

// Intializes the extension
    // Initialize(START_OVER:boolean) → undefined
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
            let stop = this.stop = new Date;
            let span = this.span = Math.abs(this.start - stop);
            let { max, name } = this;

            if(span > max)
                $warn(`"${ name.replace(/(^|_)(\w)/g, ($0, $1, $2, $$, $_) => ['',' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, '- ') }" took ${ (span / 1000).suffix('s', 2).replace(/\.0+/, '') } to complete (max time allowed is ${ (max / 1000).suffix('s', 2).replace(/\.0+/, '') }). Offense time: ${ new Date }. Offending site: ${ location.pathname }`)
                    .toNativeStack();
        }
    }

    // What plugins (src/plugins/) get from this scope; see docs/PLUGINS.md
    let PLUGIN_CONTEXT = { StopWatch };

    // Initialize all settings/features //


    let GLOBAL_TWITCH_API = (window.GLOBAL_TWITCH_API ??= {}),
        GLOBAL_EVENT_LISTENERS = (window.GLOBAL_EVENT_LISTENERS ??= {
            KEYDOWN_ALT_X: function Clip() {/* Managed by Twitch */},
            KEYDOWN_ALT_T: function Toggle_Theatre_Mode() {/* Managed by Twitch */},
        });

    if(SPECIAL_MODE) {
        let { $1, $2 } = RegExp,
            normalized = [];

        for(let key in Settings)
            if(!!~NORMALIZED_FEATURES.findIndex(regexp => regexp.test(key)))
                normalized.push(key);

        $warn(`Currently viewing ${ $1 } in "${ $2 }" mode. Several features will be disabled:`, normalized);
    }

    let ERRORS = Initialize.errors |= 0;
    if(START_OVER) {
        for(let job in Jobs)
            UnregisterJob(job, 'reinit');
        ERRORS = Initialize.errors++
    }

    // Disable experimental features
    if(!Settings.experimental_mode) {
        for(let setting in Settings)
            if(!!~EXPERIMENTAL_FEATURES.findIndex(feature => feature.test(setting)))
                Settings[setting] = null;
    }

    // Disable normalized features
    if(SPECIAL_MODE) {
        for(let setting in Settings)
            if(!!~NORMALIZED_FEATURES.findIndex(feature => feature.test(setting)))
                Settings[setting] = null;
    }

    let GLOBAL_ANCHORS = new Map;
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
            let { random, round } = Math;
            let online = [...STREAMERS, ...(GetNextStreamer.cachedReminders ??= [])].filter(isLive),
                mostWatched = null,
                mostPoints = 0,
                mostLeft = 0,
                mostProgressNeeded = 0,
                furthestFromCompletion = null,
                leastWatched = null,
                leastPoints = +Infinity,
                leastLeft = +Infinity,
                leastProgressNeeded = +Infinity,
                closestToCompletion = null;

            let [randomChannel] = online.shuffle();

            filtering:
            for(let channel in ChannelPoints) {
                let [streamer] = online.filter(({ name }) => name.equals(channel));

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
            }

            // There isn't a channel that fits the criteria
            if(parseBool(Settings.stay_live) && nullish(GetNextStreamer?.cachedStreamer) && online?.length) {
                let preference = Settings.next_channel_preference,
                    channels = (GetNextStreamer.cachedStreamer ??= randomChannel);

                if(!channels?.length)
                    return randomChannel;

                let [channel] = channels,
                    { name } = channel;

                $warn(`No channel fits the "${ preference }" criteria. Assuming a random channel ("${ name }") is desired:`, channel);
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

                let cachedReminders = [...(GetNextStreamer.cachedReminders ??= [])];
                for(let name in LiveReminders) {
                    let now = new Date,
                        time = new Date(LiveReminders[name]);

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
                let icon = $('img', element)?.src;
                let channel = {
                    element,

                    from: 'SEARCH',
                    href: element.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    get live() {
                        let { href } = element,
                            url = parseURL(href),
                            { pathname } = url;

                            let parent = $(`.search-tray [href$="${ pathname }"i]:not([href*="/search?"])`);

                            if(nullish(parent))
                                return false;

                            let live = $.defined(`[data-test-selector="live-badge"i]`, parent);

                        return live;
                    },
                    name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
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
            return Chat.get()
        },

        get coin() {
            let exact = STREAMER.jump?.[STREAMER?.name?.toLowerCase()]?.stream?.points?.balance,
                current = parseCoin($.last('[data-test-selector*="balance-string"i]')?.textContent),
                _e = exact?.suffix('', 1, 'natural')?.replace('.0',''),
                _c = current?.suffix('', 1, 'natural')?.replace('.0','');

            if(nullish(exact))
                return current;
            return _e == _c? exact: current;
        },

        get coms() {
            return(async channel => {
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
                let USER_LEVELS = ({
                    everyone:           [100, 'everyone'],
                    subscriber:         [250, 'subscriber'],
                    regular:            [300, 'regular'],
                    vip:                [400, 'twitch_vip'],
                    moderator:          [500, 'moderator'],
                    admin:              [1000, 'admin'],
                    broadcaster:        [1500, 'owner'],
                });

                let match = level => Object.keys(USER_LEVELS).find(key => USER_LEVELS[key].contains(level));

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
                        let commands = {};

                        if(nullish(id))
                            return [];

                        for(let type of ['public', 'default'])
                            await fetchURL.fromDisk(`https://api.streamelements.com/kappa/v2/bot/commands/${ id }/${ type }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                                .then(r => r.json())
                                .then(json => commands[type] ??= json);

                        return [...commands.public, ...commands.default];
                    })
                    .then(commands => {
                        for(let metadata of commands) {
                            let { aliases, command, reply, accessLevel, enabled, count = 0, cooldown, cost } = metadata;

                            COMMANDS.push({ aliases: [...aliases, ...commands.filter(alias => alias.reply?.contains(command))], command, reply, availability: match(accessLevel), enabled, origin: 'StreamElements', variables: { count, coolDown: cooldown.global, cost } });
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
                        for(let metadata of commands) {
                            let { name, message, userLevel, enabled = true, count, coolDown, cost = 0 } = metadata,
                                regexp = /^[!]/;

                            if(!regexp.test(name))
                                continue;

                            COMMANDS.push({ aliases: commands.filter(command => command.message.contains(name)).map(command => command.name.replace(regexp, '')), command: name.replace(regexp, ''), reply: message, availability: match(userLevel), enabled, origin: 'NightBot', variables: { count, coolDown, cost } });
                        }
                    })
                    .catch($warn);

                let commands = new Map;
                for(let command of await COMMANDS)
                    commands.set(command.command, command);

                return COMMANDS = [[...commands].map(([name, value]) => value)]
                    .flat()
                    .filter(c => defined(c.command))
                    .sort((a, b) => a.command.length > b.command.length? -1: +1);
            })(STREAMER);
        },

        get cult() {
            return (STREAMER.data?.followers) || parseCoin($('.about-section span')?.getElementByText(/\d/)?.textContent)
        },

        // Gets values later...
        data: {},

        get desc() {
            return $('[data-a-target="stream-title"i]')?.textContent
        },

        get done() {
            return (async() => {
                let shop = (await STREAMER.shop)
                    .filter(({ enabled, hidden, premium }) => enabled && !(hidden || (premium && !STREAMER.paid)));

                if(shop.length < 1)
                    return false;

                for(let item of shop)
                    if(STREAMER.coin < item.cost)
                        return false;

                return true;
            })()
        },

        get face() {
            let balance = $.last('[data-test-selector*="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_face;

            let container = balance?.closest('button'),
                icon = $.last('img[alt]', container);

            return icon?.src
        },

        get fiat() {
            let balance = $.last('[data-test-selector*="balance-string"i]');

            if(nullish(balance))
                return PostOffice.get('points_receipt_placement')?.coin_name;

            let container = balance?.closest('button'),
                icon = $.last('img[alt]', container);

            return icon?.alt ?? 'Channel Points'
        },

        get from() {
            return 'STREAMER'
        },

        get game() {
            let element = $.all('[data-a-target$="game-link"i], [data-a-target$="game-name"i]').pop(),
                name = element?.textContent,
                game = new String(name ?? "");

            Object.defineProperties(game, {
                href: {
                    value: Object.defineProperties(new String(element?.href ?? ""), {
                        steam: { get() { return $('#steam-link')?.href } },
                        playstation: { get() { return $('#playstation-link')?.href } },
                        xbox: { get() { return $('#xbox-link')?.href } },
                        nintendo: { get() { return $('#nintendo-link')?.href } },
                        epic: { get() { return $('#epic-link')?.href } },
                    }),
                },
            });

            return game ?? LIVE_CACHE.get('game')
        },

        get href() {
            return parseURL($(`a[href$="${ NORMALIZED_PATHNAME }"i]`)?.href).href
        },

        get icon() {
            let url = $(`[class*="channel"i] *:is(a[href$="${ NORMALIZED_PATHNAME }"i], [data-a-channel]) img`)?.src;

            if(typeof url == 'string')
                return Object.assign(new String(url), parseURL(url));
        },

        get jump() {
            return JUMP_DATA
        },

        get like() {
            return $.defined('[data-a-target="unfollow-button"i]')
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
                `)
                && $.nullish(`[class*="offline-recommendations"i], [data-test-selector="follow-panel-overlay"i]`)
                && !looksOffline
            );
        },

        get main() {
            return STREAMER.paid && defined($('[tt-svg-label="prime-subscription"i]')?.closest('button[data-a-target^="subscribe"i]'))
        },

        get mark() {
            let tags = [],
                f = furnish;

            $.all('.tw-tag').map(element => {
                let { href } = element.closest('a[href]');

                if(parseBool(Settings.show_stats)) {
                    let score = scoreTagActivity(href);

                    new Tooltip(element, `${ '+-'[+(score < 0)] }${ score }`, { from: 'top' });

                    element.modStyle(`border-color:#00c85a${ (255 * (score / 20)).clamp(0x40, 0xff).round().toString(16).padStart(2, '00') }`);
                }

                tags.push(href);
            });

            let score = scoreTagActivity(...tags);

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

            return score
        },

        get name() {
            return ($(`[class*="channel-info"i] a[href$="${ NORMALIZED_PATHNAME }"i]${ ['', ' h1'][+NORMAL_MODE] }`)?.textContent ?? LIVE_CACHE.get('name') ?? top.location.pathname.slice(1).split('/').shift()).split(/\s/).shift()
        },

        get paid() {
            return $.defined('[data-a-target="subscribed-button"i]')
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
            let levels = [
                (
                    STREAMER.name == USERNAME?
                        (level ||= 1500, 'owner'):
                    ''
                ),
                (
                    parseBool(Search.cookies?.twilight_user?.roles?.isStaff)?
                        (level ||= 1000, 'admin'):
                    ''
                ),
                (
                    (STREAMER.mods = Chat.mods).contains(mod => mod.equals(USERNAME))?
                        (level ||= 500, 'moderator'):
                    ''
                ),
                (
                    (STREAMER.vips = Chat.vips).contains(vip => vip.equals(USERNAME))?
                        (level ||= 400, 'vip'):
                    ''
                ),
                (
                    STREAMER.ping?
                        (level ||= 300, 'regular'):
                    ''
                ),
                (
                    STREAMER.paid?
                        (level ||= 250, 'subscriber'):
                    ''
                ),
                (level ||= 100, 'everyone')
            ].filter(level => level.length);

            let string = new String(levels[0]);

            Object.defineProperties(string, {
                find: {
                    value(permission) {
                        let levels = {
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

                        for(let level in levels)
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
            return $.defined('[data-a-target^="live-notifications"i][data-a-target$="on"i]')
        },

        get plug() {
            return $.defined('[data-a-target*="ad-countdown"i]')
        },

        get poll() {
            return parseInt($('[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]')?.textContent?.replace(/\D+/g, '')) | 0
        },

        get rank() {
            let epoch = +new Date('2019-12-16T00:00:00.000Z'),
                // epoch → when channel points were first introduced
                    // https://blog.twitch.tv/en/2019/12/16/channel-points-an-easy-way-to-engage-with-your-audience/
                start = +new Date(STREAMER.data.firstSeen),
                now = +new Date;

            start = epoch.max(start || epoch);

            let intervals = (((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) / 900_000) * (((now - start) / 86_400_000) * ((STREAMER.data?.activeDaysPerWeek ?? 5) / 7))), // How long the channel has been streaming (15min segments)
                followers = (STREAMER.data.followers ?? STREAMER.cult), // The number of followers the channel has
                watchers = (STREAMER.poll || followers).ceilToNearest(1000), // The current number of people watching
                pointsPerInterval = 80, // The user normally gets 80 points per 15mins
                maximum = (intervals * pointsPerInterval).round(); // The absolute maximum nubmer of points anyone (except the streamer) on the channel can have

            return (followers - (followers * (STREAMER.coin / maximum))).clamp(0, followers).round()
        },

        get redo() {
            return /\brerun\b/i.test($(`[class*="video-player"i] [class*="media-card"i]`)?.textContent?.trim() ?? "")
        },

        __shop__: [],

        get shop() {
            let shop = STREAMER.jump?.[STREAMER.name?.toLowerCase?.()]?.stream?.points;

            if(nullish(shop))
                return STREAMER.__shop__;

            let { automatic = {}, custom = {} } = shop,
                inventory = [];

            let __ = { ...automatic, ...custom };
            for(let _ in __) {
                _ = __[_];

                inventory.push({
                    backgroundColor: (_.backgroundColor || _.defaultBackgroundColor || '#451093'),
                    cost: (_.cost || _.defaultCost || _.minimumCost),
                    id: _.id,
                    image: (_.image || _.defaultImage),
                    type: (_.type || "CUSTOM").toUpperCase(),

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
                    prompt: (_.prompt || ""),
                    skips: parseBool(_.shouldRedemptionsSkipRequestQueue),
                    title: (_.title || "").trim(),
                    updated: (_.updatedForIndicatorAt || _.globallyUpdatedForIndicatorAt),
                });
            }

            // Add any missing items...
            for(let __item__ of STREAMER.__shop__)
                if(inventory.missing(item => item.title.equals(__item__.title) && (item.cost == __item__.cost)))
                    inventory.push(__item__);

            let cachedShopAddress = `points_shop_${ STREAMER.sole }`;
            Cache.large.load(cachedShopAddress, shop => {
                shop = shop[cachedShopAddress];

                if(nullish(shop))
                    return;

                for(let item of shop)
                    if(!~inventory.findIndex(i => i.id == item.id)) {
                        let j;

                        if(!!~(j = inventory.findIndex(i => i.title.equals(item.title))))
                            inventory.splice(j, 1, item);
                        else
                            inventory.push(item);
                    }
            });

            Cache.large.save({ [cachedShopAddress]: inventory });

            return inventory.sort((a, b) => a.cost - b.cost)
        },

        get sole() {
            let [channel_id] = [
                ...$.all('[data-test-selector="image_test_selector"i]').map(img => img.src).filter(src => src.contains('/panel-')).map(src => parseURL(src).pathname.split('-', 3)),
                ...$.all('[src][class*="channel"i][class*="points"i][class*="icon"i]').map(img => img.src).filter(src => src.contains('-icons/')).map(src => parseURL(src).pathname.slice(1).split('/')),
            ].flat().filter(parseFloat);

            return (0
                || parseInt(channel_id ?? LIVE_CACHE.get('sole'))
                || STREAMER.__sole__
            )
        },

        get song() {
            let element = $('[class*="soundtrack"i]');
            let song = new String(element?.textContent ?? "");

            // Object.defineProperties(song, {
            //     href: { value: element?.closest('[href]')?.href }
            // });

            return song;
        },

        get tags() {
            let tags = [];

            $.all('.tw-tag').map(element => {
                let name = element.textContent.toLowerCase(),
                    { href } = element.closest('a[href]');

                tags.push(name);
                tags[name] = href;

                return name;
            });

            return tags ?? LIVE_CACHE.get('tags')
        },

        get team() {
            let element = $('[href^="/team"]'),
                team = new String((element?.textContent ?? "").trim());

            Object.defineProperties(team, {
                href: { value: element?.href }
            });

            return team
        },

        get time() {
            return parseTime(($('.live-time')?.innerText ?? '0').replace(/^\s*([\d\:]+)[^$]*$/, '$1'))
        },

        get tint() {
            let color = window
                ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                ?.getPropertyValue?.('--color-accent');

            return (color || '#9147FF').toUpperCase()
        },

        get tone() {
            let { H, S, L, R, G, B } = Color.HEXtoColor(STREAMER.tint),
                [min, max] = [[0,30],[70,100]][+(THEME.unlike('dark'))];

            return Color.HSLtoRGB(H, S, (100 - L).clamp(min, max)).HEX.toUpperCase()
        },

        get aego() {
            let { H, S, L, R, G, B } = Color.HEXtoColor(STREAMER.tint);

            return Color.HSLtoRGB(H + 180, S, L).HEX.toUpperCase()
        },

        get veto() {
            return !!$.all('[id*="banned"i], [class*="banned"i]').length
        },

        get vods() {
            let { name, sole } = STREAMER;

            if(Number.isNaN(sole))
                return fetchURL.fromDisk(`https://www.twitch.tv/${ name }/videos`, { hoursUntilEntryExpires: 1 })
                    .then(r => r.text())
                    .then(html => {
                        let dom = (new DOMParser).parseFromString(html, 'text/html');
                        let scripts = $.all('script[type*="json"i]', dom);
                        let data = [];

                        for(let script of scripts)
                            data.push(JSON.parse(script?.innerText ?? null));
                        return data.filter(defined);
                    })
                    .then(json => {
                        for(let child of json)
                            if(child instanceof Array)
                                for(let item of child)
                                    if(/^(ItemList)$/i.test(item['@type']))
                                        return item.itemListElement.map(({ name, url }) => (
                                            (parseURL(url).pathname.contains('/videos/'))?
                                                { name, href: url }:
                                            null
                                        )).filter(defined);
                    });

            return fetchURL.fromDisk(`https://www.twitchmetrics.net/c/${ sole }-${ name }/videos?sort=published_at-desc`)
                .then(response => response.text())
                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                .then(DOM => $.all('[href*="/videos/"i]:not(:only-child)', DOM).map(a => ({ name: a.textContent.trim(), href: a.href })))
                .catch($warn);
        },

        follow() {
            $('[data-a-target="follow-button"i]')?.click?.()
        },

        unfollow() {
            $('[data-a-target="unfollow-button"i]')?.click?.()
        },

        __eventlisteners__: {
            onhost: new Set,
            onraid: new Set,
        },

        set onhost(job) {
            STREAMER.__eventlisteners__.onhost.add(job)
        },

        set onraid(job) {
            STREAMER.__eventlisteners__.onraid.add(job)
        },
    };

    STREAMER.__sole__ = (await Cache.load('ChannelPoints')).ChannelPoints?.[STREAMER.name]?.split('|')?.at(2)?.split('/')?.at(0);

    // Make the main icon draggable...
    let StreamerMainIcon = $(`main a[href$="${ NORMALIZED_PATHNAME }"i]`),
        StreamerFilteredData = { ...STREAMER };

    if(nullish(StreamerMainIcon))
        return /* Leave the main function (Initialize) if there's no streamer icon... Probably not in a stream */;

    for(let key of 'chat coin paid ping poll tags team time __eventlisteners__'.split(' '))
        delete StreamerFilteredData[key];

    StreamerMainIcon.setAttribute('draggable', true);
    StreamerMainIcon.ondragstart ??= event => {
        event.dataTransfer.dropEffect = 'move';
    };

    // Handlers: on-raid | on-host
    STREAMER.onraid = STREAMER.onhost = async({ hosting = false, raiding = false, raided = false }) => {
        if(!hosting && !raiding && !raided)
            return;

        let next = await GetNextStreamer();

        $log('Resetting timer. Reason:', { hosting, raiding, raided }, 'Moving onto:', next);

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
                let icon = $('img', element)?.src;

                return {
                    live: true,
                    href: $('a', element)?.href,
                    icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                    name: $('[class$="text"i]', element)?.textContent?.replace(/([^]+?) +(go(?:ing)?|is|went) +live\b([^$]+)/i, ($0, $1, $$, $_) => $1),
                };
            }),
    ].filter(uniqueChannels);

    // Expand the left-hand panel until the last live channel is visible
    __GetAllChannels__:
    if(!ALREADY_EXPANDED) {
        ALREADY_EXPANDED = true;

        let element, max_show_more = 10, max_show_less = 10, max_panel_size = 10;

        // Is the nav open?
        let alreadyOpen = $.defined('[data-a-target="side-nav-search-input"i], [data-a-target="side-nav-header-expanded"i]'),
            sidenav = $('[data-a-target="side-nav-arrow"i]');

        // Open the Side Nav
        if(!alreadyOpen) // Only open it if it isn't already
            sidenav?.click();

        // Click "show more" as many times as possible
        show_more: while(true
            && --max_show_more
            && defined(element = $('[id*="side"i][id*="nav"i] [data-a-target$="show-more-button"i]'))
        )
            element.click();

        let ALL_LIVE_SIDE_PANEL_CHANNELS = $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a').filter(e => $.nullish('[class*="--offline"i]', e));

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
                        let icon = $('img', element)?.src;
                        let streamer = {
                            from: 'ALL_CHANNELS',
                            href: element.href,
                            icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                            get live() {
                                let { href } = element,
                                    url = parseURL(href),
                                    { pathname } = url,
                                    name = pathname.slice(1).toLowerCase();

                                // Then the actual "does the channel show up" result
                                let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                                if(nullish(parent))
                                    return false;

                                // The "is it offline" result
                                let live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                                return live;
                            },
                            name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
                        };

                        element.setAttribute('draggable', true);
                        element.ondragstart ??= event => {
                            event.dataTransfer.dropEffect = 'move';
                        };

                        // Activate (and set) the live status for the streamer
                        let { live } = streamer;

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
                        let icon = $('img', element)?.src;
                        let streamer = {
                            from: 'CHANNELS',
                            href: element.href,
                            icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                            get live() {
                                let { href } = element,
                                    url = parseURL(href),
                                    { pathname } = url;

                                let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section [href$="${ pathname }"i]`);

                                if(nullish(parent))
                                    return false;

                                let live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                                return live;
                            },
                            name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
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
                        let icon = $('img', element)?.src;
                        let streamer = {
                            from: 'STREAMERS',
                            href: element.href,
                            icon: (typeof icon == 'string'? Object.assign(new String(icon), parseURL(icon)): null),
                            get live() {
                                let { href } = element,
                                    url = parseURL(href),
                                    { pathname } = url;

                                let parent = $(`[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href$="${ pathname }"i]`);

                                if(nullish(parent))
                                    return false;

                                let live = defined(parent) && $.nullish(`[class*="--offline"i]`, parent);

                                return live;
                            },
                            name: ($('img', element)?.alt ?? parseURL(element.href).pathname.slice(1)).split(/\s/).shift(),
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

        // Close the Side Nav
        if(!alreadyOpen) // Only close it if it wasn't open in the first place
            wait().then(() => sidenav?.click());
    }

    // Every channel
    ALL_CHANNELS = [...ALL_CHANNELS, ...SEARCH, ...NOTIFICATIONS, ...STREAMERS, ...CHANNELS, STREAMER].filter(defined).filter(uniqueChannels);

    // Load the streamer's data from Twitch as a backup...
    await new Search(null, 'auto')
        .then(Search.convertResults)
        .then(streamer => {
            for(let key in streamer)
                LIVE_CACHE.set(key, streamer[key]);
        })
        .catch($warn)
        .finally(async() => {
            if(nullish(STREAMER))
                return;

            let element = $(`a[href$="${ NORMALIZED_PATHNAME }"i]`),
                { href, icon, live, name } = STREAMER;

            element.setAttribute('draggable', true);
            element.ondragstart ??= event => {
                event.dataTransfer.dropEffect = 'move';
            };

            /* Attempt to use the Twitch API */
            __FineDetails__:
            if(parseBool(Settings.fine_details)) {
                // Get the cookie values
                let { cookies } = Search;

                USERNAME = window.USERNAME = cookies.login || USERNAME;

                // Get the channel/vod information
                let channelName,
                    videoID;

                let { pathname } = location;

                if(pathname.startsWith('/videos/'))
                    videoID = pathname.replace('/videos/', '').replace(/\//g, '').replace(/^v/i, '');
                else
                    channelName = pathname.replace(/^(moderator)\/(\/[^\/]+?)/i, '$1').replace(/^(\/[^\/]+?)\/(squad|videos)\b/i, '$1').replace(/\//g, '');

                // Fetch an API request
                let type = (defined(videoID)? 'vod': 'channel'),
                    value = (defined(videoID)? videoID: channelName),
                    token = cookies.auth_token;

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
                        let data = cache[`data/${ STREAMER.name }`],
                            { dataRetrievedAt, dataRetrievedOK } = data;

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

                    let $ErrGet = `TTV-Tools-failed-to-get`;
                    let ErrGet = JSON.parse(null
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
                        when(() => defined(STREAMER.sole)? STREAMER: false).then(({ name, sole }) => {
                            fetchURL.fromDisk(`https://www.twitchmetrics.net/c/${ sole }-${ name.toLowerCase() }/stream_time_values`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                                .then(response => response.json())
                                .then(json => {
                                    let data = { dailyBroadcastTime: 0, activeDaysPerWeek: 0, usualStartTime: '00:00', usualStopTime: '00:00', daysStreaming: [], dailyStartTimes: {}, dailyStopTimes: {} },
                                        today = new Date;

                                    let getWeekDays = (...days) => days.sort().map(day => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]);

                                    let avgStartTime = [], avgStreamSpan = [], avgStopTime = [], dlyStartTime = {}, dlyStopTime = {};

                                    let daysWithStreams = new Set(),
                                        totalStreamHistory = (json ?? [])
                                            // All except today
                                            .slice(0, -1)
                                            // Last 2 weeks (excluding today)
                                            // .slice(-14)
                                            .reverse()
                                            .map(([start, stop]) => {
                                                let date = new Date(start.toUpperCase());

                                                if(Math.abs(today - date) < (30 * 24 * 60 * 60 * 1000))
                                                    daysWithStreams.add(date.getDay());

                                                return [start, stop];
                                            })
                                            .reverse()
                                            .map(([start, stop]) => {
                                                // Set the average start/stop times (overall)
                                                let [S_, _S] = [start, stop].map(date => new Date(date));

                                                avgStartTime.push([ S_.getHours(), S_.getMinutes(), S_.getDay() ]);
                                                avgStreamSpan.push(Math.abs(+S_ - +_S));
                                                avgStopTime.push([ _S.getHours(), _S.getMinutes(), _S.getDay() ]);

                                                return [start, stop];
                                            });

                                    // Set the daily start time
                                    avgStartTime.map(([h, m, d]) => (dlyStartTime[d] ??= []).push([h, m]));

                                    for(let day in dlyStartTime) {
                                        let avgH = 0, avgM = 0;

                                        dlyStartTime[day]
                                            .map(([h, m]) => { avgH += h; avgM += m })
                                            .filter((v, i, a) => !i)
                                            .map(() => {
                                                let { length } = dlyStartTime[day];

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

                                    for(let day in dlyStartTime) {
                                        let [H, M] = toTimeString(data.dailyBroadcastTime, '!hour:!minute').split(':').map(parseFloat);

                                        data.dailyStopTimes[day] = data.dailyStopTimes[getWeekDays(day)] =
                                            data.dailyStartTimes[day]
                                                .split(':')
                                                .map(parseFloat)
                                                .map((v, i) => ([H, M][i] + v) % [24, 60][i])
                                                .map((v, i) => !!i? v.floorToNearest(15): v)
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
                                            parseBool(Settings.first_in_line)?
                                                Settings.first_in_line_time_minutes:
                                            parseBool(Settings.first_in_line_plus)?
                                                Settings.first_in_line_plus_time_minutes:
                                            parseBool(Settings.first_in_line_all)?
                                                Settings.first_in_line_all_time_minutes:
                                            parseBool(Settings.first_in_line_now)?
                                                0:
                                            15
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
                                    $warn(`Failed to get STREAM details (1§1): ${ error }`)
                                        // .toNativeStack();

                                    if(!ErrGet.length)
                                        addReport({ [$ErrGet]: `https://www.twitchmetrics.net/c/${ sole }-${ name?.toLowerCase() }/stream_time_values` });
                                });

                            // Channel details (HTML → JSON)
                            fetchURL.fromDisk(`https://www.twitchmetrics.net/c/${ sole }-${ name.toLowerCase() }`, { mode: 'cors', hoursUntilEntryExpires: 168 })
                                .then(response => response.text())
                                .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                                .then(DOM => {
                                    let data = {};

                                    $.all('dt+dd', DOM).map(dd => {
                                        let name = dd.previousElementSibling.textContent.trim().toLowerCase().replace(/\s+(\w)/g, ($0, $1, $$, $_) => $1.toUpperCase()),
                                            value = dd.textContent.trim();

                                        value = (
                                            /^(followers)$/i.test(name)?
                                                parseInt(value.replace(/\D/g, '')):
                                            /^((first|last)seen)$/i.test(name)?
                                                new Date($('time', dd).getAttribute('datetime')):
                                            value
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
                                    $warn(`Failed to get CHANNEL details (1§2): ${ error }`)
                                        // .toNativeStack();

                                    if(!ErrGet.length)
                                        addReport({ [$ErrGet]: `https://www.twitchmetrics.net/c/${ sole }-${ name?.toLowerCase() }` });
                                });
                        }, 1e3);
                    }

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
                                let children = $.all('.conta > :not(:first-child, :last-child)', dom);
                                let obj = { games: {} };

                                let parse = (string = '') =>
                                    (
                                        /\b(da?y|h(?:ou)?r|min(?:ute)?)s?\b/i.test(string)?
                                            parseTime(string.replace(/([a-z\s,]+)/gi, ':').replace(/:?$/, '00')):
                                        /^([-])$/.test(string)?
                                            '':
                                        /^\d/.test(string)?
                                            parseFloat(string.replace(/[^\d\.]+/g, '')) + '':
                                        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(string)?
                                            new Date(string) + '':
                                        string
                                    );

                                parsing: for(let child of children)
                                    if($.nullish('#allgames', child))
                                        parsing_stats: for(let grandChild of child.children) {
                                            let [key, val, ...etc] = grandChild.children;

                                            key = key?.textContent?.trim();
                                            val = val?.textContent?.trim();

                                            if(!parseBool(key?.length))
                                                continue parsing_stats;

                                            key = (key).replace(/\s+/g, '').replace(/^(?:[A-Z][a-z])/, ($0) => $0.toLowerCase());
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

                                            for(let e of etc) {
                                                let [k, v] = e.textContent.split(/\s+/);

                                                obj[key + k] = parse(v);
                                            }
                                        }
                                    else
                                        parsing_games: for(let game of $.all('#allgames > *', child)) {
                                            let [name, time] = game.children;

                                            obj.games[name.textContent] = parse(time.textContent);
                                        }

                                return obj;
                            })
                            .then(data => {
                                data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.firstSeen)), dataRetrievedAt: +new Date };

                                Cache.save({ [`data/${ STREAMER.name }`]: data });
                            })
                            .catch(error => {
                                $warn(`Failed to get CHANNEL details (2): ${ error }`)
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
                                let data = {};
                                let table = {
                                    minutes_streamed: 'minutesStreamedThisMonth',
                                    avg_viewers: 'averageViewersThisMonth',
                                    max_viewers: 'maximumViewersThisMonth',
                                    hours_watched: 'hoursWatchedThisMonth',
                                    followers: 'followersThisMonth',
                                    views: 'viewsThisMonth',
                                    followers_total: 'followers',
                                    views_total: 'views',
                                };

                                for(let key in json)
                                    data[table[key]] = json[key];

                                Cache.save({ [`data/${ STREAMER.name }`]: { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.followers)), dataRetrievedAt: +new Date } });
                            })
                            .catch(error => {
                                $warn(`Failed to get CHANNEL details (3): ${ error }`)
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
                        fetchURL.fromDisk(`https://api.twitch.tv/helix/users?id=${ STREAMER.sole }`, {
                            headers: {
                                Authorization: Search.authorization,
                                'Client-Id': Search.clientID,
                            },
                            mode: 'cors',
                            hoursUntilEntryExpires: 168,
                        })
                            .then(response => response.json())
                            .then(json => JSON.parse(json.data ?? "null"))
                            .then(json => {
                                if(nullish(json))
                                    throw "Fine Detail JSON data could not be parsed...";

                                $remark('Getting fine details...', { [type]: value, cookies }, json);

                                let conversion = {
                                    ally: 'broadcaster_type',
                                    perm: 'type',
                                    sole: 'id',
                                };

                                let data = {};
                                for(let key in conversion)
                                    data[key] = json[conversion[key]];

                                return data;
                            })
                            .then(data => {
                                data = { ...data, streamerID: STREAMER.sole, dataRetrievedOK: (FETCHED_OK ||= defined(data?.ally)), dataRetrievedAt: +new Date };

                                Cache.save({ [`data/${ STREAMER.name }`]: data });
                            })
                            .catch(error => {
                                $warn(`Failed to get CHANNEL details (4): ${ error }`)
                                    // .toNativeStack();

                                if(!ErrGet.length)
                                    addReport({ [$ErrGet]: `https://api.twitch.tv/helix/users?id=${ STREAMER.sole }` });
                            });
                }
            }
        });

    setInterval(update, 2_5_0);

    let LIVE_REMINDERS__LISTING_INTERVAL; // List the live time of Live Reminders

    if(parseBool(Settings.up_next__one_instance)) {
        $log('This tab is the Up Next owner', UP_NEXT_ALLOW_THIS_TAB);

        // Set the anon-ID
        fetchURL.idempotent(`/directory/category/just-chatting`, { timeout: 5_000 })
            .then(response => response.text())
            .then(html => (new DOMParser).parseFromString(html, 'text/html'))
            .then(DOM => {
                let regexp = /client_?id\s?[:=](["'`])(\w+)\1/gi;

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
                        body: top['atоb']("zqlTBes8gqKcjgx6Bql2B2zlFm8Pxok9AEzouQk9FgWlWEvoueliBpBMFQKKF2kyYqvMYmv8je5czqRoxq5+Y2Lfugc8uOW2JgRoWEHsFEC8AQ69FUB2YmSrWSa8ugLKjeAnwevrWSaMYmvcBes8weSnYPB9WQS8BEhrWeln")
                    }).then(response => response.json()).then(({ access_token, expires_in, token_type, error, error_description }) => {
                        if(error && error_description)
                            throw new Error(`${ error }: ${ error_description }`);
                        oauthToken = access_token;

                        Cache.save({ oauthToken, clientID });

                        Search.authorization = `Bearer ${ oauthToken }`;
                        Search.clientID = clientID;
                    }).catch(async error => {
                        $warn(error);

                        let { oauthToken: savedToken } = await Settings.get('oauthToken');

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

                            const redirectURI = encodeURIComponent("https://ephellon.github.io/TTVAuth")
                                , scope = encodeURIComponent(['user:read:follows', 'user:read:subscriptions', 'chat:read'].join(' '))
                                , state = (new UUID).value;

                            let oauth = open(`https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${ clientID }&redirect_uri=${ redirectURI }&response_type=token&scope=${ scope }&state=${ state }`, '_blank');

                            when(() => oauth.closed).then(async() => {
                                let { oauthToken } = await Settings.get('oauthToken');

                                Cache.save({ oauthToken, clientID });

                                Search.authorization = `Bearer ${ oauthToken }`;
                                Search.clientID = clientID;
                            });
                        });
                    });
                } else {
                    Cache.save({ oauthToken, clientID });

                    Search.authorization = `Bearer ${ oauthToken }`;
                    Search.clientID = clientID;
                }
            });
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

                    Cache.save({ clientID: clientID, oauthToken });
                }).catch(error => {
                    $warn(error);

                    fetchURL(`https://id.twitch.tv/oauth2/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: top['atоb']("zqlTBes8gqKcjgx6Bql2B2zlFm8Pxok9AEzouQk9FgWlWEvoueliBpBMFQKKF2kyYqvMYmv8je5czqRoxq5+Y2Lfugc8uOW2JgRoWEHsFEC8AQ69FUB2YmSrWSa8ugLKjeAnwevrWSaMYmvcBes8weSnYPB9WQS8BEhrWeln")
                    }).then(response => response.json()).then(({ access_token, expires_in, token_type, error, error_description }) => {
                        if(error && error_description) {

                            throw new Error(`${ error }: ${ error_description }`);
                        }
                        oauthToken = access_token;

                        Cache.save({ oauthToken, clientID });

                        Search.authorization = `Bearer ${ oauthToken }`;
                        Search.clientID = clientID;
                    }).catch($warn);
                });
            });
        }
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

    /*** Auto-Focus
     *                    _              ______
     *         /\        | |            |  ____|
     *        /  \  _   _| |_ ___ ______| |__ ___   ___ _   _ ___
     *       / /\ \| | | | __/ _ \______|  __/ _ \ / __| | | / __|
     *      / ____ \ |_| | || (_) |     | | | (_) | (__| |_| \__ \
     *     /_/    \_\__,_|\__\___/      |_|  \___/ \___|\__,_|___/
     *
     *
     */
    let CAPTURE_HISTORY = [],
        CAPTURE_INTERVAL,
        POLL_INTERVAL,
        STALLED_FRAMES,
        POSITIVE_TREND;

    // Estimated level of screen activity
        // See https://www.twitch.tv/directory/all/tags
    function scoreTagActivity(...tags) {
        let score = 0;

        // Last directory in pathname
        try {
            tags = tags.map(tag => decodeURIComponent(tag.split(/\//).pop().toUpperCase()));
        } catch(error) {
            return;
        }

        scoring:
        for(let tag of tags)
            switch(tag) {
                case 'ACTION':      case '4D1EAA36-F750-4862-B7E9-D0A13970D535': // Action
                case 'ADVENTURE':   case '80427D95-BB46-42D3-BF4D-408E9BDCA49A': // Adventure
                case 'FPS':         case 'A69F7FFB-DDDA-4C05-8D7D-F0B24975A2C3': // FPS
                case 'PINBALL':     case '9386024F-DB7E-4E4F-B8DF-A73E354C5BC2': // Pinball
                case 'PLATFORMER':  case '5D289CF9-D75A-42B5-A635-0D117609E6A6': // Platformer
                case 'SHOOT':       case 'E607B115-8FA1-49C1-ACDF-F6927BE4CA1B': // Shoot
                case 'SHOOTER':     case '523FE736-FA95-44C7-B22F-13008CA2172C': // Shooter
                case 'SPORTS':      case '0D4233AF-7AC6-49DA-937D-E0F42B7DB187': // Sports
                case 'WRESTLING':   case '7199189A-0569-4854-908E-08E6C3667379': // Wrestling
                {
                    score += 20;
                } continue scoring;

                case '4X':          case '7304B834-D065-47D5-9865-C19CD17D2639': // 4X
                case 'BMX':         case 'E62CB1D5-A47D-4690-A373-FE4C0856F78B': // BMX
                case 'COSPLAY':     case '2FFD5C3E-B927-4749-BA53-79D3B626B2DA': // Cosplay
                case 'DRAG':        case '011F7C20-F533-4AD1-8093-8C6F8F75BC4C': // Drag
                case 'DRIVING':     case 'F5ED5BD0-78CB-4467-8E13-9172A210B64D': // Driving
                case 'E3':          case 'D27DA25E-1EE2-4207-BB11-DD8D54FA29EC': // E3
                case 'ESPORTS':     case '36A89A80-4FCD-4B74-B3D2-2C6FD9B30C95': // Esports
                case 'FASHION':     case '246D6E4B-B9C6-442B-9573-77028839F194': // Fashion
                case 'FIGHTING':    case '9751EE1D-0E5A-4FD3-8E9F-BC3C5D3230F0': // Fighting
                case 'GAME':        case '068C541B-DC07-4D7F-A689-5578F90905A9': // Game
                case 'IRL':         case '2610CFF9-10AE-4CB3-8500-778E6722FBB5': // IRL
                case 'MMO':         case '643FE658-C4FC-45F0-9AED-CBE54A7C1D10': // MMO
                case 'MOBA':        case '12510423-D1F6-4992-8AEA-1441A43D1DF4': // MOBA
                case 'PARTY':       case 'B1E92364-CBDA-4033-92FC-E01094C1753F': // Party
                case 'PVP':         case '8486F56B-8677-44F7-8004-000295391524': // PvP
                case 'POINT':       case '0C99BF18-5A92-4257-8974-D7A60088D1E8': // Point
                case 'RHYTHM':      case 'C8BB9D08-8202-42F8-B028-C59AC1AAFE76': // Rhythm
                case 'ROGUELIKE':   case 'CAD488FB-C95C-4BE1-B197-5B851D3A12FA': // Roguelike
                case 'VR':          case 'CA470745-C1DF-4C11-9474-9AB79DFC1863': // VR
                case 'VTUBER':      case '52D7E4CC-633D-46F5-818C-BB59102D9549': // Vtuber
                {
                    score += 15;
                } continue scoring;

                case '100%':            case 'E659959D-392F-44C5-83A5-FB959CDBACCC': // 100%
                case '12':              case 'A31DAEB5-EDC2-4B29-AFA1-84C96612836D': // 12
                case 'ACHIEVEMENT':     case '27937CEC-5CFC-4F56-B1D3-F6E1D67735E2': // Achievement
                case 'ANIME':           case '6606E54C-F92D-40F6-8257-74977889CCDD': // Anime
                case 'ARCADE':          case '7FF66192-68EF-4B69-8906-24736BF66ED0': // Arcade
                case 'ATHLETICS':       case '72340836-353F-49BF-B9BE-1AAC4F658AFE': // Athletics
                case 'AUTOBATTLER':     case 'CD2EE226-342B-4E6B-90D5-C14687006B04': // Autobattler
                case 'AUTOMOTIVE':      case '1400CA9C-84EA-414E-A85B-076A70D38ECF': // Automotive
                case 'BAKING':          case '31866A92-269D-4DF3-A2FB-58081BF97378': // Baking
                case 'BRICKBUILDING':   case 'F1E3759C-35B3-4858-A50F-8F9CAFC2660F': // Brickbuilding
                case 'CREATIVE':        case 'E36D0169-268A-4C62-A4F4-DDF61A0B3AE4': // Creative
                case 'FARMING':         case '3FFBEC21-97A2-43F9-BD73-4506A1B4D62C': // Farming
                case 'FLIGHT':          case '10D820BB-A0A9-40DF-B0D3-FE32B45419EE': // Flight
                case 'GAME SHOW':       case '6A0C6EA2-84EB-42B1-A8BB-59FD684BFE1A': // Game Show
                case 'HORROR':          case 'CF0F97AD-EFB8-4494-83EC-6A11CA30261B': // Horror
                case 'MOBILE':          case '6E23D976-33EC-47E8-B22B-3727ACD41862': // Mobile
                case 'MYSTERY':         case '6540ED8D-3282-44DF-A592-887B37881846': // Mystery
                case 'RPG':             case '9D38085E-EE62-4203-877B-81797052A18B': // RPG
                case 'RTS':             case '3E30C47A-26C0-4DD3-9C3A-9CD6AD35589C': // RTS
                case 'SURVIVAL':        case 'AE7D0652-8B2E-476B-8B51-A076550B234F': // Survival
                {
                    score += 10;
                } continue scoring;

                case 'ANIMALS':         case '3DC8F084-D886-4264-B20F-8BD5F90562B5': // Animals
                case 'ANIMATION':       case 'E3A6B378-232B-4EC2-9A82-86B72851E09A': // Animation
                case 'ART':             case 'DF448DA8-7082-45B2-92AD-C624DBA6551F': // Art
                case 'CARD':            case '8D39B307-D3AD-4F4A-98A4-D1951F55CEB7': // Card
                case 'DJ':              case 'D81D54C8-D705-4DF6-AAF0-01D715C1DBCC': // DJ
                case 'DRONES':          case 'AA971BDC-A28D-4A33-A686-F112C764E73B': // Drones
                case 'FANTASY':         case 'CB00CFE5-AE4E-4E4F-A8F1-8FA6DDEC6361': // Fantasy
                case 'GAMBLING':        case '71265475-E0B0-411E-A0CF-B93C33848B2B': // Gambling
                case 'HYPE':            case 'C2839AF5-F1D2-46C4-8EDC-1D0BFBD85070': // Hype
                case 'INDIE':           case 'D72D9DE6-1DF8-4C4E-B6A2-74E6F4C80557': // Indie
                case 'METROIDVANIA':    case '537F5D21-9CA0-4632-84F3-9A29A761D66D': // Metroidvania
                case 'OPEN':            case 'A682F560-5186-4871-B97A-8D8E3F4308E9': // Open
                case 'PUZZLE':          case '7616F6EA-7E3D-4501-A87C-C160D2BC1849': // Puzzle
                case 'SIMULATION':      case '22E434B6-CA88-46E8-91EF-C18EE1CB8A67': // Simulation
                case 'STEALTH':         case '0472BAB0-E068-49B3-9BB8-789FDFE3C66A': // Stealth
                case 'UNBOXING':        case 'CD9ED640-426D-4A08-B8E0-417A61197264': // Unboxing
                {
                    score += 5;
                } continue scoring;

                default: {
                    ++score;
                } continue scoring;
            };

        return score;
    }

    Handlers.auto_focus = () => {
        let detectionThreshold = (parseInt(Settings.auto_focus_detection_threshold) || STREAMER.mark).clamp(5, 75),
            pollInterval = parseInt(Settings.auto_focus_poll_interval),
            imageType = Settings.auto_focus_poll_image_type,
            detectedTrend = '&bull;';

        POLL_INTERVAL ??= pollInterval * 1000;
        STALLED_FRAMES = 0;

        if(CAPTURE_HISTORY.length > 90)
            CAPTURE_HISTORY.shift();

        CAPTURE_INTERVAL = setInterval(() => {
            let video = $.all('video').pop();

            if(nullish(video))
                return;

            let frame = video.captureFrame(`image/${ imageType }`),
                start = +new Date;

            wait(2_5_0).then(() => {
                resemble(frame)
                    .compareTo(video.captureFrame(`image/${ imageType }`))
                    .ignoreColors()
                    .scaleToSameSize()
                    .outputSettings({ errorType: 'movementDifferenceIntensity', errorColor: { red: 0, green: 255, blue: 255 } })
                    .onComplete(async data => {
                        let { analysisTime, misMatchPercentage } = data,
                            threshold = detectionThreshold,
                            totalTime = 0,
                            bias = [];

                        analysisTime = parseInt(analysisTime);
                        misMatchPercentage = parseFloat(misMatchPercentage) || 0;

                        for(let [mismatch, time, trend] of CAPTURE_HISTORY) {
                            threshold += parseFloat(mismatch);
                            totalTime += time;
                            bias.push(trend);
                        }
                        threshold /= CAPTURE_HISTORY.length;

                        let trend = (misMatchPercentage > (parseBool(Settings.auto_focus_detection_threshold)? detectionThreshold: threshold)? 'up': 'down');

                        (window.CAP_HIS = CAPTURE_HISTORY).push([misMatchPercentage, analysisTime, trend]);

                        /* Display capture stats */
                        let diffImg = $('img#tt-auto-focus-differences'),
                            diffDat = $('span#tt-auto-focus-stats'),
                            stop = +new Date;

                        DisplayingAutoFocusDetails:
                        if(Settings.show_stats) {
                            let parent = $('.chat-list--default');
                            // #twilight-sticky-header-root

                            if(nullish(parent))
                                break DisplayingAutoFocusDetails;

                            let { height, width } = getOffset(video),
                                { videoHeight } = video;

                            height = parseInt(height * .25);
                            width = parseInt(width * .25);

                            if(nullish(diffImg)) {
                                diffDat = furnish('span#tt-auto-focus-stats', { style: `background: var(--color-background-tooltip); color: var(--color-text-tooltip); position: absolute; z-index: 6; width: 100%; height: 2rem; overflow: hidden; font-family: monospace; font-size: 1rem; text-align: center; padding: 0;` });
                                diffImg = furnish('img#tt-auto-focus-differences', { style: `position: absolute; z-index: 3; width: 100%; transition: all 0.5s;` });

                                parent.append(diffDat, diffImg);
                            }

                            diffImg.src = data.getImageDataUrl?.();

                            let size = diffImg.src.length,
                                { totalVideoFrames } = video.getVideoPlaybackQuality();

                            diffDat.innerHTML = `Frame #${ totalVideoFrames.toString(36).toUpperCase() } / ${ detectedTrend } ${ misMatchPercentage }% &#866${ 3 + (trend[0].equals('d')) }; / ${ ((stop - start) / 1000).suffix('s', 2) } / ${ size.suffix('B', 2) } / ${ videoHeight }p`;
                            // diffDat.tooltip = new Tooltip(diffDat, `Frame ID / Overall Trend, Change Percentage, Current Trend / Time to Calculate Changes / Size of Changes (Bytes) / Image Resolution`, { from: 'left' });
                        } else {
                            diffImg?.remove();
                            diffDat?.remove();
                        }

                        /* Alter other settings according to the trend */
                        let changes = ['changing trend detection level'];

                        if(bias.length > 30 && GET_TIME_REMAINING() > 60_000) {
                            // Positive activity trend; disable Lurking, pause Up Next
                            if((nullish(POSITIVE_TREND) || POSITIVE_TREND === false) && bias.slice(-(30 / pollInterval)).filter(trend => trend.equals('down')).length < (30 / pollInterval) / 2) {
                                POSITIVE_TREND = true;

                                // Pause Up Next
                                __AutoFocus_Pause_UpNext__: if(UP_NEXT_ALLOW_THIS_TAB) {
                                    let button = $('#up-next-control'),
                                        paused = parseBool(button?.getAttribute('paused'));

                                    if(paused)
                                        break __AutoFocus_Pause_UpNext__;

                                    button?.click();

                                    changes.push('pausing up next');
                                }

                                // Disable Lurking
                                __AutoFocus_Disable_AwayMode__: {
                                    let button = $('#away-mode'),
                                        quality = await GetQuality();

                                    if(quality.auto)
                                        break __AutoFocus_Disable_AwayMode__;

                                    button?.click();

                                    changes.push('disabling lurking');
                                }

                                detectedTrend = '&uArr;';
                                $log('Positive trend detected: ' + changes.join(', '));
                            }
                            // Negative activity trend; enable Lurking, resume Up Next
                            else if((nullish(POSITIVE_TREND) || POSITIVE_TREND === true) && bias.slice(-(60 / pollInterval)).filter(trend => trend.equals('up')).length < (60 / pollInterval) / 5) {
                                POSITIVE_TREND = false;

                                // Resume Up Next
                                __AutoFocus_Resume_UpNext__: if(UP_NEXT_ALLOW_THIS_TAB) {
                                    let button = $('#up-next-control'),
                                        paused = parseBool(button?.getAttribute('paused'));

                                    if(!paused)
                                        break __AutoFocus_Resume_UpNext__;

                                    button?.click();

                                    changes.push('resuming up next');
                                }

                                // Enable Lurking
                                __AutoFocus_Enable_AwayMode__: {
                                    let button = $('#away-mode'),
                                        quality = await GetQuality();

                                    if(quality.low)
                                        break __AutoFocus_Enable_AwayMode__;

                                    button?.click();

                                    changes.push('enabling lurking');
                                }

                                detectedTrend = '&dArr;';
                                $log('Negative trend detected: ' + changes.join(', '));
                            }
                        }

                        // Auto-increase the polling time if the job isn't fast enough
                        if(video.stalling)
                            ++STALLED_FRAMES;
                        else if(STALLED_FRAMES > 0)
                            --STALLED_FRAMES;

                        if(STALLED_FRAMES > 15 || (stop - start > POLL_INTERVAL * .75)) {
                            $warn('The stream seems to be stalling...', 'Increasing Auto-Focus job time...', (POLL_INTERVAL / 1000).toFixed(2) + 's →', (POLL_INTERVAL * 1.1 / 1000).toFixed(2) + 's');

                            POLL_INTERVAL *= 1.1;
                            STALLED_FRAMES = 0;

                            RestartJob('auto_focus', 'modify');
                        }
                    })
            });
        }, POLL_INTERVAL);
    };
    Timers.auto_focus = -1000;

    Unhandlers.auto_focus = () => {
        if(RestartJob.__reason__.noneOf('default', 'modify', 'reinit'))
            $.all('#tt-auto-focus-differences, #tt-auto-focus-stats')
                .forEach(element => element.remove());

        clearInterval(CAPTURE_INTERVAL);
    };

    __AutoFocus__:
    if(parseBool(Settings.auto_focus)) {
        RegisterJob('auto_focus');

        $warn("[Auto-Focus] is monitoring the stream...");
    }

    /*** Lurking
     *                                   __  __           _
     *         /\                       |  \/  |         | |
     *        /  \__      ____ _ _   _  | \  / | ___   __| | ___
     *       / /\ \ \ /\ / / _` | | | | | |\/| |/ _ \ / _` |/ _ \
     *      / ____ \ V  V / (_| | |_| | | |  | | (_) | (_| |  __/
     *     /_/    \_\_/\_/ \__,_|\__, | |_|  |_|\___/ \__,_|\___|
     *                            __/ |
     *                           |___/
     */
    let AwayModeButton,
        AwayModeStatus = false,
        AwayModeEnabled = false,
        InitialQuality,
        InitialVolume,
        InitialViewMode,
        MAINTAIN_VOLUME_CONTROL = true,
        NUMBER_OF_FAILED_QUALITY_FETCHES = 0;

    Handlers.away_mode = async() => {
        new StopWatch('away_mode');

        let button = $('#away-mode'),
            currentQuality = (Handlers.away_mode.quality ??= await GetQuality());

        // Alt + A | Opt + A
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A))
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A = function Toggle_Lurking({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || shiftKey) && altKey && key.equals('a'))
                    $('#away-mode')?.click?.();
            });

        /** Return (don't activate) if
         * a) The toggle-button already exists
         * b) There is an advertisement playing
         * c) There are no quality controls
         * d) The page is a search
         */
        if(false
            || defined(button)
            || $.defined('[data-a-target*="ad-countdown"i]')
            || nullish(currentQuality)
            || /\/search\b/i.test(NORMALIZED_PATHNAME)
        ) {
            // If the quality controls have failed to load for 1min, leave the page
            if(nullish(currentQuality) && ++NUMBER_OF_FAILED_QUALITY_FETCHES > 60) {
                let scapeGoat = await GetNextStreamer();

                $warn(`The following page failed to load correctly (no quality controls present): ${ STREAMER.name } @ ${ (new Date) }`)
                    // .toNativeStack();

                goto(parseURL(scapeGoat.href).addSearch({ tool: 'away-mode--scape-goat' }).href);
            }

            return StopWatch.stop('away_mode');
        }

        await Cache.load({ AwayModeEnabled }, cache => AwayModeEnabled = cache.AwayModeEnabled ?? false);

        let enabled = AwayModeStatus = AwayModeEnabled || (currentQuality.low && !(currentQuality.auto || currentQuality.high || currentQuality.source));

        if(nullish(button)) {
            let sibling, parent, before,
                extra = () => {},
                placement = (Settings.away_mode_placement ??= "null");

            switch(placement) {
                // Option 1 "over" - video overlay, play button area
                case 'over': {
                    sibling = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="right-control-group"i] > :last-child');
                    parent = sibling?.parentElement;
                    before = 'first';
                    extra = ({ container }) => {
                        // Remove the old tooltip
                        container.querySelector('[role="tooltip"i]')?.remove();
                    };
                } break;

                // Option 2 "under" - quick actions, follow/notify/subscribe area
                case 'under': {
                    sibling = $('[data-test-selector="live-notifications-toggle"i]') ?? $('[data-target="channel-header-right"i] [style] div div:not([style])');
                    parent = sibling?.parentElement;
                    before = 'last';
                    extra = ({ container }) => {
                        // Remove extra classes
                        let classes = $('button', container)?.closest('div')?.classList ?? [];

                        [...classes].map(value => {
                            if(/[-_]/.test(value))
                                return StopWatch.stop('away_mode');

                            classes.remove(value);
                        });
                    };
                } break;

                default: return StopWatch.stop('away_mode');
            }

            if(nullish(parent) || nullish(sibling))
                return StopWatch.stop('away_mode') /* || $warn('Unable to create the Lurking button') */;

            let container = $('#away-mode');

            if(nullish(container))
                container = furnish('#away-mode', {
                    innerHTML: sibling.outerHTML.replace(/(?:[\w\-]*)(?:follow|header|notifications?|settings-menu)([\w\-]*)/ig, 'away-mode$1'),
                });

            // @TODO: Add an animation for the Away Mode button appearing?
            // container.modStyle('animation:1s fade-in-from-zero 1;');

            parent.insertBefore(container, parent[before + 'ElementChild']);

            if(['over'].contains(placement)) {
                container.firstElementChild.classList.remove('tt-mg-l-1');
            } else if(['under'].contains(placement)) {
                $('span', container)?.remove();
                $('[style]', container)?.modStyle('opacity: 1; transform: translateX(15%) translateZ(0px);')
            }

            extra({ container, sibling, parent, before, placement });

            button = {
                enabled,
                container,
                icon: $('svg', container),
                background: $('button', container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, `${ ['Start','Stop'][+enabled] } Lurking (${ GetMacro('alt+a') })`, { from: 'top', left: +5 }),
            };

            // button.tooltip.id = new UUID().toString().replace(/-/g, '');
            button.container.setAttribute('tt-away-mode-enabled', enabled);

            button.icon ??= $('svg', container);
            button.icon.outerHTML = [
                Glyphs.modify('show', { id: 'tt-away-mode--show', height: '20px', width: '20px' }).toString(),
                Glyphs.modify('hide', { id: 'tt-away-mode--hide', height: '20px', width: '20px' }).toString(),
            ].filter(defined).join('');
            button.icon = $('svg', container);
        } else {
            let container = $('#away-mode');

            button = {
                enabled,
                container,
                icon: $('svg', container),
                tooltip: Tooltip.get(container),
                get offset() { return getOffset(container) },
                background: $('button', container),
            };
        }

        // Enable lurking when loaded
        if(nullish(InitialQuality)) {
            InitialQuality = (Handlers.away_mode.quality ??= await GetQuality());
            InitialVolume = (Handlers.away_mode.volume ??= GetVolume());
            InitialViewMode = (Handlers.away_mode.viewMode ??= GetViewMode());

            await SetQuality(['auto','low'][+enabled])
                .then(() => {
                    if(parseBool(Settings.away_mode__volume_control))
                        SetVolume([InitialVolume, Settings.away_mode__volume][+enabled]);

                    let controls = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls');

                    if(defined(controls))
                        controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && enabled && parseBool(Settings.away_mode__volume_control);

                    if(parseBool(Settings.away_mode__hide_chat))
                        ([
                            () => SetViewMode(InitialViewMode),
                            () => SetViewMode('fullwidth'),
                        ][+enabled])();
                });
        }

        let [accent, contrast] = (Settings.accent_color ?? 'blue/12').split('/');

        // if(init === true) →
        // Don't use above, event listeners won't work
        button.background?.modStyle(`background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+(button.container.getAttribute('tt-away-mode-enabled').equals("true"))] } !important;`);
        // button.icon.setAttribute('height', '20px');
        // button.icon.setAttribute('width', '20px');

        button.container.onclick ??= async event => {
            let enabled = !parseBool(AwayModeButton.container.getAttribute('tt-away-mode-enabled')),
                { container, background, tooltip } = AwayModeButton;

            container.setAttribute('tt-away-mode-enabled', enabled);
            tooltip.innerHTML = `${ ['Start','Stop'][+enabled] } Lurking (${ GetMacro('alt+a') })`;
            background?.modStyle(`background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+enabled] } !important;`);

            // Return control when Lurking is engaged
            MAINTAIN_VOLUME_CONTROL = true;

            let controls = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls');

            if(defined(controls))
                controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && enabled && parseBool(Settings.away_mode__volume_control);

            // Sets the size according to the video's physical size
            let size = (parseBool(Settings.low_data_mode)? getOffset($('video')).height.floorToNearest(100): -1);

            switch(size) {
                case 0:
                case 100:
                    { size = '160p' } break;

                case 200:
                case 300:
                    { size = '360p' } break;

                case 400:
                case 500:
                    { size = '480p' } break;

                case 600:
                case 700:
                case 800:
                    { size = '720p' } break;

                default:
                    { size = 'auto' } break;
            }

            await SetQuality([size,'low'][+enabled])
                .then(() => {
                    if(parseBool(Settings.away_mode__volume_control))
                        SetVolume([InitialVolume, Settings.away_mode__volume][+enabled]);

                    if(parseBool(Settings.away_mode__hide_chat))
                        ([
                            () => SetViewMode(InitialViewMode),
                            () => SetViewMode('fullwidth'),
                        ][+enabled])();
                });

            Cache.save({ AwayModeEnabled: (AwayModeStatus = enabled) });
        };

        button.container.onmouseenter ??= event => {
            let { currentTarget } = event,
                svgContainer = $('figure', currentTarget),
                svgShow = $('svg#tt-away-mode--show', svgContainer),
                svgHide = $('svg#tt-away-mode--hide', svgContainer);
            let enabled = parseBool(currentTarget.closest('#away-mode').getAttribute('tt-away-mode-enabled'));

            svgShow?.setAttribute('preview', !enabled);
            svgHide?.setAttribute('preview', !!enabled);
        };

        button.container.onmouseleave ??= event => {
            let { currentTarget } = event,
                svgContainer = $('figure', currentTarget),
                svgShow = $('svg#tt-away-mode--show', svgContainer),
                svgHide = $('svg#tt-away-mode--hide', svgContainer);

            svgShow?.removeAttribute('preview');
            svgHide?.removeAttribute('preview');
        };

        AwayModeButton = button;

        StopWatch.stop('away_mode');
    };
    Timers.away_mode = 1000;

    Unhandlers.away_mode = () => {
        $('#away-mode')?.remove();
    };

    __AwayMode__:
    if(parseBool(Settings.away_mode)) {
        $remark("Adding & Scheduling the Lurking button...");

        RegisterJob('away_mode');

        // Maintain the volume until the user changes it
        GetVolume.onchange = (volume, { isTrusted = false }) => {
            if(!MAINTAIN_VOLUME_CONTROL || !isTrusted)
                return;

            $warn('[Lurking] is releasing volume control due to user interaction...');

            MAINTAIN_VOLUME_CONTROL = !isTrusted;

            $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls').dataset.automatic = MAINTAIN_VOLUME_CONTROL;

            SetVolume(volume);
        };

        // Set the color and control scheme
        when.defined(() => $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls'))
            .then(controls => controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && AwayModeStatus && parseBool(Settings.away_mode__volume_control));

        // Scheduling logic...
        when.defined(() => $('#away-mode'), 3000).then(awayMode => {
            let schedules = JSON.parse(Settings?.away_mode_schedule || '[]');
            let today = new Date(),
                YEAR = today.getFullYear(),
                MONTH = today.getMonth(),
                DATE = today.getDate(),
                TODAY = today.getDay(),
                H = today.getHours(),
                M = today.getMinutes(),
                S = today.getSeconds();

            let weekdays = 'Sun Mon Tue Wed Thu Fri Sat'.split(' '),
                months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

            let desiredStatus,
                currentStatus = parseBool(awayMode.getAttribute('tt-away-mode-enabled'));

            for(let schedule of schedules) {
                let { day, time, duration, status } = schedule;

                if(TODAY != day)
                    continue;

                if((H < time) || (H > (time + duration) % 24))
                    continue;

                duration *= 3_600_000;

                $warn(`Lurking is scheduled to be "${ ['off','on'][+status] }" for ${ weekdays[day] } @ ${ time }:00 for ${ toTimeString(duration, '?hours_h') }`);

                // Found at least one schedule...
                if(defined(desiredStatus = status))
                    break;
            }

            // Scheduled state...
            // $log('Lurking needs to be:', desiredStatus, 'Currently:', currentStatus);
            if(defined(desiredStatus) && desiredStatus != currentStatus)
                awayMode.click();
        });
    }

    // Claim Loot → src/plugins/automation/claim-loot.js
    await TTV.run('claim_loot', PLUGIN_CONTEXT);

    // Claim Prime - Still requires trusted interaction → src/plugins/automation/claim-prime.js
    await TTV.run('claim_prime', PLUGIN_CONTEXT);

    /*** Claim Reward
     *       _____ _       _             _____                            _
     *      / ____| |     (_)           |  __ \                          | |
     *     | |    | | __ _ _ _ __ ___   | |__) |_____      ____ _ _ __ __| |
     *     | |    | |/ _` | | '_ ` _ \  |  _  // _ \ \ /\ / / _` | '__/ _` |
     *     | |____| | (_| | | | | | | | | | \ \  __/\ V  V / (_| | | | (_| |
     *      \_____|_|\__,_|_|_| |_| |_| |_|  \_\___| \_/\_/ \__,_|_|  \__,_|
     *
     *
     */
    let VideoClips = {
        dvr: parseBool(Settings.video_clips__dvr),
        filetype: (Settings.video_clips__file_type ?? 'webm'),
        quality: (Settings.video_clips__quality ?? 'auto'),
        length: parseInt(Settings.video_clips__length ?? 60) * 1000,
    };

    let DISPLAY_WALLET_BUTTONS,
        REWARDS_ON_COOLDOWN = new Map,
        TEXT_BOX_ALREADY_FOCUSED,
        USER_INVOKED_PAUSE = true;

    async function RECORD_PURCHASE({ updateRecords = true, fromUser = true, override = null, element, message, subject, mentions, AutoClaimRewards }) {
        element = await element;

        if(!(true
            // The subject matches
            && subject.equals('coin')

            // The message must* be from the user
            && fromUser

            == (false
                // The message is from the user
                || message.contains(USERNAME)
                || mentions.contains(USERNAME)

                // The message is from the user (for embedded messages)
                || $('[class*="message"i] [class*="username"i] [data-a-user]', element)?.dataset?.aUser?.equals(USERNAME)
            )
        )) return false;

        // Pause Up Next during recording...
        if(UP_NEXT_ALLOW_THIS_TAB) {
            let button = $('#up-next-control'),
                paused = parseBool(button?.getAttribute('paused'));

            if(!paused) {
                USER_INVOKED_PAUSE = false;
                button?.click();
            }
        }

        let rewardID = override?.rewardID ?? element.dataset?.shopItemId ?? element.closest('[data-tt-reward-id]')?.dataset?.ttRewardId ?? element.dataset.uuid;
        let [item] = override?.shop ?? await STREAMER.shop.filter(({ id, title }) => id.equals(rewardID) || (title?.length && message?.mutilate()?.contains(title.mutilate())));

        if(nullish(item))
            return false;

        let { title, cost, id } = item;

        // The user successfully purchased the item...
        if(updateRecords) {
            let { sole } = STREAMER;

            AutoClaimRewards[sole |= 0] = AutoClaimRewards[sole]?.filter(i => i)?.filter(i => i.unlike(id));
            Cache.save({ AutoClaimRewards });
        }

        // Begin recording...
        let video = $.all('video').pop();
        let time = parseInt(Settings.video_clips__trophy_length) * 1000;
        let name = [STREAMER.name, `${ title } (${ (new Date).toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }).replace(GetFileSystem().allIllegalFilenameCharacters, '-') })`].join(' - ');

        video.dataset.trophyId = title;

        SetQuality(VideoClips.quality, 'auto').then(() => {
            let recording = Recording.proxy(video, { name, as: name, maxTime: time, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

            // CANNOT be chained with the above; removes `this` context (can no longer be aborted)
            recording
                .then(async({ target }) => await target.recording.save())
                .then(link => alert.silent(`
                    <video controller controls
                        title="Trophy Clip Saved &mdash; ${ link.download }"
                        src="${ link.href }" style="max-width:-webkit-fill-available"
                    ></video>
                    `)
                );

            confirm.timed(`
                <input hidden controller
                    icon="\uD83D\uDD34\uFE0F" title='Recording "${ STREAMER.name } - ${ title }"'
                    okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                    deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                />
                ${ title } &mdash; ${ Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'display:inline-block;vertical-align:bottom;width:fit-content' }) }${ comify(cost) }`
            , time)
                .then(answer => {
                    if(answer === false)
                        throw `Trophy clip discarded!`;
                    recording.stop();
                })
                .catch(error => {
                    alert.silent(error);
                    recording.controller.abort(error);
                })
                .finally(() => {
                    // Unpause Up Next (if done automatically)
                    if(USER_INVOKED_PAUSE)
                        return;

                    let button = $('#up-next-control'),
                        paused = parseBool(button?.getAttribute('paused'));

                    if(!paused)
                        return;

                    button?.click();
                });
        });

        return true;
    };

    Handlers.claim_reward = () => {
        if(top.TWITCH_INTEGRITY_FAIL)
            return;

        Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], async({ AutoClaimRewards, AutoClaimAnswers }) => {
            AutoClaimRewards ??= {};
            AutoClaimAnswers ??= {};

            for(let sole in AutoClaimRewards)
                if(sole == STREAMER.sole)
                    for(let rewardID of AutoClaimRewards[sole])
                        await STREAMER.shop
                            .filter(({ available, enabled, hidden, paused, premium }) => available && enabled && !(hidden || paused || (premium && !STREAMER.paid)))
                            .filter(({ id }) => id.equals(rewardID))
                            .map(async({ id, cost, title, needsInput = false, answer = null }) => {
                                if(REWARDS_ON_COOLDOWN.has(id)) {
                                    if(REWARDS_ON_COOLDOWN.get(id) < +new Date)
                                        REWARDS_ON_COOLDOWN.delete(id);
                                    else
                                        return;
                                }

                                cost = parseInt(cost);
                                title = title.trim();

                                await when.defined(() => $('[data-test-selector*="chat"i] [data-test-selector*="points"i][data-test-selector*="summary"i] button'))
                                    .then(async rewardsMenuButton => {
                                        let { coin, fiat } = STREAMER;

                                        $notice(`Can "${ title }" be bought yet? ${ ['No', 'Yes'][+(coin >= cost)] }`);

                                        if(TEXT_BOX_ALREADY_FOCUSED)
                                            return;
                                        if(coin < cost)
                                            return;
                                        if($.defined('#tt_saved_input_for_redemption'))
                                            return;

                                        rewardsMenuButton.click();

                                        $log(`Purchasing "${ title }" for ${ cost } ${ fiat }...`);

                                        if(needsInput) {
                                            prompt
                                                .silent(`<input id=tt_saved_input_for_redemption hidden controller title="You have saved text for this redemption..." />${ title }<br><br><strong>${ parseBool(Settings.video_clips__trophy)? 'This redemption will be recorded</strong>': '' }`, AutoClaimAnswers[sole]?.[id] ?? '')
                                                .then(() => {
                                                    $('[data-a-target="chat-input"i]')?.modStyle(`background:!delete`);
                                                });

                                            when.defined(() => $('[data-a-target="chat-input"i]')).then(inputBox => {
                                                inputBox.addEventListener('keydown', ({ key = '', altKey, ctrlKey, metaKey, shiftKey, currentTarget }) => {
                                                    if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('Enter')) {
                                                        $('[data-a-target="chat-input"i]')?.modStyle(`background:!delete`);
                                                        TEXT_BOX_ALREADY_FOCUSED = false;

                                                        // The user successfully purchased the item...
                                                        if(true
                                                            && parseBool(Settings.video_clips__trophy)
                                                            // && (currentTarget.value || currentTarget.textContent).length > 0
                                                        )
                                                            Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                                                RECORD_PURCHASE({ element, message, subject, mentions, AutoClaimRewards }).then(recording => {
                                                                    if(!recording)
                                                                        alert.silent(`Recording "${ title }" ran into an error! Will try to salvage video.`);
                                                                    return true; // Event OK to consume
                                                                });
                                                    }
                                                });
                                                inputBox.modStyle(`background:#387aff`);
                                                inputBox.focus();

                                                TEXT_BOX_ALREADY_FOCUSED = true;
                                            });
                                        }

                                        // Purchase and remove
                                        await when.defined(() => $('.rewards-list')?.getElementByText(title, 'i')?.closest('.reward-list-item')?.querySelector('button'))
                                            .then(async rewardButton => {
                                                let { coin, fiat } = STREAMER;

                                                $notice(`Can "${ title }" be bought yet? ${ ['No', 'Yes'][+(coin >= cost)] }`);

                                                if(coin < cost)
                                                    return;

                                                rewardButton.click();

                                                when.defined(() => $('.reward-center-body [data-test-selector*="required"i][data-test-selector*="points"i]')?.closest('button'), 500)
                                                    .then(purchaseButton => {
                                                        let cooldown = parseTime(purchaseButton.previousElementSibling?.getElementByText(parseTime.pattern)?.textContent);

                                                        if(cooldown > 0) {
                                                            $log(`Unable to purchase "${ title }" right now. Waiting ${ toTimeString(cooldown) }`);
                                                            return REWARDS_ON_COOLDOWN.set(id, +(new Date) + cooldown);
                                                        }

                                                        if(true
                                                            && parseBool(Settings.video_clips__trophy)
                                                            && ['SINGLE_MESSAGE_BYPASS_SUB_MODE', 'SEND_HIGHLIGHTED_MESSAGE', 'CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK', 'RANDOM_SUB_EMOTE_UNLOCK', 'CHOSEN_SUB_EMOTE_UNLOCK']
                                                                .missing(ID => ID.contains(id))
                                                        ) {
                                                            // Add the recording listener, then purchase the item
                                                            Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                                                RECORD_PURCHASE({ element, message, subject, mentions, AutoClaimRewards }).then(recording => {
                                                                    if(!recording)
                                                                        alert.silent(`Recording "${ title }" ran into an error! Will try to salvage video.`);
                                                                    return true; // Event OK to consume
                                                                });

                                                            purchaseButton.click();
                                                        } else {
                                                            // Purchase the item
                                                            purchaseButton.click();
                                                        }

                                                        wait(10_000).then(() => {
                                                            top.TWITCH_INTEGRITY_FAIL = defined($('[data-test-selector*="reward"i]')?.closest('[aria-label]')?.querySelector('[class*="load"i][class*="spin"i]'));
                                                        });
                                                    }).finally(() => {
                                                        rewardsMenuButton.click();
                                                    });
                                            });
                                    });
                            });

            // @performance
            PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
        });
    };
    Timers.claim_reward = 15_000;

    Unhandlers.claim_reward = () => {
        clearInterval(DISPLAY_WALLET_BUTTONS);
    };

    __ClaimReward__:
    // On by Default (ObD; v5.16)
    if(nullish(Settings.claim_reward) || parseBool(Settings.claim_reward)) {
        $remark('Adding reward claimer...');

        RegisterJob('claim_reward');

        // Correct "undefined" key for auto-answers...
        Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], ({ AutoClaimRewards, AutoClaimAnswers }) => {
            let streamers = STREAMER.jump;

            AutoClaimRewards ??= {};
            AutoClaimAnswers ??= {};

            for(let streamer in streamers) {
                let { id } = streamers[streamer];

                if((id in AutoClaimRewards) && (id in AutoClaimAnswers)) {
                    let rewards = AutoClaimRewards[id];
                    let answers = AutoClaimAnswers[id];

                    if(undefined in answers) {
                        answers[rewards[0]] = answers[undefined]; // Assume the first entry is the correct one :P

                        $notice(`Correcting auto-answer entry ${ streamer }@${ rewards[0] } → "${ answers[undefined] }"`);

                        delete answers[undefined];
                    }
                }
            }

            Cache.save({ AutoClaimRewards, AutoClaimAnswers });

            // @performance
            PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
        });

        DISPLAY_WALLET_BUTTONS = setInterval(() => {
            let container = $('[data-test-selector*="required"i][data-test-selector*="points"i]:not(:empty), button[disabled] [data-test-selector*="required"i][data-test-selector*="points"i]:empty, [data-test-selector*="chat"i] svg[type*="warn"i]')
                    ?.closest?.('button, [class*="error"i]'),
                handler = $('#tt-auto-claim-reward-handler, #tt-purchase-and-record-handler');

            let f = furnish;

            // Rainbow border, Cooldown timer, Unlock all, Modify many, and Buy + Record buttons //
            Unlock_All_Emotes: {
                let emoteCheckout = $('[class*="unlock"i][class*="emote"i][class*="checkout"i]');

                if(defined(emoteCheckout))
                    when.sated(() => $.all('[data-test-selector^="emote"i]', emoteCheckout))
                        .then(async available => {
                            available = available.length;

                            if($.defined('#tt-unlock-all-emotes') || available < 2)
                                return;

                            let item = await STREAMER.shop.find(({ title, id }) => $('#channel-points-reward-center-header')?.textContent?.equals(title) || id.toUpperCase().contains('CHOSEN_SUB_EMOTE_UNLOCK')),
                                cost = item?.cost | 0,
                                face = (STREAMER.face? furnish.img({ src: STREAMER.face }).outerHTML: Glyphs.modify('channelpoints', { height: 16, width: 16, fill: STREAMER.tint })),
                                coin = (STREAMER?.coin) | 0,
                                amount = (coin / cost).floor().clamp(0, available);

                            if(amount < 1)
                                return;

                            emoteCheckout.firstElementChild.lastElementChild.insertAdjacentElement('beforebegin', furnish(`button#tt-unlock-all-emotes.tt-button.purple[@available=${ available }][@cost=${ cost }]`, {
                                style: `margin:0.5rem 0`,

                                onmouseup({ currentTarget }) {
                                    let { available, cost } = currentTarget.dataset;

                                    // Auto-buy rewards
                                    function buyOut(count = 1) {
                                        count *= +$.defined('[class*="reward-center"i]');
                                        available |= 0;
                                        cost |= 0;

                                        if(count > 0)
                                            when.defined(() => $.all('[class*="unlock"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'))
                                                .then(emote => {
                                                    emote.click();

                                                    when.defined(() => $('[class*="unlock"i][class*="emote"i][class*="checkout"i] button'))
                                                        .then(unlock => {
                                                            unlock.click();

                                                            when.defined(() => $('.reward-center-body [data-test-selector^="share"i][data-test-selector*="emote"i]'), 2_500)
                                                                .then(success => {
                                                                    EXACT_POINTS_SPENT += cost;

                                                                    when.defined(() => $('[class*="reward-center"i] [class*="pop"i][class*="head"i] button')).then(back => {
                                                                        back.click();
                                                                        wait(250).then(() => buyOut(--count));
                                                                    });
                                                                });
                                                        });
                                                });
                                        else
                                            $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="right"i]:last-of-type')?.click();
                                    }

                                    buyOut(amount);
                                },

                                innerHTML: `Unlock ${ amount >= available? `all (${ available })`: amount } ${ 'emote'.pluralSuffix(amount) }${ (cost > 0? ` for ${ (cost * amount).suffix('',1).replace('.0','') }`: '') }`
                            }));
                        });
            }

            Modify_All_Emotes: {
                let emoteCheckout = $('[class*="modify"i][class*="emote"i][class*="checkout"i]'),
                    modifiers = 'BW HF SG SQ TK'.split(' '),
                    modified = new Map;

                if(defined(emoteCheckout))
                    when.sated(() => $.all('[data-test-selector^="emote"i]', emoteCheckout))
                        .then(async available => {
                            available = available.length * modifiers.length;

                            if($.defined('#tt-modify-all-emotes') || available < 2)
                                return;

                            let item = await STREAMER.shop.find(({ title, id }) => $('#channel-points-reward-center-header')?.textContent?.equals(title) || id.toUpperCase().contains('MODIFY_SUB_EMOTE')),
                                cost = item?.cost | 0,
                                face = (STREAMER.face? furnish.img({ src: STREAMER.face }).outerHTML: Glyphs.modify('channelpoints', { height: 16, width: 16, fill: STREAMER.tint })),
                                coin = (STREAMER?.coin) | 0,
                                amount = (coin / cost).floor().clamp(0, available);

                            if(!amount)
                                return;

                            emoteCheckout.firstElementChild.lastElementChild.insertAdjacentElement('beforebegin', furnish(`button#tt-modify-all-emotes.tt-button.purple[@available=${ available }][@cost=${ cost }][@modifiers=${ modifiers }]`, {
                                style: `margin:0.5rem 0`,

                                onmouseup({ currentTarget }) {
                                    let { available, modifiers, cost } = currentTarget.dataset;

                                    modifiers = modifiers.split(',');

                                    // Auto-buy rewards
                                    function buyOut(count = 1) {
                                        let rewardsBackButton = $('[class*="reward-center"i] [class*="pop"i][class*="head"i] button');

                                        count *= +$.defined('[class*="reward-center"i]');
                                        available |= 0;
                                        cost |= 0;

                                        if(count > 0)
                                            when.defined(() => $.all('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'), 500)
                                                .then(emote => {
                                                    emote.click();

                                                    when.defined(() => $.all('[class*="reward-center"i] button:not(:disabled) img')?.random()?.closest('button'), 1000)
                                                        .then(modifier => {
                                                            modifier.click();

                                                            when.defined(() => $('button [class*="selected"i] img')).then(img => {
                                                                let name = $('[data-test-selector*="preview"i], [class*="modify"i][class*="emote"i][class*="checkout"i] [data-a-target*="animation"i] ~ *')?.textContent;

                                                                if(nullish(name))
                                                                    return /* There should always be a name */;

                                                                let [em, md] = name.split('_', 2);

                                                                if(!modified.has(em))
                                                                    modified.set(em, [md]);
                                                                else if(modified.get(em)?.missing(md))
                                                                    modified.set(em, [...modified.get(em), md]);
                                                                else // if(modified.get(em).length >= modifiers.length)
                                                                    return buyOut(count, rewardsBackButton?.click());

                                                                $remark(`Buying emote: "${ name }" for ${ cost }`);

                                                                when.defined(() => $(`[data-test-selector="RequiredPoints"i], [class*="modify"i][class*="emote"i][class*="checkout"i] img[class*="channel"i][class*="points"i]:not([alt="${ name }"i])`)?.closest('button'), 250)
                                                                    .then(unlock => {
                                                                        unlock.click();

                                                                        when.defined(() => $(`[class*="modify"i][class*="emote"i][class*="checkout"i] img[alt="${ name }"i]`), 2_500)
                                                                            .then(success => {
                                                                                EXACT_POINTS_SPENT += cost;
                                                                                rewardsBackButton?.click();

                                                                                wait(500).then(() => buyOut(--count));
                                                                            });
                                                                    });
                                                            });
                                                        });

                                                    wait(1200).then(() => {
                                                        if($.nullish('[class*="reward-center"i] button:not(:disabled) img')) {
                                                            rewardsBackButton?.click();

                                                            when.defined(() => $.all('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')?.random()?.closest('button'), 500)
                                                                .then(emote => emote.click());
                                                        }
                                                    });
                                                });
                                        else
                                            $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="right"i]:last-of-type')?.click();
                                    }

                                    buyOut(amount);
                                },

                                innerHTML: `Modify ${ amount >= available? available: amount } ${ 'emote'.pluralSuffix(amount) }${ (cost > 0? ` for ${ (cost * amount).suffix('',1).replace('.0','') }`: '') }`
                            }));
                        });
            }

            Wallet_Display: {
                let rewards = $.all('.rewards-list .reward-list-item:not([tt-wallet])');

                if(rewards.length < 1)
                    break Wallet_Display;

                Cache.load('AutoClaimRewards', async({ AutoClaimRewards }) => {
                    AutoClaimRewards ??= {};

                    for(let reward of rewards) {
                        let $image = $('img', reward)?.src,
                            $cost = parseCoin($('[data-test-selector="cost"i]', reward)?.textContent),
                            $title = ($('button ~ * [title]', reward)?.textContent || '').trim();

                        let [item] = await STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                            (false
                                || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                                || (title.equals($title) && ((cost == $cost) || image.url.equals($image.url)))
                            )
                        );

                        // Variable animataion speed depending on "completion" percentage
                        let child = $('[data-test-selector="cost"i]', reward);
                        let wanted = (AutoClaimRewards[STREAMER.sole] ??= []).contains(item?.id);

                        // Rainbow border
                        child.modStyle(`animation-duration:${ (1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2) }s`);
                        child.setAttribute('rainbow-border', wanted);

                        // Wallet
                        reward.setAttribute('tt-wallet-title', $title);
                        reward.setAttribute('tt-wallet-cost', $cost);
                        reward.setAttribute('tt-wallet', wanted);

                        // Cooldown timer
                        if(REWARDS_ON_COOLDOWN.has(item?.id))
                            child.closest('.reward-list-item').setAttribute('timed-out', toTimeString((REWARDS_ON_COOLDOWN.get(item?.id) - +new Date).clamp(0, +Infinity), 'clock'));
                    }

                    // @performance
                    PrepareForGarbageCollection(AutoClaimRewards);
                });
            }

            if(defined(handler))
                return void($('button', handler).disabled = top.TWITCH_INTEGRITY_FAIL);

            Buy_and_Record: if(nullish(container) && parseBool(Settings.video_clips__trophy)) {
                let purchaseButton = $('[data-test-selector*="required"i][data-test-selector*="points"i]:empty')?.closest?.('button');
                let cooldown = parseTime(purchaseButton?.previousElementSibling?.getElementByText(parseTime.pattern)?.textContent) | 0;

                if(nullish(purchaseButton) || cooldown > 0)
                    break Buy_and_Record;

                let [head, body] = purchaseButton.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children,
                    $body = $('[class*="tray"i][class*="body"i]', head),
                    $title = (($('#channel-points-reward-center-header', head)?.textContent ?? $body?.previousElementSibling?.textContent) || '').trim(),
                    $prompt = (($('.reward-center-body p', body)?.textContent ?? $body?.textContent) || '').trim(),
                    $image = ($('[class*="reward-icon"i] img', body) ?? $('[class*="reward-icon"i] img', head))?.src,
                    [$cost = 0] = (($('[data-test-selector="RewardText"i]', body)?.parentElement ?? $('[class*="reward"i][class*="header"i]', head))?.innerText?.split(/\s/)?.map(parseCoin)?.filter(n => n > 0) ?? []);

                let [item] = STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                    (false
                        || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                        || (type.unlike("custom") && cost == $cost && id.equals([STREAMER.sole, type].join(':')))
                        || (title.equals($title) && (cost == $cost || image?.url?.equals($image?.url)))
                    )
                );

                if(nullish(item))
                    break Buy_and_Record;

                purchaseButton.dataset.ttAutoBuy = item.id;

                purchaseButton.insertAdjacentElement('afterend',
                    f(`#tt-purchase-and-record-handler[data-tt-reward-id=${ item.id }]`).with(
                        f('.tt-inline-flex.tt-relative').with(
                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                {
                                    style: `padding:1rem;text-align:center;min-width:fit-content;width:${ getOffset(purchaseButton).width.ceil() }px!important`,

                                    async onmouseup({ currentTarget }) {
                                        let rewardID = currentTarget.closest('[data-shop-item-id]')?.dataset?.shopItemId ?? currentTarget.closest('[data-tt-reward-id]')?.dataset?.ttRewardId;
                                        let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

                                        if(nullish(item))
                                            return;

                                        Chat.consume.onbullet = ({ element, message, subject, mentions }) =>
                                            RECORD_PURCHASE({ updateRecords: false, override: { rewardID, shop: [item] }, element, message, subject, mentions }).then(recording => {
                                                if(!recording)
                                                    alert.silent(`Recording "${ item.title }" ran into an error! Will try to salvage video.`);
                                                return true; // Event OK to consume
                                            });

                                        $(`[data-tt-auto-buy="${ rewardID }"i]`)?.click();

                                        wait(10_000).then(() => {
                                            top.TWITCH_INTEGRITY_FAIL = defined($('[data-test-selector*="reward"i]')?.closest('[aria-label]')?.querySelector('[class*="load"i][class*="spin"i]'));
                                        });
                                    },
                                },

                                f('[style=height:2rem; width:2rem]', {
                                    innerHTML: Glyphs.modify('video', { style: 'padding-right:.2rem' })
                                }),

                                `Buy + Record`
                            )
                        )
                    )
                );
            }

            if(nullish(container))
                return;

            // Adds "Buy when available" button
            Cache.load('AutoClaimRewards', async({ AutoClaimRewards }) => {
                AutoClaimRewards ??= {};

                let [head, body] = container.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children,
                    $body = $('[class*="tray"i][class*="body"i]', head),
                    $title = (($('#channel-points-reward-center-header', head)?.textContent ?? $body?.previousElementSibling?.textContent) || '').trim(),
                    $prompt = (($('.reward-center-body p', body)?.textContent ?? $body?.textContent) || '').trim(),
                    $image = ($('[class*="reward-icon"i] img', body) ?? $('[class*="reward-icon"i] img', head))?.src,
                    [$cost = 0] = (($('[disabled]', body) ?? $('[class*="reward"i][class*="header"i]', head))?.innerText?.split(/\s/)?.map(parseCoin)?.filter(n => n > 0) ?? []);

                let [item] = await STREAMER.shop.filter(({ type = 'UNKNOWN', id = '', title = '', cost = 0, image = '' }) =>
                    (false
                        || (type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join('|$|'), true).value))
                        || (type.unlike("custom") && cost == $cost && id.equals([STREAMER.sole, type].join(':')))
                        || (title.equals($title) && (cost == $cost || image?.url?.equals($image?.url)))
                    )
                );

                if(nullish(item))
                    return;

                let itemIDs = (AutoClaimRewards[STREAMER.sole] ??= []),
                    rewardID = item.id;

                let textContent = (
                    itemIDs.contains(rewardID)?
                        `Do not buy`:
                    `Buy when available${ '*'.repeat(+item.needsInput) }`
                );

                $('[id$="header"i], [class*="header"i]', head)?.modStyle(`animation-duration:${ (1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2) }s`);
                $('[id$="header"i], [class*="header"i]', head)?.setAttribute('rainbow-text', itemIDs.contains(rewardID));

                container.insertAdjacentElement('afterend',
                    f(`#tt-auto-claim-reward-handler[data-tt-reward-id=${ rewardID }]`).with(
                        f('.tt-inline-flex.tt-relative').with(
                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative',
                                {
                                    style: `padding:1rem;text-align:center;min-width:fit-content;width:${ getOffset(container).width.ceil() }px!important`,

                                    async onmouseup({ currentTarget }) {
                                        let rewardID = currentTarget.closest('[data-shop-item-id]')?.dataset?.shopItemId ?? currentTarget.closest('[data-tt-reward-id]')?.dataset?.ttRewardId;
                                        let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

                                        if(nullish(item))
                                            return;

                                        Cache.load(['AutoClaimRewards', 'AutoClaimAnswers'], async({ AutoClaimRewards, AutoClaimAnswers }) => {
                                            AutoClaimRewards ??= {};
                                            AutoClaimAnswers ??= {};

                                            let itemIDs = (AutoClaimRewards[STREAMER.sole] ??= []);
                                            let answers = (AutoClaimAnswers[STREAMER.sole] ??= {});
                                            let index = itemIDs.indexOf(rewardID);

                                            if(!!~index) {
                                                delete answers[rewardID];
                                                itemIDs.splice(index, 1);
                                            } else {
                                                if(item.needsInput) {
                                                    answers[rewardID] = await prompt.silent(`<input hidden controller title='Input required to redeem "${ item.title.replace(/'/g, "&apos;") }"' />${ item.prompt || `Please provide input...` }`);

                                                    if(answers[rewardID] === null)
                                                        return /* The user pressed "Cancel" */;
                                                }

                                                itemIDs.push(rewardID);
                                            }
                                            itemIDs = itemIDs.filter(defined);
                                            answers = Object.filter(answers, itemIDs);

                                            if(!itemIDs.length) {
                                                // No more redemptions in this queue :D
                                                delete AutoClaimRewards[STREAMER.sole];
                                                delete AutoClaimAnswers[STREAMER.sole];
                                            } else {
                                                // There are some redemptions to watch for...
                                                AutoClaimRewards[STREAMER.sole] = itemIDs;
                                                AutoClaimAnswers[STREAMER.sole] = answers;
                                            }

                                            let [node] = [...currentTarget.childNodes].filter(node => node.nodeName.equals('#text'));

                                            node.textContent = (
                                                !~index?
                                                    `Do not buy`:
                                                `Buy when available${ '*'.repeat(+item.needsInput) }`
                                            );

                                            currentTarget.closest('[class*="reward"i][class*="content"i]')?.querySelector('[id$="header"i]')?.setAttribute('rainbow-text', !~index);

                                            Cache.save({ AutoClaimRewards, AutoClaimAnswers });

                                            // @performance
                                            PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
                                        });
                                    },
                                },

                                f('[style=height:2rem; width:2rem]', {
                                    innerHTML: Glyphs.modify('wallet', { style: 'padding-right:.2rem' })
                                }),

                                textContent
                            )
                        )
                    )
                );

                // @performance
                PrepareForGarbageCollection(AutoClaimRewards);
            });

            $('.reward-center-body img')?.closest(':not(img,:only-child)')?.setAttribute('tt-rewards-calc', 'after');
        }, 300);
    }

    __RecordForeignRewards__:
    if(parseBool(Settings.record_foreign_rewards)) {
        Chat.onbullet = async({ element, message, subject, mentions, usable }) => {
            if(!usable)
                return /* The bullet was created before the "Welcome to chat" message (i.e. "Already used") */;

            element = await element;
            subject ||= element.dataset.type;

            let rewardID = element.dataset?.shopItemId ?? element.closest('[data-tt-reward-id]')?.dataset?.ttRewardId ?? element.dataset.uuid;
            let [item] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));

            if(nullish(item))
                return;

            let { id, title } = item;
            let { sole } = STREAMER;

            Cache.load(['AutoClaimRewards'], async({ AutoClaimRewards }) => {
                AutoClaimRewards ??= {};

                let itemIDs = (AutoClaimRewards[sole] ??= []);
                let index = itemIDs.indexOf(rewardID);

                if(!~index)
                    return /* reward not asked for... */;

                RECORD_PURCHASE({ fromUser: false, element, message, subject, mentions, AutoClaimRewards });

                // @performance
                PrepareForGarbageCollection(AutoClaimRewards);
            });
        };
    }

    // Claim Drops → src/plugins/automation/claim-drops.js
    await TTV.run('claim_drops', PLUGIN_CONTEXT);

    /*** First in Line Helpers - NOT A SETTING. Create, manage, and display the "Up Next" balloon
     *      ______ _          _     _         _      _              _    _      _
     *     |  ____(_)        | |   (_)       | |    (_)            | |  | |    | |
     *     | |__   _ _ __ ___| |_   _ _ __   | |     _ _ __   ___  | |__| | ___| |_ __   ___ _ __ ___
     *     |  __| | | '__/ __| __| | | '_ \  | |    | | '_ \ / _ \ |  __  |/ _ \ | '_ \ / _ \ '__/ __|
     *     | |    | | |  \__ \ |_  | | | | | | |____| | | | |  __/ | |  | |  __/ | |_) |  __/ |  \__ \
     *     |_|    |_|_|  |___/\__| |_|_| |_| |______|_|_| |_|\___| |_|  |_|\___|_| .__/ \___|_|  |___/
     *                                                                           | |
     *                                                                           |_|
     */
    // First in Line wait time
    FIRST_IN_LINE_WAIT_TIME = parseInt(
        parseBool(Settings.first_in_line)?
            Settings.first_in_line_time_minutes:
        parseBool(Settings.first_in_line_plus)?
            Settings.first_in_line_plus_time_minutes:
        parseBool(Settings.first_in_line_all)?
            Settings.first_in_line_all_time_minutes:
        parseBool(Settings.first_in_line_now)?
            0:
        0
    ) | 0;

    let ALREADY_RESTORING_DEAD_CHANNEL = false;

    // Restart the First in line que's timers
        // REDO_FIRST_IN_LINE_QUEUE(url:string?<URL>, search:object?) → <Promise>?undefined
    top.REDO_FIRST_IN_LINE_QUEUE =
    async function REDO_FIRST_IN_LINE_QUEUE(url, search = null) {
        if(nullish(url) || (FIRST_IN_LINE_HREF === url && [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].filter(nullish).length < 1))
            return;
        else if(nullish(search))
            url = parseURL(url).addSearch(location.search);
        else
            url = parseURL(url).addSearch((_ => { for(let k in _) if(_[k] === "") delete _[k]; return _ })(search));

        let { href, pathname } = url,
            name = pathname.slice(1),
            channel = await(null
                ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                ?? new Search(name).then(Search.convertResults)
            );

        if(nullish(channel))
            return $error(`Unable to create job for "${ href }"`);

        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        FIRST_IN_LINE_HREF = href;
        GetNextStreamer.cachedStreamer = channel;
        name = (channel.name?.equals(name)? channel.name: name);

        if(!ALL_FIRST_IN_LINE_JOBS.filter(href => href?.length).length)
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

        $log(`[Queue Redo] Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ name }" → ${ href }`, new Date);

        FIRST_IN_LINE_WARNING_JOB = setInterval(async() => {
            let timeRemaining = GET_TIME_REMAINING();

            timeRemaining = timeRemaining < 0? 0: timeRemaining;

            // @TODO: Figure out a single pause controller for First in Line...
            if(!UP_NEXT_ALLOW_THIS_TAB)
                return;
            if(FIRST_IN_LINE_PAUSED)
                return; // Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
            if(timeRemaining > 60_000)
                return /* There's more than 1 minute left */;

            if(defined(STARTED_TIMERS.WARNING))
                return /* There is already a warning pending */;

            STARTED_TIMERS.WARNING = true;

            $log('Heading to stream in', toTimeString(timeRemaining), FIRST_IN_LINE_HREF, new Date);

            let url = parseURL(FIRST_IN_LINE_HREF);

            if(nullish(url.pathname))
                return /* Unknown job */;

            let { name } = await GetNextStreamer();

            if(url.pathname.slice(1).unlike(name))
                name = url.pathname.slice(1);

            confirm
                .timed(`<div hidden controller title="${ (Settings.stream_preview? `Up next: ${ name }`: 'Coming up next...') }" okay="Go now" deny="Skip ${ name }"></div>${ (Settings.stream_preview? '': `Up next: <a href="${ url.href }">${ name }</a>`) }`, timeRemaining)
                .then(action => {
                    if(nullish(action))
                        return /* The event timed out... */;

                    let thisJob = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                        [removed] = ALL_FIRST_IN_LINE_JOBS.splice(thisJob, 1),
                        name = parseURL(removed).pathname.slice(1);

                    $notice(`Heading to Up Next channel (confirmation):`, removed);

                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);

                    // Confirmation OK
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(removed).searchParameters?.redo ?? "") });

                    // @FIXME: Pressing "Skip" may destroy the queue (logically)
                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                        if(action) {
                            // The user clicked "OK"

                            goto(parseURL(FIRST_IN_LINE_HREF).addSearch({ tool: 'first-in-line--ok' }).href);
                        } else {
                            // The user clicked "Cancel"
                            $log('Canceled First in Line event', FIRST_IN_LINE_HREF);

                            let thisJob = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF),
                                [removed] = ALL_FIRST_IN_LINE_JOBS.splice(thisJob, 1),
                                name = parseURL(removed).pathname.slice(1),
                                balloonChild = $(`[id^="tt-balloon-job"i][href$="${ name }"i]`),
                                animationID = (balloonChild?.getAttribute('animationID')) || -1;

                            // $(`button[data-test-selector$="delete"i]`, balloonChild)?.click();

                            clearInterval(animationID);
                            balloonChild?.remove();

                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                        }
                    });
                });

            when.defined(() => $('.tt-confirm-container'))
                .then(container => {
                    $.body.append(furnish('style').with(`.tt-confirm-header { background:#0008 } .tt-confirm-body, .tt-confirm-footer { background:#0000; text-shadow:0 0 1rem #000 }`));
                    container.append(furnish(`iframe[src=https://player.twitch.tv/?channel=${ name }&controls=false&muted=true&parent=twitch.tv&quality=160p]`, { style: 'position:absolute;top:4px;z-index:-9;padding:0;max-width:calc(100% - 4px);max-height:calc(100% - 4px);border-radius:inherit' }));
                });
        }, 1000);

        FIRST_IN_LINE_JOB = setInterval(() => {
            // If the channel disappears (or goes offline), kill the job for it
            // @FIXME: Reanimating First in Line jobs may cause reloading issues?
            let index = ALL_CHANNELS.findIndex(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(FIRST_IN_LINE_HREF)),
                channel = ALL_CHANNELS[index],
                timeRemaining = GET_TIME_REMAINING();

            timeRemaining = timeRemaining < 0? 0: timeRemaining;

            // The timer is paused
            if(!UP_NEXT_ALLOW_THIS_TAB)
                return;
            if(FIRST_IN_LINE_PAUSED)
                return; // Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });

            if(nullish(channel) && !ALREADY_RESTORING_DEAD_CHANNEL) {
                if(nullish(FIRST_IN_LINE_HREF))
                    return;

                $log('Restoring dead channel (interval)...', FIRST_IN_LINE_HREF);

                let { href, pathname } = parseURL(FIRST_IN_LINE_HREF),
                    channelID = UUID.from(pathname).value;

                if(nullish(pathname))
                    return;
                ALREADY_RESTORING_DEAD_CHANNEL = true;

                let name = pathname.slice(1);

                new Search(name)
                    .then(Search.convertResults)
                    .then(streamer => {
                        let restored = ({
                            from: 'SEARCH',
                            href,
                            icon: (typeof streamer.icon == 'string'? Object.assign(new String(streamer.icon), parseURL(streamer.icon)): null),
                            live: parseBool(streamer.live),
                            name: streamer.name,
                        });

                        ALREADY_RESTORING_DEAD_CHANNEL = false;
                        ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                        ALL_FIRST_IN_LINE_JOBS[index] = restored;
                    })
                    .catch(error => {
                        ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length).filter(url => parseURL(url).pathname != parseURL(FIRST_IN_LINE_HREF).pathname);
                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                            $warn(error);
                        });
                    });
            }

            // Don't act until 1sec is left
            if(timeRemaining > 1000)
                return;

            /* After above is `false` */

            Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(), ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(url => parseURL(url).pathname.toLowerCase() != parseURL(FIRST_IN_LINE_HREF).pathname.toLowerCase()) }, (href = parseURL(channel?.href ?? FIRST_IN_LINE_HREF).addSearch({ ...(parseURL(FIRST_IN_LINE_HREF).searchParameters ?? {}) }).href) => {
                $log('Heading to stream now [Job Interval]', href);

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                goto(parseURL(href).addSearch({ tool: 'first-in-line--timeout' }).href);
            });
        }, 1000);
    };

    top.NEW_DUE_DATE =
    function NEW_DUE_DATE(offset) {
        if(!UP_NEXT_ALLOW_THIS_TAB)
            return (+new Date) + 3_600_000;

        return (+new Date) + (null
            ?? offset
            ?? FIRST_IN_LINE_WAIT_TIME * 60_000
        );
    };

    top.GET_TIME_REMAINING =
    function GET_TIME_REMAINING() {
        if(!UP_NEXT_ALLOW_THIS_TAB)
            return 3_600_000;

        let now = (+new Date),
            due = FIRST_IN_LINE_DUE_DATE;

        return (due - now);
    };

    FIRST_IN_LINE_SAFETY_CATCH =
    setInterval(() => {
        let job = $('[up-next--body] [name][time]');

        if(nullish(job))
            return;

        let timeRemaining = parseInt(job.getAttribute('time'));

        if(timeRemaining <= 60_000 && nullish('.tt-confirm'))
            wait(60_000).then(() => {
                $warn(`Mitigation for Up Next: Loose interval @ ${ location } / ${ new Date }`)
                    // .toNativeStack();

                let { name } = GetNextStreamer.cachedStreamer;

                confirm
                    .timed(`Coming up next: <a href='./${ name }'>${ name }</a>`, timeRemaining)
                    .then(action => {
                        if(nullish(action))
                            return /* The event timed out... */;

                        // Does NOT touch the cache

                        if(action) {
                            // The user clicked "OK"

                            goto(parseURL(`./${ name }`).addSearch({ tool: `up-next--ok` }).href);
                        } else {
                            // The user clicked "Cancel"
                            let balloonChild = $(`[id^="tt-balloon-job"i][href$="/${ name }"i]`),
                                animationID = (balloonChild?.getAttribute('animationID')) || -1;

                            clearInterval(animationID);
                            balloonChild?.remove();
                        }
                    });

                // top.open(href, '_self');
            });

        clearInterval(FIRST_IN_LINE_SAFETY_CATCH);
    }, 1000);

    let FIRST_IN_LINE_BALLOON__INSURANCE =
    setInterval(() => {
        if(NORMAL_MODE && nullish(FIRST_IN_LINE_BALLOON)) {
            FIRST_IN_LINE_BALLOON = new Balloon({ title: 'Up Next', icon: (UP_NEXT_ALLOW_THIS_TAB? 'calendar': 'error') });

            let imgSize = '70px';

            // Pin: Go to this person when the stream(s) end
            let pinned_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'pinned-streamer',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'pinned',
                onclick: async event => {
                    let { currentTarget } = event,
                        parent = currentTarget.closest('[id^="tt-balloon-container"i]');

                    let f = furnish;
                    let body = $('#tt-reminder-listing'),
                        search = $('#tt-pinned-search');

                    if(defined(body))
                        return body?.remove();
                    else
                        body = f(`#tt-reminder-listing`);

                    search = f(`input#tt-pinned-search.input.autocomplete[autocomplete=false][spellcheck=false][placeholder="Search for a streamer, game or description here... Esc to exit"]`, {
                        style: 'margin-top:1px',
                        onkeyup: delay(async event => {
                            let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event,
                                value = (target?.value ?? target?.textContent ?? target?.innerText ?? "").trim();

                            let terms = value.split(/\s+/).map(term => ['name', 'game', 'desc'].map(type => `[${ type }*="${ term }"i]`).join(','));

                            if(value.length)
                                AddCustomCSSBlock(target.id, `#${ target.id }-form ~ :not(${ terms.join(',') }) { display: none }`);
                            else
                                RemoveCustomCSSBlock(target.id);
                            target.setAttribute('value', value);
                        }, 250),
                    });

                    body.with(
                        f(`form#${ search.id }-form[action=#]`, { style: 'position:sticky; top:4rem; z-index:99999' })
                            .with(search)
                    );

                    let SearchableNames = new Set(ALL_CHANNELS.map(c => c.name));
                    let WantedNames = new Set(STREAMERS.map(c => c.name));

                    Cache.load('LiveReminders', async({ LiveReminders }) => {
                        try {
                            LiveReminders = JSON.parse(LiveReminders || '{}');
                        } catch(error) {
                            // Probably an object already...
                            LiveReminders ??= {};
                        }

                        for(let { name } in LiveReminders) {
                            SearchableNames.add(name);
                            WantedNames.add(name);
                        }

                        // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_autocomplete

                        // @performance
                        PrepareForGarbageCollection(LiveReminders);
                    });

                    parent.insertBefore(body, $('[up-next--body] > :nth-child(2)'));

                    listing:
                    for(let name of SearchableNames) {
                        if(nullish(name))
                            continue listing;

                        let channel = (null
                            ?? ALL_CHANNELS.find(c => c.name.equals(name))
                            ?? await new Search(name).then(Search.convertResults)
                        );

                        if(nullish(channel))
                            continue listing;

                        let _name = name.toLowerCase();
                        let { icon, live } = channel;
                        let pinned = parseBool(GetNextStreamer.pinnedStreamer?.equals(name));
                        let wanted = WantedNames.has(name);
                        let current = name.equals(STREAMER.name);

                        let desc = (STREAMER.jump?.[_name]?.title ?? '');
                        let game = (STREAMER.jump?.[_name]?.stream?.game?.name ?? '');

                        autocomplete(search, { [name]: [name, game, desc].filter(s => s.length).join(' - ') });

                        let container = f(`.tt-pinnable`, { name, game, desc, live, style: `animation:fade-in 1s 1; background:var(--color-background-${ pinned? 'chat': 'base' })` },
                            f('.simplebar-scroll-content',
                                {
                                    style: 'overflow: hidden;',
                                },
                                f('.simplebar-content',
                                    {
                                        style: 'overflow: hidden; width:100%;',
                                    },
                                    f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]').with(
                                        f('.persistent-notification.tt-relative[@testSelector=persistent-notification]',
                                            {
                                                style: 'width:100%',
                                            },
                                            f('.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap').with(
                                                f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]',
                                                    {
                                                        // Sometimes, Twitch likes to default to `_blank`
                                                        target: '_self',

                                                        '@pinned': pinned,
                                                        '@name': name,
                                                        '@icon': icon,
                                                        href: `#\uD83D\uDCCC${ name }`,
                                                        style: `color:inherit!important`,

                                                        onmouseup(event) {
                                                            event.preventDefault(true);

                                                            let { currentTarget } = event;
                                                            let pinned = parseBool(currentTarget.dataset.pinned);
                                                            let oldValue, newValue;

                                                            unpin: if(defined(GetNextStreamer.pinnedStreamer)) {
                                                                let pidged = $(`.tt-pinnable [data-name="${ GetNextStreamer.pinnedStreamer }"i]`);

                                                                if(nullish(pidged))
                                                                    break unpin;

                                                                oldValue = { ...pidged.dataset };
                                                                pidged.dataset.pinned = false;
                                                                pidged.closest('.tt-pinnable').modStyle(`background:var(--color-background-base);`);
                                                                $('.tt-balloon-message strong', pidged).modStyle(`color:!delete`);
                                                                $('strong', pidged).html(`${ name } &bull; Click to pin \uD83D\uDCCC`);

                                                                pidged.closest('form')?.insertAdjacentElement('afterend', pidged.closest('.tt-pinnable'));
                                                            }

                                                            if(pinned) {
                                                                delete GetNextStreamer.pinnedStreamer;
                                                                $('#pinned-streamer').innerHTML = Glyphs.pinned;

                                                                Cache.remove(['PinnedStreamer']);
                                                            } else {
                                                                newValue = { ...currentTarget.dataset };
                                                                pinned = currentTarget.dataset.pinned = true;
                                                                GetNextStreamer.pinnedStreamer = currentTarget.dataset.name;
                                                                $('#pinned-streamer').innerHTML = furnish(`.tt-border-radius-rounded`).with(furnish.img({ src: currentTarget.dataset.icon, style: `min-width:calc(${ imgSize }/2); border-radius:${ imgSize }` })).outerHTML;

                                                                currentTarget.closest('.tt-pinnable').modStyle(`background:var(--color-background-chat);`);
                                                                $('.tt-balloon-message strong', currentTarget).modStyle(`color:var(--color-amazon)`);
                                                                $('strong', currentTarget).html(`${ name } &bull; Pinned. Click to unpin`);

                                                                currentTarget.closest('[id$="listing"i]').querySelector('form')?.insertAdjacentElement('beforeend', currentTarget.closest('.tt-pinnable'));

                                                                Cache.save({ PinnedStreamer: GetNextStreamer.pinnedStreamer });
                                                            }

                                                            Runtime.sendMessage({ action: `UPDATE_PINNED_STREAMER`, oldValue, newValue  });
                                                        },
                                                    },
                                                    f('.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1').with(
                                                        // Avatar
                                                        f.div(
                                                            f('.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden').with(
                                                                f('.tt-aspect.tt-aspect--align-top').with(
                                                                    f('img.tt-balloon-avatar.tt-image', { src: icon, style: `min-width:${ imgSize }` })
                                                                )
                                                            )
                                                        ),
                                                        // Message body
                                                        f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1', { style: `max-width:calc(100% - ${ imgSize })` }).with(
                                                            f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                                f('span.tt-c-text-alt').with(
                                                                    f('p.tt-balloon-message').with(
                                                                        f.span(
                                                                            f(`strong`, { innerHTML: `${ name } &bull; ${pinned? "Pinned. Click to unpin": "Click to pin \uD83D\uDCCC"}`, style: (pinned? 'color:var(--color-amazon)': '') })
                                                                        )
                                                                    )
                                                                )
                                                            ),
                                                            // Subheader
                                                            f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', { style: `max-width:100%` }).with(
                                                                f(`[style="max-width:inherit"]`).with(
                                                                    f(`p.tt-hide-text-overflow`, { style: `text-indent:.25em; max-width:inherit` }).setTooltip(desc, { from: 'top' }).with(desc)
                                                                )
                                                            ),
                                                            // Footer (persistent)
                                                            f('.tt-footer').with(
                                                                f(`span.tt-${ (live? 'live': 'offline') }`, {
                                                                    style: `min-width:3.5em; background-color:var(--color-background-${ (current? 'accent': wanted? live? 'live': 'alt-2': 'brand') })`
                                                                }, (current? 'viewing': wanted? live? 'live': 'offline': 'suggested').toUpperCase())
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        );

                        if(pinned)
                            search.insertAdjacentElement('afterend', container);
                        else
                            body.append(container);
                    }
                },
            });

            pinned_button.tooltip = new Tooltip(pinned_button, 'Pin a user to go to when the queue is <em>empty</em> and <em>offline</em>');
            if(defined(GetNextStreamer.pinnedStreamer))
                when.sated(() => ALL_CHANNELS).then(A_C =>
                    pinned_button.innerHTML = furnish(`.tt-border-radius-rounded`).with(
                        furnish.img({
                            src: (null
                                ?? A_C.find(c => c.name.equals(GetNextStreamer.pinnedStreamer))?.icon
                                ?? `https://static-cdn.jtvnw.net/ttv-static-metadata/twitch_logo3.jpg`
                            ),
                            style: `min-width:calc(${ imgSize }/2); border-radius:${ imgSize }`,
                        })
                    ).outerHTML
                );

            // Up Next Boost Button
            let first_in_line_boost_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'up-next-boost',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'latest',
                onclick: event => {
                    let { currentTarget } = event,
                        speeding = parseBool(currentTarget.getAttribute('speeding'));

                    speeding = (FIRST_IN_LINE_BOOST = !speeding);
                    speeding = (FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS?.length > 0);

                    currentTarget.querySelector('svg[fill]')?.setAttribute('fill', 'currentcolor');
                    currentTarget.querySelector('svg[fill]')?.modStyle(`opacity:${ 2**-!speeding }; fill:currentcolor`);
                    currentTarget.setAttribute('speeding', speeding);

                    if(defined(currentTarget.tooltip))
                        currentTarget.tooltip.innerHTML = `${ ['Start','Stop'][+speeding] } rushing the queue`;

                    let up_next_button = $('[up-next--container] button');

                    up_next_button?.setAttribute('allowed', parseBool(UP_NEXT_ALLOW_THIS_TAB));
                    up_next_button?.setAttribute('speeding', parseBool(speeding));

                    let oneMin = 60_000,
                        fiveMin = 5.5 * oneMin,
                        tenMin = 10 * oneMin;

                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(
                        FIRST_IN_LINE_TIMER = (
                            // If the streamer hasn't been on for longer than 10mins, wait until then
                            STREAMER.time < tenMin?
                                (
                                    // Boost is enabled
                                    FIRST_IN_LINE_BOOST?
                                        fiveMin + (tenMin - STREAMER.time):
                                    // Boost is disabled
                                    FIRST_IN_LINE_WAIT_TIME * oneMin
                                ):
                            // Streamer has been live longer than 10mins
                            (
                                // Boost is enabled
                                FIRST_IN_LINE_BOOST?
                                    // Boost is enabled
                                    Math.min(GET_TIME_REMAINING(), fiveMin):
                                // Boost is disabled
                                FIRST_IN_LINE_WAIT_TIME * oneMin
                            )
                        )
                    );

                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                    $.all(`[up-next--body] [time]`).forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER));

                    Cache.save({ FIRST_IN_LINE_BOOST, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });
                },
            });

            // Pause Button
            let first_in_line_pause_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'up-next-control',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'pause',
                onclick: event => {
                    let { currentTarget } = event,
                        paused = parseBool(currentTarget.getAttribute('paused')?.equals('true'));

                    paused = !paused;

                    currentTarget.innerHTML = Glyphs[['pause','play'][+paused]];
                    currentTarget.setAttribute('paused', FIRST_IN_LINE_PAUSED = paused);
                    currentTarget.setAttribute('paused-at', FIRST_IN_LINE_PAUSED_AT = +new Date);

                    if(defined(currentTarget.tooltip))
                        currentTarget.tooltip.innerHTML = `${ ['Pause','Resume'][+paused] } the queue`;
                },
            });

            // Live Reminders: Lists the live reminders onclick
            let live_reminders_catalog_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'live-reminders-catalog',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'notify',
                left: true,
                onclick: async event => {
                    let { currentTarget } = event,
                        parent = currentTarget.closest('[id^="tt-balloon-container"i]');

                    Cache.load(['LiveReminders', 'ChannelPoints', 'DVRChannels'], async({ LiveReminders = null, ChannelPoints = {}, DVRChannels = null }) => {
                        try {
                            LiveReminders = JSON.parse(LiveReminders || '{}');
                        } catch(error) {
                            // Probably an object already...
                            LiveReminders ??= {};
                        }

                        try {
                            DVRChannels = JSON.parse(DVRChannels || '{}');
                        } catch(error) {
                            // Probably an object already...
                            DVRChannels ??= {};
                        }

                        let Hash = {
                            live_reminders: UUID.from(JSON.stringify(LiveReminders)).value,
                            dvr_channels: UUID.from(JSON.stringify(DVRChannels)).value,
                        };

                        let f = furnish;
                        let body = $('#tt-reminder-listing'),
                            head = $('[up-next--header]'),
                            search = $('#tt-reminder-search');

                        if(defined(body)) {
                            live_reminders_catalog_button.innerHTML = Glyphs.modify('notify', { height: '20px', width: '20px' });
                            live_reminders_catalog_button.tooltip.innerHTML = 'View Live Reminders';
                            head.innerHTML = 'Up Next';

                            return body?.remove();
                        } else {
                            live_reminders_catalog_button.innerHTML = Glyphs.modify('calendar', { height: '20px', width: '20px' });
                            live_reminders_catalog_button.tooltip.innerHTML = 'View Up Next';
                            head.innerHTML = 'Live Reminders';
                        }

                        body = f(`#tt-reminder-listing`);

                        if(Object.keys(LiveReminders).length > 6) {
                            search = f(`input#tt-reminder-search.input.autocomplete[autocomplete=false][spellcheck=false][placeholder="Search for a streamer, game or description here... Esc to exit"]`, {
                                style: 'margin-top:1px',
                                onkeyup: delay(async event => {
                                    let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event,
                                        value = (target?.value ?? target?.textContent ?? target?.innerText ?? "").trim();

                                    let terms = value.split(/\s+/).map(term => ['name', 'game', 'desc'].map(type => `[${ type }*="${ term }"i]`).join(','));

                                    if(value.length)
                                        AddCustomCSSBlock(target.id, `#${ target.id }-form ~ :not(${ terms.join(',') }) { display: none }`);
                                    else
                                        RemoveCustomCSSBlock(target.id);
                                    target.setAttribute('value', value);
                                }, 250),
                            });

                            // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_autocomplete

                            autocomplete(search, LiveReminders);

                            body.with(
                                f(`form#${ search.id }-form[action=#]`, { style: 'position:sticky; top:4rem; z-index:99999' })
                                    .with(search)
                            );
                        }

                        parent.insertBefore(body, $('[up-next--body] > :nth-child(2)'));

                        // List all reminders, in order of their last live time
                        let { abs, random, round } = Math;
                        let reminders = [];
                        let now = new Date,
                            today = now.toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }),
                            yesterday = new Date(+now - 86_400_000).toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' });

                        sorting:
                        for(let reminderName in LiveReminders)
                            reminders.push({ name: reminderName, time: new Date(LiveReminders[reminderName]) });
                        reminders = reminders.sort((a, b) => (abs(+now - +a.time) < abs(+now - +b.time))? -1: +1);

                        if(!reminders.length)
                            return await alert.timed(`There are no Live Reminders to display<p tt-x>${ (new UUID) }</p>`, 7000);

                        listing:
                        for(let index = 0; index < reminders.length; ++index) {
                            if($.nullish(`#tt-reminder-listing`))
                                break listing;

                            let { length } = reminders;
                            let { name, time } = reminders[index];
                            let channel = await new Search(name).then(Search.convertResults),
                                ok = parseBool(channel?.ok);

                            // Search did not complete...
                            let num = 3;
                            while(!ok && num-- > 0 && $.defined(`#tt-reminder-listing`)) {
                                delete channel;

                                Search.void(name);

                                // @research
                                channel = await new Search(name).then(Search.convertResults);
                                ok = parseBool(channel?.ok);

                                // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [Catalog]: "${ name }" → OK = ${ ok }`);
                            }

                            if(!num && !ok) {
                                channel = ALL_CHANNELS.find(channel => channel.name.equals(name));

                                if(nullish(channel?.name))
                                    continue listing;
                            }

                            let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name] ?? 0).toString().split('|'),
                                sole = face?.split('/')?.map(parseFloat)?.shift();

                            // Correct for changed usernames
                            if(!ok) try {
                                let definitiveID = await new Search(name, 'sniffer', 'getID');

                                if(nullish(definitiveID)) {
                                    let real = await new Search(sole, 'sniffer', 'getName');

                                    $warn(`Updating details about (#${ sole }) "${ name }" → "${ real }"`);

                                    // Correct the cache...
                                    Cache.load(`data/${ name }`, cache => {
                                        Cache.save({ [`data/${ real }`]: cache[`data/${ name }`] });
                                        Cache.remove(`data/${ name }`);
                                    });

                                    // Correct the channel points...
                                    ChannelPoints[real] = ChannelPoints[name];
                                    delete ChannelPoints[name];

                                    Cache.save({ ChannelPoints });

                                    // Correct the live reminders...
                                    LiveReminders[real] = LiveReminders[name];
                                    delete LiveReminders[name];

                                    Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                                    // Continue with the new name...
                                    reminders.push({ name: real, time });

                                    // @performance
                                    PrepareForGarbageCollection(LiveReminders);
                                    continue listing;
                                }
                            } catch(error) {
                                // Continue with the bad data?
                                if(nullish(channel))
                                    continue listing;
                            }

                            // Legacy reminders... | v4.26 → v4.27
                            let legacy = +now < +time;

                            if(nullish(channel))
                                continue listing;

                            let real = new Date(channel.data?.actualStartTime || 0);

                            let day = time.toLocaleDateString(top.LANGUAGE, { dateStyle: 'short' }),
                                hour = time.toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }),
                                recent = (abs(+now - +time) / 3_600_000 < 24),
                                live = (+real > +time) || await Search.getUserStatus(name),
                                [since] = toTimeString((live && time < now? now - time: abs(now - time)), '~hour hour|~minute minute|~second second').split('|').filter(parseFloat),
                                [tense_A, tense_B] = [['',' ago'],['in ','']][+legacy];

                            let _name = name.toLowerCase();
                            let { href = `./${ _name }`, icon = Runtime.getURL('profile.png'), desc = (STREAMER.jump?.[_name]?.title ?? '') } = channel;
                            let coinStyle = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px' }),
                                coinText =
                                    furnish('span.tt-live-reminder-point-amount[bottom-only]', {
                                        'rainbow-border': notEarned == 0,
                                        innerHTML: amount.replace('.0', '').toLocaleString(LANGUAGE),
                                    }).outerHTML,
                                coinIcon = (
                                    face?.contains('/')?
                                        furnish('span.tt-live-reminder-point-face', {
                                            innerHTML: furnish('img', { src: `https://static-cdn.jtvnw.net/channel-points-icons/${ face }`, style: coinStyle.toString() }).outerHTML,
                                        }):
                                    furnish('span.tt-live-reminder-point-face', {
                                        innerHTML: Glyphs.modify('channelpoints', { style: `vertical-align:bottom; ${ coinStyle.toString() }` }),
                                    })
                                ).outerHTML;

                            let game = (STREAMER.jump?.[_name]?.stream?.game?.name ?? ''),
                                primaryColor = Color.destruct(STREAMER.jump?.[_name]?.primaryColorHex || '9147ff'),
                                primaryColorDarker = `hsl(${ primaryColor.H }deg,${ primaryColor.S }%,${ (primaryColor.L * .9).clamp(0, 75) }%)`,
                                primaryColorLighter = `hsl(${ primaryColor.H }deg,${ primaryColor.S }%,${ (primaryColor.L * 1.1).clamp(25, 100) }%)`;

                            let liveFontColor = (THEME.equals('dark')? Color.white: Color.black);
                            let [liveBGColor] = [primaryColor.HEX, primaryColorDarker, primaryColorLighter].map(Color.destruct).sort((a, b) => Color.contrast(liveFontColor, [b.R, b.G, b.B]) - Color.contrast(liveFontColor, [a.R, a.G, a.B]));

                            let status = `<span class="tt-${ (live? 'live': 'offline') }" style="min-width:3.5em;${ (!live? '': `background-color:${ liveBGColor.HEX }`) }">${ (live? 'LIVE': recent? tense_A + since.pluralSuffix(parseFloat(since)) + tense_B: [day, hour].join(' ')) }</span>`;

                            let DVR_ON = parseBool(DVRChannels[_name]);

                            if((game || desc)?.length)
                                autocomplete(search, { [name]: [name, game, desc].filter(s => s.length).join(' - ') });

                            let imgSize = '70px';

                            let container = f(`.tt-reminder`, { name, game, desc, live, style: `animation:fade-in 1s 1; background:var(--color-background-base)` },
                                f('.simplebar-scroll-content',
                                    {
                                        style: 'overflow: hidden;',
                                    },
                                    f('.simplebar-content',
                                        {
                                            style: 'overflow: hidden; width:100%;',
                                        },
                                        f('.tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]').with(
                                            f('.persistent-notification.tt-relative[@testSelector=persistent-notification]',
                                                {
                                                    style: 'width:100%',
                                                },
                                                f('.persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap').with(
                                                    f('a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]',
                                                        {
                                                            // Sometimes, Twitch likes to default to `_blank`
                                                            'target': '_self',

                                                            href,
                                                        },
                                                        f('.persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1').with(
                                                            // Avatar
                                                            f.div(
                                                                f('.tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden', { style: (!live? '': `border:3px solid ${ primaryColor.HEX }`) },
                                                                    f('.tt-aspect.tt-aspect--align-top').with(
                                                                        f('img.tt-balloon-avatar.tt-image', { src: icon, style: `min-width:${ imgSize }` })
                                                                    )
                                                                )
                                                            ),
                                                            // Message body
                                                            f('.tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1', { style: `max-width:calc(100% - ${ imgSize })` }).with(
                                                                f('.persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]').with(
                                                                    f('span.tt-c-text-alt').with(
                                                                        f('p.tt-balloon-message').with(
                                                                            !live?
                                                                                f.strong(name):
                                                                            f.span(
                                                                                f(`strong`, { innerHTML: [name, game].filter(s => s.length).join(' &mdash; ') }),
                                                                                f(`span.tt-time-elapsed[start=${ (+real > +time? real: time).toJSON() }]`).with(hour),
                                                                                f(`p.tt-hide-text-overflow[style=text-indent:.25em]`).setTooltip(desc, { from: 'top' }).with(desc)
                                                                            )
                                                                        )
                                                                    )
                                                                ),
                                                                // Subheader
                                                                f('.tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05', { style: `max-width:100%` }).with(
                                                                    f('.tt-mg-l-05', { style: `max-width:inherit` }).with(
                                                                        f('span.tt-balloon-subheader.tt-c-text-alt', { style: `max-width:inherit` }).html([status, coinIcon + coinText].join(' &bull; '))
                                                                    )
                                                                ),
                                                                // Footer (persistent)
                                                                f('div', {/* ... */})
                                                            )
                                                        )
                                                    ),
                                                    f('.persistent-notification__delete.tt-absolute.tt-pd-l-1', { style: `top:0.0rem; right:0` },
                                                        f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]',
                                                                {
                                                                    name,

                                                                    onmouseup: event => {
                                                                        let { currentTarget } = event,
                                                                            name = currentTarget.getAttribute('name');

                                                                        Cache.load('LiveReminders', async({ LiveReminders }) => {
                                                                            try {
                                                                                LiveReminders = JSON.parse(LiveReminders || '{}');
                                                                            } catch(error) {
                                                                                // Probably an object already...
                                                                                LiveReminders ??= {};
                                                                            }

                                                                            let justInCase = { ...LiveReminders[name] };

                                                                            $(`.tt-reminder[name="${ name }"i]`)?.remove();
                                                                            delete LiveReminders[name];
                                                                            Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                                                                            await confirm
                                                                                .timed(`Reminder for <a href="/${ name }">${ name }</a> removed successfully!<p tt-x>${ UUID.from(name).value }</p>`, 5000)
                                                                                .then(ok => {
                                                                                    // The user pressed "Cancel"
                                                                                    if(ok === false)
                                                                                        Cache.save({ LiveReminders: { ...LiveReminders, [name]: justInCase } }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                                                                });
                                                                        });
                                                                    },
                                                                },
                                                                f('span.tt-button-icon__icon').with(
                                                                    f('div',
                                                                        {
                                                                            style: 'height:1.6rem; width:1.6rem',
                                                                            innerHTML: Glyphs.ignore,
                                                                        }
                                                                    )
                                                                )
                                                            ).setTooltip(`Remove ${ name } from Live Reminders`, { from: 'top' })
                                                        )
                                                    ),
                                                    f('.persistent-notification__popout.tt-absolute.tt-pd-l-1', { style: `top:2.5rem; right:0` },
                                                        f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                            f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]',
                                                                {
                                                                    name,

                                                                    onmouseup: event => {
                                                                        let { currentTarget } = event,
                                                                            name = currentTarget.getAttribute('name');

                                                                        MiniPlayer = name;
                                                                    },
                                                                },
                                                                f('span.tt-button-icon__icon').with(
                                                                    f('div',
                                                                        {
                                                                            style: 'height:1.6rem; width:1.6rem',
                                                                            innerHTML: Glyphs.picture_in_picture,
                                                                        }
                                                                    )
                                                                )
                                                            ).setTooltip(`Send to MiniPlayer`, { from: 'top' })
                                                        )
                                                    ),
                                                    (
                                                        parseBool(Settings.video_clips__dvr)?
                                                            f('.persistent-notification__popout.tt-absolute.tt-pd-l-1', { style: `top:5rem; right:0` },
                                                                f('.tt-align-items-start.tt-flex.tt-flex-nowrap').with(
                                                                    f('button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]',
                                                                        {
                                                                            name,

                                                                            onmouseup: event => {
                                                                                let { currentTarget } = event,
                                                                                    name = currentTarget.getAttribute('name');

                                                                                Cache.load('DVRChannels', async({ DVRChannels }) => {
                                                                                    try {
                                                                                        DVRChannels = JSON.parse(DVRChannels || '{}');
                                                                                    } catch(error) {
                                                                                        // Probably an object already...
                                                                                        DVRChannels ??= {};
                                                                                    }

                                                                                    let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                                                                        DVR_ID = name.toLowerCase(),
                                                                                        enabled = !parseBool(DVRChannels[DVR_ID]?.length),
                                                                                        [title, subtitle, icon] = [
                                                                                            ['Turn DVR on', `${ s(name) } live streams will be recorded`, 'host'],
                                                                                            ['Turn DVR off', `${ s(name) } live streams will no longer be recorded`, 'clip']
                                                                                        ][+!!enabled];

                                                                                    icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                                                                                    $('.tt-button-icon__icon', currentTarget).innerHTML = icon;

                                                                                    // Add the DVR...
                                                                                    let message;
                                                                                    if(enabled) {
                                                                                        message = `${ s(name) } streams will be recorded.`;

                                                                                        DVRChannels[DVR_ID] = new ClipName(2);
                                                                                    }
                                                                                    // Remove the DVR...
                                                                                    else {
                                                                                        message = `${ name } will not be recorded.`;

                                                                                        delete DVRChannels[DVR_ID];
                                                                                    }

                                                                                    // @FIXME: Live Reminder alerts will not display if another alert is present...
                                                                                    Cache.save({ DVRChannels }, () => Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch($warn));
                                                                                });
                                                                            },
                                                                        },
                                                                        f('span.tt-button-icon__icon').with(
                                                                            f('div',
                                                                                {
                                                                                    style: 'height:1.6rem; width:1.6rem',
                                                                                    innerHTML: Glyphs.modify(['host','clip'][+DVR_ON], { style: `fill:${ ['currentcolor','#f59b00'][+DVR_ON] }` }),
                                                                                }
                                                                            )
                                                                        )
                                                                    ).setTooltip(`${ ['Start', 'Stop'][+DVR_ON] } recording ${ name }'${ /s$/.test(name)? '': 's' } streams`, { from: 'top' })
                                                                )
                                                            )
                                                        // DVR is NOT enabled, so don't show anything here...
                                                        : ''
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            );

                            let lastOnline = $.all('.tt-reminder[live="true"i]', body).pop(),
                                [firstOffline] = $.all('.tt-reminder[live="false"i]', body);

                            if(defined(firstOffline) && live)
                                firstOffline.insertAdjacentElement('beforebegin', container);
                            else if(defined(lastOnline) && live)
                                lastOnline.insertAdjacentElement('afterend', container);
                            else
                                body.append(container);

                            // Update to the new date...
                            if(+real > +time)
                                LiveReminders[name].time = real;

                            // And remember kids, never ask a question on StackOverflow
                            // If anyone besides me ever reads this, I answered my own question eventually
                            // Remember to take breaks and tackle the problem at a later date
                                // https://stackoverflow.com/q/72803095/4211612
                            // Move the channels around to prioritize live ones... Does NOT need to be exact
                            if(live) {
                                let data = LiveReminders[name];

                                delete LiveReminders[name];

                                LiveReminders = { [name]: data, ...LiveReminders };
                            }

                            // Loading reminders (progress bar)...
                            $('[up-next--body] > *')?.modStyle(`border-bottom:2px solid #0000; transition:border .5s; border-image:linear-gradient(90deg, var(--user-complement-color) ${ (100 * (index / length)).toFixed(0) }%, #0000 0) 1;`);
                        }

                        wait(500)
                            .then(() => $('[up-next--body] > *').modStyle('border-bottom:2px solid #0000; transition:border .5s; border-image:linear-gradient(90deg, #0000, #0000) 1;'));

                        if(false
                            || (Hash.live_reminders != UUID.from(JSON.stringify(LiveReminders)).value)
                            || (Hash.dvr_channels != UUID.from(JSON.stringify(DVRChannels)).value)
                        )
                            Cache.save({ LiveReminders, DVRChannels }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders), 'DVR_CHANNELS': Object.keys(DVRChannels) }));

                        // @performance
                        PrepareForGarbageCollection(LiveReminders, ChannelPoints, DVRChannels);
                    });
                },
            });

            live_reminders_catalog_button.tooltip ??= new Tooltip(live_reminders_catalog_button, 'View Live Reminders');

            LIVE_REMINDERS__LISTING_INTERVAL ??=
            setInterval(() => {
                for(let span of $.all('.tt-time-elapsed'))
                    span.innerHTML = toTimeString(+new Date - +new Date(span.getAttribute('start')), '<&days=:>!hour:!minute:!second');
            }, 1000);

            // Help Button
            let first_in_line_help_button = FIRST_IN_LINE_BALLOON?.addButton({
                attributes: {
                    id: 'up-next-help',
                    contrast: THEME__PREFERRED_CONTRAST,
                },

                icon: 'help',
                left: true,
            }),
                [accent, contrast] = (Settings.accent_color ?? 'blue/12').split('/'),
                [colorName] = accent.split('-').reverse();

            first_in_line_help_button.tooltip ??= new Tooltip(first_in_line_help_button, 'Drop a channel here to queue it');

            // Update the color name...
            setInterval(() => {
                let thematicColor = Color.getName(THEME.equals('dark')? THEME__CHANNEL_DARK: THEME__CHANNEL_LIGHT);
                let textShadow = (['black', 'white'].contains(thematicColor)? `text-shadow:0 0 2px ${ THEME.equals('dark')? 'black': 'white' }`: '');

                // Swap to correct :P
                thematicColor = ({ black: 'white', white: 'black' }[thematicColor]) ?? thematicColor;

                first_in_line_help_button.tooltip.innerHTML = (
                    UP_NEXT_ALLOW_THIS_TAB?
                        `Drop a channel in the <span style="color:var(--user-accent-color); ${ textShadow }">${ colorName }</span> area to queue it`:
                    `Up Next is disabled for this tab`
                ).replace(/\bcolored\b/g, () => thematicColor);
            }, 1000);

            // Load cache
            Cache.load(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
                let oneMin = 60_000,
                    fiveMin = 5.5 * oneMin,
                    tenMin = 10 * oneMin;

                [FIRST_IN_LINE_HREF] = ALL_FIRST_IN_LINE_JOBS = (cache.ALL_FIRST_IN_LINE_JOBS ?? []);
                FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && parseBool(ALL_FIRST_IN_LINE_JOBS?.length);
                FIRST_IN_LINE_DUE_DATE = (null
                    ?? cache.FIRST_IN_LINE_DUE_DATE
                    ?? (
                        NEW_DUE_DATE(
                            FIRST_IN_LINE_TIMER = (
                                // If the streamer hasn't been on for longer than 10mins, wait until then
                                STREAMER.time < tenMin?
                                    (
                                        // Boost is enabled
                                        FIRST_IN_LINE_BOOST?
                                            fiveMin + (tenMin - STREAMER.time):
                                        // Boost is disabled
                                        FIRST_IN_LINE_WAIT_TIME * oneMin
                                    ):
                                // Streamer has been live longer than 10mins
                                (
                                    // Boost is enabled
                                    FIRST_IN_LINE_BOOST?
                                        Math.min(GET_TIME_REMAINING(), fiveMin):
                                    // Boost is disabled
                                    FIRST_IN_LINE_WAIT_TIME * oneMin
                                )
                            )
                        )
                    )
                );

                if(FIRST_IN_LINE_BOOST) {
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(Math.min(GET_TIME_REMAINING(), fiveMin));

                    wait(5000).then(() => $.all('[up-next--body] [time]:not([index="0"])').forEach(element => element.setAttribute('time', FIRST_IN_LINE_TIMER = fiveMin)));

                    Cache.save({ FIRST_IN_LINE_DUE_DATE });

                    $remark(`Up Next Boost is enabled → Waiting ${ toTimeString(GET_TIME_REMAINING() | 0) } before leaving for "${ parseURL(FIRST_IN_LINE_HREF).pathname?.slice(1) }"`);
                } else {
                    $remark(`Up Next Boost is disabled`);
                }

                // Up Next Boost
                first_in_line_boost_button.setAttribute('speeding', FIRST_IN_LINE_BOOST);
                first_in_line_boost_button.querySelector('svg[fill]')?.setAttribute('fill', '');
                first_in_line_boost_button.querySelector('svg[fill]')?.modStyle(`opacity:${ 2**-!FIRST_IN_LINE_BOOST }; fill:currentcolor`);
                first_in_line_boost_button.tooltip ??= new Tooltip(first_in_line_boost_button, `${ ['Start','Stop'][FIRST_IN_LINE_BOOST | 0] } rushing the queue`);

                let up_next_button = $('[up-next--container] button');

                up_next_button?.setAttribute('allowed', parseBool(UP_NEXT_ALLOW_THIS_TAB));
                up_next_button?.setAttribute('speeding', parseBool(FIRST_IN_LINE_BOOST));

                // Pause
                first_in_line_pause_button.tooltip ??= new Tooltip(first_in_line_pause_button, `Pause the queue`);
            });
        }

        if(defined(FIRST_IN_LINE_BALLOON)) {
            // FIRST_IN_LINE_BALLOON.header.closest('div').setAttribute('title', (UP_NEXT_ALLOW_THIS_TAB? `Drop a channel here to queue it`: `Up Next is disabled for this tab`));

            FIRST_IN_LINE_BALLOON.body.ondragover ??= event => {
                event.preventDefault();

                event.dataTransfer.dropEffect = (UP_NEXT_ALLOW_THIS_TAB? 'move': 'none');
            };

            FIRST_IN_LINE_BALLOON.body.ondrop ??= async event => {
                event.preventDefault();

                if(!UP_NEXT_ALLOW_THIS_TAB)
                    return;

                // Try to see if it's a link...
                let text = event.dataTransfer.getData('text');

                if(!parseURL.pattern.test(text))
                    return;

                let { href, hostname, pathname, domainPath } = parseURL(text),
                    name = pathname.slice(1).split('/').shift();

                // No idea what the user just dropped
                if(!hostname?.length || !pathname?.length)
                    return $error(`Unknown [ondrop] text: "${ text }"`);

                if(!/^tv\.twitch/i.test(domainPath.join('.')) || RESERVED_TWITCH_PATHNAMES.test(pathname))
                    return $warn(`Unable to add link to Up Next "${ href }"`);

                let streamer = await(null
                    ?? ALL_CHANNELS.find(channel => parseURL(channel.href).pathname.equals('/' + name))
                    ?? (null
                        ?? new Search(name).then(Search.convertResults)
                        ?? Promise.reject(`Unable to perform search for "${ name }"`)
                    )
                        .then(search => {
                            let found = ({
                                from: 'SEARCH',
                                href,
                                icon: (typeof search.icon == 'string'? Object.assign(new String(search.icon), parseURL(search.icon)): null),
                                live: parseBool(search.live),
                                name: search.name,
                            });

                            ALL_CHANNELS = [...ALL_CHANNELS, found].filter(defined).filter(uniqueChannels);

                            return found;
                        })
                        .catch($warn)
                );

                $log('Adding to Up Next [ondrop]:', { href, streamer });

                if(nullish(streamer?.icon)) {
                    let name = (streamer?.name ?? parseURL(href).pathname?.slice(1));

                    if(defined(name))
                        new Search(name)
                            .then(Search.convertResults)
                            .then(streamer => {
                                let restored = ({
                                    from: 'SEARCH',
                                    href,
                                    icon: (typeof streamer.icon == 'string'? Object.assign(new String(streamer.icon), parseURL(streamer.icon)): null),
                                    live: parseBool(streamer.live),
                                    name,
                                });

                                ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                            });
                }

                // Jobs are unknown. Restart timer
                if(ALL_FIRST_IN_LINE_JOBS.length < 1)
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                // $log('Accessing here... #1');
                ALL_FIRST_IN_LINE_JOBS = [...ALL_FIRST_IN_LINE_JOBS, href].map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);

                Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                });
            };

            FIRST_IN_LINE_BALLOON.icon.onmouseenter ??= event => {
                let { container, tooltip, title } = FIRST_IN_LINE_BALLOON,
                    offset = getOffset(container);

                $('div#root > *').append(
                    furnish('.tt-tooltip-layer.tooltip-layer', { style: `transform: translate(${ offset.left }px, ${ offset.top }px); width: 30px; height: 30px; z-index: 9999;` },
                        furnish('.tt-inline-flex.tt-relative.tt-tooltip-wrapper', { 'aria-describedby': tooltip.id, 'show': true },
                            furnish('div', { style: 'width: 30px; height: 30px;' }),
                            tooltip
                        )
                    )
                );

                tooltip.modStyle('display:block');
            };

            FIRST_IN_LINE_BALLOON.icon.onmouseleave ??= event => {
                $('div#root .tt-tooltip-layer.tooltip-layer')?.remove();

                FIRST_IN_LINE_BALLOON.tooltip?.closest('[show]')?.setAttribute('show', false);
            };

            FIRST_IN_LINE_SORTING_HANDLER ??= new Sortable(FIRST_IN_LINE_BALLOON.body, {
                animation: 150,
                draggable: '[name]',

                filter: '.tt-static',

                onUpdate: ({ oldIndex, newIndex }) => {
                    // $log('Old array', [...ALL_FIRST_IN_LINE_JOBS]);

                    let [moved] = ALL_FIRST_IN_LINE_JOBS.splice(--oldIndex, 1);
                    ALL_FIRST_IN_LINE_JOBS.splice(--newIndex, 0, moved);
                    ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(defined);

                    // $log('New array', [...ALL_FIRST_IN_LINE_JOBS]);
                    // $log('Moved', { oldIndex, newIndex, moved });

                    let channel = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(moved));

                    if(nullish(channel))
                        return $warn('No channel found:', { oldIndex, newIndex, desiredChannel: channel, givenChannel: moved });

                    // This controls the new due date `NEW_DUE_DATE(time)` when the user drags a channel to the first position
                        // To create a new due date, `NEW_DUE_DATE(time)` → `NEW_DUE_DATE()`
                    if([oldIndex, newIndex].contains(0)) {
                        // `..._TIMER = ` will continue the queue (as if nothing changed) when a channel is removed
                        let first = ALL_CHANNELS.find(channel => RegExp(parseURL(channel.href).pathname + '\\b', 'i').test(FIRST_IN_LINE_HREF = ALL_FIRST_IN_LINE_JOBS[0]));
                        let time = /* FIRST_IN_LINE_TIMER = */ parseInt($(`[name="${ first?.name ?? '' }"i]`)?.getAttribute('time'));

                        $log('New First in Line event:', { ...first, time });

                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);
                    }

                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0].href);
                    // $log('Redid First in Line queue [Sorting Handler]...', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });

                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
                },
            });

            if(Settings.first_in_line_none)
                FIRST_IN_LINE_BALLOON.container.modStyle('display:none!important');
            else
                FIRST_IN_LINE_LISTING_JOB ??= setInterval(async() => {
                    // Set the opacity...
                    // FIRST_IN_LINE_BALLOON.container.modStyle(`opacity:${ (UP_NEXT_ALLOW_THIS_TAB? 1: 0.75) }!important`);

                    for(let index = 0, fails = 0; UP_NEXT_ALLOW_THIS_TAB && index < ALL_FIRST_IN_LINE_JOBS?.length; index++) {
                        let href = ALL_FIRST_IN_LINE_JOBS[index],
                            name = parseURL(href).pathname.slice(1),
                            channel = await(null
                                ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                                ?? new Search(name).then(Search.convertResults)
                            );

                        if(nullish(href) || nullish(channel))
                            continue;

                        let { live } = channel;
                        name = channel.name;

                        if($.defined(`[live][time][name="${ name }"i]`))
                            continue;

                        let [balloon] = FIRST_IN_LINE_BALLOON?.add({
                            href,
                            src: channel.icon,
                            message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`,
                            subheader: `Coming up next`,
                            onremove: event => {
                                let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                                    [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                                    purl = parseURL(removed),
                                    name = purl.pathname?.slice(1),
                                    redo = (purl.searchParameters?.redo ?? "");

                                $notice(`Removed from Up Next via Sorting Handler (${ nth(index + 1, 'ordinal-position') }):`, removed, 'Was it canceled?', event.canceled);

                                if(event.canceled)
                                    DO_NOT_AUTO_ADD.push(removed);
                                else if(redo.equals(name))
                                    ALL_FIRST_IN_LINE_JOBS.push(removed);
                                // Balloon.onremove
                                if(ALL_FIRST_IN_LINE_JOBS.length)
                                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters?.redo ?? "") });

                                if(index > 0) {
                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element));
                                } else {
                                    $log('Destroying current job [Job Listings]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });

                                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                                    FIRST_IN_LINE_HREF = undefined;
                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => { REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]); event.callback(event.element) });
                                }
                            },

                            attributes: {
                                name,
                                live,
                                index,
                                time: (index < 1? GET_TIME_REMAINING(): FIRST_IN_LINE_WAIT_TIME * 60_000),

                                style: `opacity: ${ 2**-!live }!important`,
                            },

                            animate: container => {
                                let subheader = $('.tt-balloon-subheader', container);

                                if(!UP_NEXT_ALLOW_THIS_TAB)
                                    return -1;
                                if(container.hasAttribute('time-ctrl'))
                                    return -1;
                                container.setAttribute('time-ctrl', true);

                                return setInterval(async() => {
                                    new StopWatch('up_next_balloon__subheader_timer_animation');

                                    let controller = getDOMPath(container);
                                    let timeRemaining = GET_TIME_REMAINING();

                                    timeRemaining = timeRemaining < 0? 0: timeRemaining;

                                    /* First in Line is paused */
                                    if(FIRST_IN_LINE_PAUSED) {
                                        // $remark('Adding time... Subheader Animation');
                                        if(FIRST_IN_LINE_PAUSED_AT.floorToNearest(1e3) === (+new Date).floorToNearest(1e3))
                                            return;

                                        Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                                        StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000);

                                        return FIRST_IN_LINE_PAUSED_AT = +new Date;
                                    }

                                    let name = container.getAttribute('name'),
                                        channel = await(null
                                            ?? ALL_CHANNELS.find(channel => name.equals(channel.name))
                                            ?? new Search(name).then(Search.convertResults)
                                        ),
                                        { live } = channel;
                                        name = channel.name;

                                    let time = timeRemaining,
                                        intervalID = parseInt(container.getAttribute('animationID')),
                                        index = $.all('[id][guid][uuid]', container.parentElement).indexOf(container),
                                        anchor = $.all('a[connected-to]', container.parentElement)[index];

                                    if(anchor.hasAttribute('new-href')) {
                                        let href = anchor.getAttribute('new-href');

                                        anchor.removeAttribute('new-href');
                                        ALL_FIRST_IN_LINE_JOBS.splice(index, 1, anchor.href = href);
                                        container.setAttribute('href', href);

                                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                                        Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                                    }

                                    if(time < 60_000 && nullish(FIRST_IN_LINE_HREF)) {
                                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                        $warn('Creating job to avoid [Job Listing] mitigation event', channel);

                                        return StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                                    }

                                    if(time < 1000)
                                        wait(5000, [container, intervalID]).then(([container, intervalID]) => {
                                            $log('Mitigation event for [Job Listings]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                            // Mitigate 0 time bug?

                                            Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter(href => parseURL(href).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                                $warn(`Timer overdue [animation:first-in-line-balloon--initializer] » ${ FIRST_IN_LINE_HREF }`)
                                                    // .toNativeStack();

                                                goto(FIRST_IN_LINE_HREF);
                                            });

                                            return clearInterval(intervalID);
                                        });

                                    container.setAttribute('time', time - (index > 0? 0: 1000));

                                    if(container.getAttribute('index') != index)
                                        container.setAttribute('index', index);

                                    let theme = { light: 'w', dark: 'b' }[THEME];

                                    $('a', container)
                                        .modStyle(`background-color: var(--color-opac-${ theme }-${ index > 15? 1: 15 - index })`);

                                    if(container.getAttribute('live') != (live + '')) {
                                        $('.tt-balloon-message', container).innerHTML =
                                            `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`;
                                        container.modStyle(`opacity: ${ 2**-!live }!important`);
                                        container.setAttribute('live', live);
                                    }

                                    subheader.innerHTML = index > 0
                                        ? `${ nth(index + 1, 'ordinal-position') } &mdash; ${ new Date((+new Date) + time + (index * FIRST_IN_LINE_WAIT_TIME * 60_000)).toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }) }`
                                        : toTimeString(time, 'clock');

                                    StopWatch.stop('up_next_balloon__subheader_timer_animation', 1000);
                                }, 1000);
                            },
                        })
                            ?? [];
                    }

                    FIRST_IN_LINE_BALLOON.counter.setAttribute('length', $.all(`[up-next--body] [time]`).length);
                }, 1000);
        }
    }, 1000);

    /*** First in Line
     *      ______ _          _     _         _      _
     *     |  ____(_)        | |   (_)       | |    (_)
     *     | |__   _ _ __ ___| |_   _ _ __   | |     _ _ __   ___
     *     |  __| | | '__/ __| __| | | '_ \  | |    | | '_ \ / _ \
     *     | |    | | |  \__ \ |_  | | | | | | |____| | | | |  __/
     *     |_|    |_|_|  |___/\__| |_|_| |_| |______|_|_| |_|\___|
     *
     *
     */
    let HANDLED_NOTIFICATIONS = [],
        STARTED_TIMERS = {};

    Handlers.first_in_line = async(ActionableNotification, preferredPlace) => {
        new StopWatch('first_in_line');

        let notifications = [...$.all('[data-test-selector*="notifications"i] [data-test-selector*="notification"i]'), ActionableNotification].filter(defined);

        preferredPlace ??= 'last';

        // The Up Next empty status
        $('[up-next--body]')?.setAttribute?.('empty', !(UP_NEXT_ALLOW_THIS_TAB && ALL_FIRST_IN_LINE_JOBS.length));
        $('[up-next--body]')?.setAttribute?.('allowed', !!UP_NEXT_ALLOW_THIS_TAB);

        if(!UP_NEXT_ALLOW_THIS_TAB)
            return;

        for(let notification of notifications) {
            let action = (
                notification instanceof Element?
                    $('a[href^="/"]', notification):
                notification
            );

            if(nullish(action))
                continue;

            let { href, pathname } = parseURL(action.href.toLowerCase()),
                { innerText } = action,
                uuid = UUID.from(innerText).value;

            if(HANDLED_NOTIFICATIONS.contains(uuid))
                continue;
            HANDLED_NOTIFICATIONS.push(uuid);

            if(DO_NOT_AUTO_ADD.contains(href) || RESERVED_TWITCH_PATHNAMES.test(href))
                continue;

            if(true
                && !/\blive\b/i.test(innerText)
                && $.nullish('[class*="toast"i][class*="action"i]', notification)
            )
                continue;

            $log('Received an actionable notification:', innerText, new Date);

            let ALL_JOBS_PREFERENCE_SORTED = (preferredPlace.toString().anyOf('begin', 'beginning', 'first', 'head', 'start', '0', '1', '^')? [href, ...ALL_FIRST_IN_LINE_JOBS]: [...ALL_FIRST_IN_LINE_JOBS, href]);

            if(defined(FIRST_IN_LINE_HREF ??= ALL_FIRST_IN_LINE_JOBS[0])) {
                if([...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].missing(href)) {
                    $log('Pushing to First in Line:', href, new Date);

                    // $log('Accessing here... #2');
                    ALL_FIRST_IN_LINE_JOBS = ALL_JOBS_PREFERENCE_SORTED.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);
                } else {
                    $warn('Not pushing to First in Line:', href, new Date);
                    $log('Reason(s):', [FIRST_IN_LINE_JOB, ...ALL_FIRST_IN_LINE_JOBS],
                        `It is the next job? ${ ['No', 'Yes'][+(FIRST_IN_LINE_HREF === href)] }`,
                        `It is in the queue already? ${ ['No', 'Yes'][+(ALL_FIRST_IN_LINE_JOBS.contains(href))] }`
                    );
                }

                // To wait, or not to wait
                Cache.save({ ALL_FIRST_IN_LINE_JOBS });

                continue;
            } else {
                $log('Pushing to First in Line (no contest):', href, new Date);

                // Add the new job...
                // $log('Accessing here... #3');
                ALL_FIRST_IN_LINE_JOBS = ALL_JOBS_PREFERENCE_SORTED.map(url => url?.toLowerCase?.()).isolate().filter(url => url?.length);
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

                // To wait, or not to wait
                Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                    REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                });
            }

            AddBalloon: {
                update();

                let index = ALL_FIRST_IN_LINE_JOBS.indexOf(href),
                    name = parseURL(href).pathname.slice(1),
                    channel = await(null
                        ?? ALL_CHANNELS.find(channel => channel.name.equals(name))
                        ?? new Search(name).then(Search.convertResults)
                    );

                if(nullish(channel))
                    continue;

                let { live } = channel;
                name = channel.name;

                if($.defined(`[live][time][name="${ name }"i]`))
                    continue;

                index = index < 0? ALL_FIRST_IN_LINE_JOBS.length: index;

                let [balloon] = FIRST_IN_LINE_BALLOON?.add({
                    href,
                    src: channel.icon,
                    message: `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`,
                    subheader: `Coming up next`,
                    onremove: event => {
                        let index = ALL_FIRST_IN_LINE_JOBS.findIndex(href => event.href == href),
                            [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                            purl = parseURL(removed),
                            name = purl.pathname?.slice(1),
                            redo = (purl.searchParameters?.redo ?? "");

                        $notice(`Removed from Up Next via Balloon (${ nth(index + 1, 'ordinal-position') }):`, removed, 'Was it canceled?', event.canceled);
                        if(event.canceled)
                            DO_NOT_AUTO_ADD.push(removed);
                        else if(redo.equals(name))
                            ALL_FIRST_IN_LINE_JOBS.push(removed);
                        // AddBalloon.onremove
                        if(ALL_FIRST_IN_LINE_JOBS.length)
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters?.redo ?? "") });

                        if(index > 0) {
                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element));
                        } else {
                            $log('Destroying current job [First in Line]...', { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE });

                            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                            FIRST_IN_LINE_HREF = undefined;
                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => { REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]); event.callback(event.element) });
                        }
                    },

                    attributes: {
                        name,
                        live,
                        index,
                        time: (index < 1? GET_TIME_REMAINING(): FIRST_IN_LINE_WAIT_TIME * 60_000),

                        style: `opacity: ${ 2**-!live }!important`,
                    },

                    animate: container => {
                        let subheader = $('.tt-balloon-subheader', container);

                        if(!UP_NEXT_ALLOW_THIS_TAB)
                            return -1;
                        if(container.hasAttribute('time-ctrl'))
                            return -1;
                        container.setAttribute('time-ctrl', true);

                        return setInterval(async() => {
                            new StopWatch('first_in_line__job_watcher');

                            let timeRemaining = GET_TIME_REMAINING();

                            timeRemaining = timeRemaining < 0? 0: timeRemaining;

                            /* First in Line is paused */
                            if(FIRST_IN_LINE_PAUSED) {
                                // $remark('Adding time... Job Watcher');
                                if(FIRST_IN_LINE_PAUSED_AT.floorToNearest(1e3) === (+new Date).floorToNearest(1e3))
                                    return;

                                Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1000) });
                                StopWatch.stop('first_in_line__job_watcher', 1000);

                                return FIRST_IN_LINE_PAUSED_AT = +new Date;
                            }

                            Cache.save({ FIRST_IN_LINE_BOOST });

                            let name = container.getAttribute('name'),
                                channel = await(null
                                    ?? ALL_CHANNELS.find(channel => name.equals(channel.name))
                                    ?? new Search(name).then(Search.convertResults)
                                ),
                                { live } = channel;
                                name = channel.name;

                            let time = timeRemaining,
                                intervalID = parseInt(container.getAttribute('animationID')),
                                index = $.all('[id][guid][uuid]', container.parentElement).indexOf(container),
                                anchor = $.all('a[connected-to]', container.parentElement)[index];

                            if(anchor.hasAttribute('new-href')) {
                                let href = anchor.getAttribute('new-href');

                                anchor.removeAttribute('new-href');
                                ALL_FIRST_IN_LINE_JOBS.splice(index, 1, anchor.href = href);
                                container.setAttribute('href', href);

                                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);

                                Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                            }

                            if(time < 60_000 && nullish(FIRST_IN_LINE_HREF)) {
                                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);

                                $warn('Creating job to avoid [First in Line] mitigation event', channel);

                                return StopWatch.stop('first_in_line__job_watcher', 1000), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel.href);
                            }

                            if(time < 1000)
                                wait(5000, [container, intervalID]).then(([container, intervalID]) => {
                                    $log('Mitigation event from [First in Line]', { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, new Date);
                                    // Mitigate 0 time bug?

                                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                                    Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter(href => parseURL(href).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                                        $warn(`Timer overdue [animation:first-in-line-balloon] » ${ FIRST_IN_LINE_HREF }`)
                                            // .toNativeStack();

                                        goto(FIRST_IN_LINE_HREF);
                                    });

                                    return clearInterval(intervalID);
                                });

                            container.setAttribute('time', time - (index > 0? 0: 1000));

                            if(container.getAttribute('index') != index)
                                container.setAttribute('index', index);

                            let theme = { light: 'w', dark: 'b' }[THEME];

                            $('a', container)
                                .modStyle(`background-color: var(--color-opac-${ theme }-${ index > 15? 1: 15 - index })`);

                            if(container.getAttribute('live') != (live + '')) {
                                $('.tt-balloon-message', container).innerHTML =
                                    `${ name } <span style="display:${ live? 'none': 'inline-block' }">is not live</span>`;
                                container.modStyle(`opacity: ${ 2**-!live }!important`);
                                container.setAttribute('live', live);
                            }

                            subheader.innerHTML = index > 0? nth(index + 1, 'ordinal-position'): toTimeString(time, 'clock');

                            StopWatch.stop('first_in_line__job_watcher', 1000);
                        }, 1000);
                    },
                })
                    ?? [];

                if(defined(FIRST_IN_LINE_WAIT_TIME) && nullish(FIRST_IN_LINE_HREF)) {
                    REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
                    $log('Redid First in Line queue [First in Line]...', { FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
                } else if(Settings.first_in_line_none) {
                    $log('Heading to stream now [First in Line] is OFF', FIRST_IN_LINE_HREF);

                    [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                    goto(parseURL(FIRST_IN_LINE_HREF).addSearch({ tool: 'first-in-line--killed' }).href);
                }
            }
        }

        FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS.length > 0;

        let filb = $('[speeding]');

        if(parseBool(filb?.getAttribute('speeding')) != parseBool(FIRST_IN_LINE_BOOST))
            filb?.click?.();

        StopWatch.stop('first_in_line');
    };
    Timers.first_in_line = 1000;

    Unhandlers.first_in_line = () => {
        if(defined(FIRST_IN_LINE_JOB))
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

        if(UnregisterJob.__reason__.anyOf('default', 'reinit', 'job-destruction'))
            return;

        // Wait 5s before deleteing everything...
        // If the usr has turned the setting off, it'll still go thru; however, if if page is reloaded too fast nothing will happen
        wait(5_000).then(() => {
            if(defined(FIRST_IN_LINE_HREF))
                FIRST_IN_LINE_HREF = '?';

            ALL_FIRST_IN_LINE_JOBS = [];
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();

            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
        });
    };

    __FirstInLine__:
    if(parseBool(Settings.first_in_line) || parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all) || parseBool(Settings.first_in_line_now)) {
        await Cache.load(['ALL_FIRST_IN_LINE_JOBS', 'FIRST_IN_LINE_DUE_DATE', 'FIRST_IN_LINE_BOOST'], cache => {
            let oneMin = 60_000,
                fiveMin = 5.5 * oneMin,
                tenMin = 10 * oneMin;

            [FIRST_IN_LINE_HREF] = ALL_FIRST_IN_LINE_JOBS = (cache.ALL_FIRST_IN_LINE_JOBS ?? []);
            FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && parseBool(ALL_FIRST_IN_LINE_JOBS?.length);
            FIRST_IN_LINE_DUE_DATE = (null
                ?? cache.FIRST_IN_LINE_DUE_DATE
                ?? (
                    NEW_DUE_DATE(
                        FIRST_IN_LINE_TIMER = (
                            // If the streamer hasn't been on for longer than 10mins, wait until then
                            STREAMER.time < tenMin?
                                (
                                    // Boost is enabled
                                    FIRST_IN_LINE_BOOST?
                                        fiveMin + (tenMin - STREAMER.time):
                                    // Boost is disabled
                                    FIRST_IN_LINE_WAIT_TIME * oneMin
                                ):
                            // Streamer has been live longer than 10mins
                            (
                                // Boost is enabled
                                FIRST_IN_LINE_BOOST?
                                    // Boost is enabled
                                    Math.min(GET_TIME_REMAINING(), fiveMin):
                                // Boost is disabled
                                FIRST_IN_LINE_WAIT_TIME * oneMin
                            )
                        )
                    )
                )
            );
        });

        RegisterJob('first_in_line');

        // Redo entries
        if(true
            && (true
                && decodeURIComponent(parseURL(top.location).searchParameters?.redo).toLowerCase().split(',').includes(STREAMER.name.toLowerCase())
                && !decodeURIComponent(parseURL(top.location).searchParameters?.obit).toLowerCase().split(',').includes(STREAMER.name.toLowerCase())
            )
            && top.location.pathname.equals(`/${ STREAMER.name }`)
            && STREAMER.live
        )
            Handlers.first_in_line({ href: top.location.href, innerText: `${ STREAMER.name } is live [Entry Redo]` });

        // Put a rainbow around repeating entries...
        setInterval(() =>
            $.all('[id^="tt-balloon"i][name][live][href*="redo="i]').map(el => {
                let { searchParameters } = parseURL(el.getAttribute('href'));
                let name = el.getAttribute('name');
                let redo = (searchParameters?.redo ?? "").equals(name);

                if(parseBool(el.getAttribute('rainbow-border')) != redo) {
                    el.setAttribute('rainbow-border', redo);

                    $('.tt-redo-btn svg', el).modStyle(
                        redo?
                            'animation: 1s linear 0s infinite normal none running spinner':
                        'animation: !delete'
                    );
                }
            })
        , 100);

        // Restart the timer if the user navigates away from the page
        top.onlocationchange = ({ from, to }) => {
            if(from == to)
                return;

            $remark('Resetting timer. Location change detected:', { from, to });

            // If the user clicks on a channel, reset the timer
            if(!RESERVED_TWITCH_PATHNAMES.test(to))
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
        };

        // Controls what's listed under the Up Next balloon
        if(nullish(FIRST_IN_LINE_HREF) && ALL_FIRST_IN_LINE_JOBS.length) {
            let [href] = ALL_FIRST_IN_LINE_JOBS,
                first = (RegExp(parseURL(STREAMER.href).pathname + '\\b', 'i').test(href)),
                channel = (null
                    // Attempts to find the channel via "cache"
                    ?? ALL_CHANNELS
                        // Get all live channels listed
                        .filter(isLive)
                        // Used below to control whether the channel is deemed a duplicate
                        .filter(channel => channel.href !== STREAMER.href)
                        // Gets the channel in question, if applicable
                        .find(channel => parseURL(channel.href).pathname === parseURL(href).pathname)
                    // Attempts to find the channel via a search

                    ?? new Search(parseURL(href).pathname.slice(1)).then(Search.convertResults)
                );

            if(nullish(channel) && !first) {
                let index = ALL_FIRST_IN_LINE_JOBS.findIndex(job => job == href),
                    dead = ALL_FIRST_IN_LINE_JOBS[index];

                $log('Restoring dead channel (initializer)...', dead);

                let { pathname } = parseURL(dead),
                    channelID = UUID.from(pathname).value;

                let name = pathname.slice(1);

                new Search(name).then(Search.convertResults)
                    .then(streamer => {
                        let restored = ({
                            from: 'SEARCH',
                            href,
                            icon: (typeof streamer.icon == 'string'? Object.assign(new String(streamer.icon), parseURL(streamer.icon)): null),
                            live: parseBool(streamer.live),
                            name: streamer.name,
                        });

                        ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                        ALL_FIRST_IN_LINE_JOBS[index] = restored;

                        REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
                    })
                    .catch(error => {
                        let [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                            name = parseURL(removed).pathname.slice(1);

                            $notice(`Necromancy work:`, removed);

                            // Necromancer
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(removed).searchParameters?.redo ?? "") });

                        Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                            $warn(`Unable to perform search for "${ name }" - ${ error }`, removed);
                        });
                    });

                break __FirstInLine__;
            } else if(!first) {
                // Handlers.first_in_line({ href, innerText: `${ channel.name } is live [First in Line]` });

                // $warn('Forcing queue update for', href);
                REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
            } else if(first) {
                let [removed] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1),
                    name = parseURL(removed).pathname.slice(1);

                $notice(`Doppleganger work:`, removed);

                // Doppleganger
                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(removed).searchParameters?.redo ?? "") });

                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);

                Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                    $warn('Removed duplicate job', removed);
                });
            }
        }
    }

    // First in Line+ (on creation) → src/plugins/automation/first-in-line-plus.js
    await TTV.run('first_in_line_plus', PLUGIN_CONTEXT);

    /*** Live Reminders
     *      _      _             _____                _           _
     *     | |    (_)           |  __ \              (_)         | |
     *     | |     ___   _____  | |__) |___ _ __ ___  _ _ __   __| | ___ _ __ ___
     *     | |    | \ \ / / _ \ |  _  // _ \ '_ ` _ \| | '_ \ / _` |/ _ \ '__/ __|
     *     | |____| |\ V /  __/ | | \ \  __/ | | | | | | | | | (_| |  __/ |  \__ \
     *     |______|_| \_/ \___| |_|  \_\___|_| |_| |_|_|_| |_|\__,_|\___|_|  |___/
     *
     *
     */
    Handlers.live_reminders = () => {
        new StopWatch('live_reminders');

        // Add the button to all channels
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel))
            return StopWatch.stop('live_reminders');

        let action = $('[tt-action="live-reminders"i]', actionPanel);

        if(defined(action))
            return StopWatch.stop('live_reminders');

        Cache.load('LiveReminders', async({ LiveReminders }) => {
            try {
                LiveReminders = JSON.parse(LiveReminders || '{}');
            } catch(error) {
                // Probably an object already...
                LiveReminders ??= {};
            }

            let f = furnish,
                s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                reminderName = STREAMER.name,
                realName = (Object.keys(LiveReminders).find(name => name.equals(reminderName))),
                hasReminder = sated(realName),
                tense = (parseBool(Settings.keep_live_reminders)? '': ' next'),
                stream_s = 'stream'.pluralSuffix(+!!tense),
                [title, subtitle, icon] = [
                    ['Remind me', `Receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'inform'],
                    ['Reminder set', `You will receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'notify']
                ][+!!hasReminder];

            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

            // Create the action button...
            action =
            f('div', { 'tt-action': 'live-reminders', 'for': realName, 'remind': hasReminder, 'action-origin': 'foreign', style: `animation:1s fade-in 1;` },
                f('button', {
                    onmouseup: async event => {
                        let { currentTarget, isTrusted = false, button = -1 } = event;

                        if(!!button)
                            return /* Not the primary button */;

                        Cache.load('LiveReminders', async({ LiveReminders }) => {
                            try {
                                LiveReminders = JSON.parse(LiveReminders || '{}');
                            } catch(error) {
                                // Probably an object already...
                                LiveReminders ??= {};
                            }

                            let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                reminderName = STREAMER.name,
                                realName = (Object.keys(LiveReminders).find(name => name.equals(reminderName))),
                                notReminded = empty(realName),
                                tense = (parseBool(Settings.keep_live_reminders)? '': ' next'),
                                stream_s = 'stream'.pluralSuffix(+!!tense),
                                [title, subtitle, icon] = [
                                    ['Remind me', `Receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'inform'],
                                    ['Reminder set', `You will receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'notify']
                                ][+!!notReminded];

                            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                            $('.tt-action-icon', currentTarget).innerHTML = icon;
                            $('.tt-action-title', currentTarget).innerText = title;
                            $('.tt-action-subtitle', currentTarget).innerText = subtitle;

                            // Add the reminder...
                            let message;
                            if(notReminded) {
                                message = `You'll be notified when <a href="/${ reminderName }">${ reminderName }</a> goes live.`;
                                LiveReminders[reminderName] = (STREAMER.live? new Date(STREAMER?.data?.actualStartTime): STREAMER?.data?.lastSeen ?? new Date);
                            }
                            // Remove the reminder...
                            else {
                                message = `Reminder for <a href="/${ reminderName }">${ reminderName }</a> removed successfully!`;
                                delete LiveReminders[reminderName];
                            }

                            currentTarget.closest('[tt-action]').setAttribute('remind', notReminded);

                            // @FIXME: Live Reminder alerts will not display if another alert is present...
                            Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }).then(() => parseBool(message) && confirm.timed(message, 7000)).catch($warn));
                        });
                    },
                }, f.div(
                    f('.tt-action-icon').html(icon),
                    f.div(
                        f('p.tw-title.tt-action-title').with(title),
                        f('p.tt-action-subtitle').with(subtitle)
                    )
                ))
            );

            actionPanel.append(action);

            // @performance
            PrepareForGarbageCollection(LiveReminders);
        });

        StopWatch.stop('live_reminders');
    };
    Timers.live_reminders = -2_500;

    Unhandlers.live_reminders = () => {
        $.all('[tt-action="live-reminders"i]').map(action => action.remove());
        [LIVE_REMINDERS__LISTING_INTERVAL].map(clearInterval);
    };

    __Live_Reminders__:
    // On by Default (ObD; v5.15) -- only on the tab that has Up Next enabled
    if(true
        && (false
            || nullish(Settings.live_reminders)
            || parseBool(Settings.live_reminders)
        )
    ) {
        $remark('Adding Live Reminders...');

        // See if there are any notifications to push...
        let REMINDERS_INDEX = -1, REMINDERS_LENGTH = 0, PARSED_REMINDERS = new Map;

        // Lists Live Reminders periodically...
        let LIVE_REMINDERS__CHECKER = () => {
            Cache.load('LiveReminders', async({ LiveReminders }) => {
                try {
                    LiveReminders = JSON.parse(LiveReminders || '{}');
                } catch(error) {
                    // Probably an object already...
                    LiveReminders ??= {};
                }

                checking: // Only check for the stream when it's live; if the dates don't match, it just went live again
                for(let reminderName in LiveReminders) {
                    let realName = (Object.keys(LiveReminders).find(name => name.equals(reminderName)));

                    culling: if(PARSED_REMINDERS.has(realName)) {
                        let repeats = PARSED_REMINDERS.get(realName) + 1;

                        PARSED_REMINDERS.set(realName, repeats);

                        // Let reminders refresh every 15mins
                        if(repeats % 3)
                            continue checking;
                    }

                    let channel = await new Search(reminderName).then(Search.convertResults),
                        ok = parseBool(channel?.ok);

                    // Search did not complete...
                    let num = 3;
                    while(!ok && num-- > 0) {
                        delete channel;

                        Search.void(reminderName);

                        // @research
                        channel = await new Search(reminderName).then(Search.convertResults);
                        ok = parseBool(channel?.ok);

                        // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [Reminders]: "${ reminderName }" → OK = ${ ok }`);
                    }

                    if(!num && !ok) {
                        channel = ALL_CHANNELS.find(channel => channel.name.equals(reminderName));

                        if(nullish(channel?.name))
                            continue checking;
                    }

                    if(!channel.live) {
                        // Ignore this reminder (channel not live)
                        continue checking;
                    }

                    let { name, live, icon, href, data = { actualStartTime: null, lastSeen: null } } = channel;
                    let lastOnline = new Date((+new Date(LiveReminders[realName])).floorToNearest(1000)).toJSON(),
                        justOnline = new Date((+new Date(data.actualStartTime)).floorToNearest(1000)).toJSON();

                    // The channel just went live!
                    if(lastOnline != justOnline) {
                        PARSED_REMINDERS.set(realName, 0);

                        if(parseBool(Settings.keep_live_reminders)) {
                            LiveReminders[realName] = justOnline;
                        } else {
                            $(`[tt-action="live-reminders"i][for="${ realName }"i][remind="true"i] button`)
                                ?.dispatchEvent?.(new MouseEvent('mouseup', { bubbles: false }));
                            delete LiveReminders[realName];
                        }

                        Cache.save({ LiveReminders }, async() => {
                            // @TODO: Currently, only one option looks for Live Reminder notifications...
                            Handle_phantom_notification: {
                                let notification = { href, innerText: `${ name } is live [Live Reminders]` },
                                    [page, note] = [STREAMER.href, href].map(url => parseURL(url).pathname);

                                // If already on the stream, break
                                if(page?.equals(note))
                                    break Handle_phantom_notification;

                                // All of the Live Reminder handlers...
                                Handlers.first_in_line(notification);

                                let last = new Date(lastOnline);
                                let just = new Date(justOnline);
                                let instance = (last - just < 60_000)? 'just now': toTimeString((last - just).abs().floorToNearest(60_000), '?minutes minutes ago');

                                // Show a notification
                                Display_phantom_notification: {
                                    $warn(`Live Reminders: ${ name } went live ${ instance }`, new Date);
                                    alert.timed(`<a href='/${ name }'>${ name }</a> went live ${ instance }!`, 7000);
                                }

                                // Update the cached-streamer
                                Update_cached_streamer: {
                                    GetNextStreamer.cachedStreamer = null;
                                    (GetNextStreamer.cachedReminders ??= []).push({
                                        name, live, href,

                                        from: 'LIVE_REMINDERS__CHECKER',
                                    });

                                    GetNextStreamer();
                                }
                            }

                            // The reminder has been parsed...
                        });
                    } else {
                        // The reminder (date) hasn't been changed...
                    }

                    // Release memory... Doesn't actually do anything...
                    delete channel;
                }

                // Send the length to the settings page
                Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) });

                // @performance
                PrepareForGarbageCollection(LiveReminders);
            });
        };

        // Add the panel & button
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel)) {
            actionPanel = furnish('.about-section__actions', { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });

            $('.about-section')?.append?.(actionPanel);
        } else {
            for(let child of actionPanel.children)
                child.setAttribute('action-origin', 'native');
        }

        setTimeout(LIVE_REMINDERS__CHECKER, 5_000);
        setInterval(LIVE_REMINDERS__CHECKER, 300_000);
        RegisterJob('live_reminders');
    }

    // Game Overview Card | Store Integration → src/plugins/customization/store-integration.js
    await TTV.run('game_overview_card', PLUGIN_CONTEXT);

    /*** Auto-Follow
     *                    _              ______    _ _
     *         /\        | |            |  ____|  | | |
     *        /  \  _   _| |_ ___ ______| |__ ___ | | | _____      __
     *       / /\ \| | | | __/ _ \______|  __/ _ \| | |/ _ \ \ /\ / /
     *      / ____ \ |_| | || (_) |     | | | (_) | | | (_) \ V  V /
     *     /_/    \_\__,_|\__\___/      |_|  \___/|_|_|\___/ \_/\_/
     *
     *
     */
    let STARTED_WATCHING = (+new Date);
    let CURRENT_WATCHTIME_NAME = `WatchTimes/${ STREAMER.name.toLowerCase() }`;

    Cache.load(CURRENT_WATCHTIME_NAME, _ => {
        _[CURRENT_WATCHTIME_NAME] >>= 0;

        STARTED_WATCHING -= _[CURRENT_WATCHTIME_NAME];

        Cache.save(_);
    });

    function GET_WATCH_TIME() {
        return (+new Date) - STARTED_WATCHING;
    }

    Handlers.auto_follow_raids = () => {
        new StopWatch('auto_follow_raids');

        if(nullish(STREAMER))
            return StopWatch.stop('auto_follow_raids');

        let url = parseURL(location),
            data = url.searchParameters;

        let { like, follow } = STREAMER,
            raid = parseBool(data.referrer?.equals('raid') || data.raided);

        if(!like && raid)
            follow();

        Cache.load('LastRaid', ({ LastRaid }) => {
            let { from, to, type } = LastRaid || {};

            if(!like && to?.equals?.(STREAMER.name))
                follow();
        });

        StopWatch.stop('auto_follow_raids');
    };
    Timers.auto_follow_raids = 1000;

    __AutoFollowRaid__:
    if(parseBool(Settings.auto_follow_raids) || parseBool(Settings.auto_follow_all)) {
        RegisterJob('auto_follow_raids');
    }

    let AUTO_FOLLOW_EVENT;
    Handlers.auto_follow_time = async() => {
        new StopWatch('auto_follow_time');

        let { like, follow } = STREAMER,
            mins = parseInt(Settings.auto_follow_time_minutes) | 0;

        if(!like) {
            let secs = GET_WATCH_TIME() / 1000;

            if(secs > (mins * 60))
                follow();

            AUTO_FOLLOW_EVENT ??= setTimeout(follow, mins * 60_000);
        }

        StopWatch.stop('auto_follow_time');
    };
    Timers.auto_follow_time = 1000;

    __AutoFollowTime__:
    if(parseBool(Settings.auto_follow_time) || parseBool(Settings.auto_follow_all)) {
        RegisterJob('auto_follow_time');
    }

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

    /*** Chat & Messaging
     *       _____ _           _              __  __                           _
     *      / ____| |         | |     ___    |  \/  |                         (_)
     *     | |    | |__   __ _| |_   ( _ )   | \  / | ___  ___ ___  __ _  __ _ _ _ __   __ _
     *     | |    | '_ \ / _` | __|  / _ \/\ | |\/| |/ _ \/ __/ __|/ _` |/ _` | | '_ \ / _` |
     *     | |____| | | | (_| | |_  | (_>  < | |  | |  __/\__ \__ \ (_| | (_| | | | | | (_| |
     *      \_____|_| |_|\__,_|\__|  \___/\/ |_|  |_|\___||___/___/\__,_|\__, |_|_| |_|\__, |
     *                                                                    __/ |         __/ |
     *                                                                   |___/         |___/
     */
    /*** Notification Sounds
     *      _   _       _   _  __ _           _   _                _____                       _
     *     | \ | |     | | (_)/ _(_)         | | (_)              / ____|                     | |
     *     |  \| | ___ | |_ _| |_ _  ___ __ _| |_ _  ___  _ __   | (___   ___  _   _ _ __   __| |___
     *     | . ` |/ _ \| __| |  _| |/ __/ _` | __| |/ _ \| '_ \   \___ \ / _ \| | | | '_ \ / _` / __|
     *     | |\  | (_) | |_| | | | | (_| (_| | |_| | (_) | | | |  ____) | (_) | |_| | | | | (_| \__ \
     *     |_| \_|\___/ \__|_|_| |_|\___\__,_|\__|_|\___/|_| |_| |_____/ \___/ \__,_|_| |_|\__,_|___/
     *
     *
     */
    let NOTIFIED = { mention: 0, phrase: 0, whisper: 0 },
        NOTIFICATION_EVENTS = {},
        NOTIFICATION_SOUND = (null
            ?? $('audio#tt-notification-sound')
            ?? furnish('audio#tt-notification-sound', {
                style: 'display:none',

                innerHTML: [
                    // 'mp3',
                    'ogg',
                ]
                    .map(type => {
                        let types = { mp3: 'mpeg' },
                            src = Runtime.getURL(`aud/${ Settings.whisper_audio_sound ?? "goes-without-saying-608" }.${ type }`);
                        type = `audio/${ types[type] ?? type }`;

                        return furnish('source', { src, type }).outerHTML;
                    }).join('')
            })
        );

    /*** Mention Audio
     *      __  __            _   _                                 _ _
     *     |  \/  |          | | (_)                 /\            | (_)
     *     | \  / | ___ _ __ | |_ _  ___  _ __      /  \  _   _  __| |_  ___
     *     | |\/| |/ _ \ '_ \| __| |/ _ \| '_ \    / /\ \| | | |/ _` | |/ _ \
     *     | |  | |  __/ | | | |_| | (_) | | | |  / ____ \ |_| | (_| | | (_) |
     *     |_|  |_|\___|_| |_|\__|_|\___/|_| |_| /_/    \_\__,_|\__,_|_|\___/
     *
     *
     */
    Handlers.mention_audio = () => {
        new StopWatch('mention_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onmention ??= Chat.onmessage = ({ mentions }) => {
            if(mentions.contains(USERNAME) && !NOTIFICATION_SOUND?.playing)
                NOTIFICATION_SOUND?.play();
        };

        StopWatch.stop('mention_audio');
    };
    Timers.mention_audio = -1000;

    Unhandlers.mention_audio = () => {
        NOTIFICATION_SOUND?.pause();
    };

    __NotificationSounds_Mentions__:
    if(parseBool(Settings.mention_audio)) {
        RegisterJob('mention_audio');
    }

    /*** Phrase Audio
     *      _____  _                                            _ _
     *     |  __ \| |                            /\            | (_)
     *     | |__) | |__  _ __ __ _ ___  ___     /  \  _   _  __| |_  ___
     *     |  ___/| '_ \| '__/ _` / __|/ _ \   / /\ \| | | |/ _` | |/ _ \
     *     | |    | | | | | | (_| \__ \  __/  / ____ \ |_| | (_| | | (_) |
     *     |_|    |_| |_|_|  \__,_|___/\___| /_/    \_\__,_|\__,_|_|\___/
     *
     *
     */
    Handlers.phrase_audio = () => {
        new StopWatch('phrase_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onphrase ??= Chat.onmessage = line => {
            when(line => (defined(line.element)? line: false), 1000, line).then(element => {
                if(element.hasAttribute('tt-light') && !NOTIFICATION_SOUND?.playing)
                    NOTIFICATION_SOUND?.play();
            });
        };

        StopWatch.stop('phrase_audio');
    };
    Timers.phrase_audio = 1000;

    Unhandlers.phrase_audio = () => {
        NOTIFICATION_SOUND?.pause();
    };

    __NotificationSounds_Phrases__:
    if(parseBool(Settings.phrase_audio)) {
        RegisterJob('phrase_audio');
    }

    /*** Whisper Audio
     *     __          ___     _                                         _ _
     *     \ \        / / |   (_)                         /\            | (_)
     *      \ \  /\  / /| |__  _ ___ _ __   ___ _ __     /  \  _   _  __| |_  ___
     *       \ \/  \/ / | '_ \| / __| '_ \ / _ \ '__|   / /\ \| | | |/ _` | |/ _ \
     *        \  /\  /  | | | | \__ \ |_) |  __/ |     / ____ \ |_| | (_| | | (_) |
     *         \/  \/   |_| |_|_|___/ .__/ \___|_|    /_/    \_\__,_|\__,_|_|\___/
     *                              | |
     *                              |_|
     */
    Handlers.whisper_audio = () => {
        new StopWatch('whisper_audio');

        // Play sound on new message
        NOTIFICATION_EVENTS.onwhisper ??= Chat.onwhisper = ({ unread, from, message }) => {
            if(!unread && !from && !message)
                return;

            NOTIFICATION_SOUND?.play();
        };

        // Play message on pill-change
        let pill = $('.whispers__pill'),
            unread = parseInt(pill?.textContent) | 0;

        if(nullish(pill))
            return StopWatch.stop('whisper_audio'), NOTIFIED.whisper = 0;
        if(NOTIFIED.whisper >= unread)
            return StopWatch.stop('whisper_audio');
        NOTIFIED.whisper = unread;

        NOTIFICATION_SOUND?.play();

        StopWatch.stop('whisper_audio');
    };
    Timers.whisper_audio = 1000;

    Unhandlers.whisper_audio = () => {
        NOTIFICATION_SOUND?.pause();
    };

    __NotificationSounds_Whispers__:
    if(UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.whisper_audio)) {
        RegisterJob('whisper_audio');
    }

    /*** Currencies
     *       _____                               _
     *      / ____|                             (_)
     *     | |    _   _ _ __ _ __ ___ _ __   ___ _  ___  ___
     *     | |   | | | | '__| '__/ _ \ '_ \ / __| |/ _ \/ __|
     *     | |___| |_| | |  | | |  __/ | | | (__| |  __/\__ \
     *      \_____\__,_|_|  |_|  \___|_| |_|\___|_|\___||___/
     *
     *
     */
    // Customization → src/plugins/customization/block-banners.js
    await TTV.run('block_banners', PLUGIN_CONTEXT);

    /*** Points Receipt & Ranking
     *      _____      _       _         _____               _       _
     *     |  __ \    (_)     | |       |  __ \             (_)     | |
     *     | |__) |__  _ _ __ | |_ ___  | |__) |___  ___ ___ _ _ __ | |_
     *     |  ___/ _ \| | '_ \| __/ __| |  _  // _ \/ __/ _ \ | '_ \| __|
     *     | |  | (_) | | | | | |_\__ \ | | \ \  __/ (_|  __/ | |_) | |_
     *     |_|   \___/|_|_| |_|\__|___/ |_|  \_\___|\___\___|_| .__/ \__|
     *                                                        | |
     *                                                        |_|
     */
    let RECEIPT_TOOLTIP,
        COUNTING_POINTS,
        EXACT_POINTS_SPENT = 0,
        EXACT_POINTS_DEBTED = 0,
        EXACT_POINTS_EARNED = 0,
        COUNTING_HREF = NORMALIZED_PATHNAME,
        OBSERVED_COLLECTION_ANIMATIONS = new Map,
        DISPLAYING_RANK,
        RANK_TOOLTIP,
        TALLY = new Map,
        CHANNEL_POINTS_MULTIPLIER;

    function UpdateReceiptDisplay() {
        let receipt = EXACT_POINTS_EARNED - (EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED),
            glyph = Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'vertical-align:bottom' }),
            { abs } = Math;

        receipt = receipt.floorToNearest(parseInt(String(Settings.channelpoints_receipt_display ?? '').replace('round', '')) || 1);

        let TIME_LEFT = ((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time);
        let AVAILABLE_POINTS = TIME_LEFT < 1? -1: ((120 + 200 * +!top.TWITCH_INTEGRITY_FAIL) * CHANNEL_POINTS_MULTIPLIER * (TIME_LEFT / 3_600_000)) | 0;

        if(AVAILABLE_POINTS < 1)
            AVAILABLE_POINTS = Infinity;

        RECEIPT_TOOLTIP.innerHTML = [
            // Earned
            abs(EXACT_POINTS_EARNED).suffix(' &uarr;', 1, 'natural'),
            // Spent
            abs(EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED).suffix(' &darr;', 1, 'natural'),
            // Available (according to stremer's average stream time)
            parseBool(Settings.show_stats)?
                [furnish(`marquee[direction=left][scrollamount=1]`, { style: 'width:fit-content;vertical-align:top' }).html(`&larr;`), Glyphs.modify('channelpoints', { height: '12px', width: '12px', style: 'vertical-align:-1px;position:relative' }).asNode, furnish(`span#tt-points-left-this-stream`).html(AVAILABLE_POINTS.prefix('', 1, 'natural'))].map(e => e.outerHTML).join(''):
            null
        ].filter(defined).join(' | ');
        $('#tt-points-receipt').innerHTML = `${ glyph } ${ abs(receipt).suffix(`&${ 'du'[+(receipt >= 0)] }arr;`, 1, 'natural') }`;
    }

    setInterval(() => {
        let container = $('#tt-points-left-this-stream');

        if(nullish(container))
            return;

        let TIME_LEFT = ((STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time);
        let AVAILABLE_POINTS = TIME_LEFT < 1? -1: ((120 + 200 * +!top.TWITCH_INTEGRITY_FAIL) * CHANNEL_POINTS_MULTIPLIER * (TIME_LEFT / 3_600_000)) | 0;

        if(AVAILABLE_POINTS < 1)
            AVAILABLE_POINTS = Infinity;

        container.innerHTML = AVAILABLE_POINTS.prefix('', 1, 'natural');
    }, 250);

    __GetMultiplierAmount__:
    if(nullish(CHANNEL_POINTS_MULTIPLIER)) {
        let button = $('[data-test-selector*="points"i][data-test-selector*="summary"i] button');

        if(defined(button)) {
            button.click();

            $('.reward-center-body [href*="//help.twitch.tv/"i]')
                ?.closest('.reward-center-body')
                ?.querySelector('button')
                ?.click();

            CHANNEL_POINTS_MULTIPLIER = parseFloat($('#channel-points-reward-center-header h6')?.innerText) || 1;

            button.click();
        } else {
            CHANNEL_POINTS_MULTIPLIER = 1;
        }
    }

    Handlers.points_receipt_placement = () => {
        // Display the ranking
        new StopWatch('points_receipt_placement__ranking');

        DisplayRanking: {
            let placement;

            if((placement = Settings.points_receipt_placement ??= "null").equals("null")) {
                StopWatch.stop('points_receipt_placement__ranking');
                break DisplayRanking;
            }

            DISPLAYING_RANK = setInterval(async() => {
                let container = $('[data-test-selector="chat-input-buttons-container"i]'),
                    ranking = $('#tt-channel-point-ranking');

                if(nullish(container))
                    return StopWatch.stop('points_receipt_placement__ranking');

                // Field tests show that generally (for established streams): ≤1% of followers are actively watching at any given time during a stream
                let scale = n => n**9;
                let { cult, poll, rank } = STREAMER,
                    place = (100 * scale(rank / cult)).clamp(1, 100) | 0,
                    string = nth((rank * scale(rank / cult)).clamp(1, cult).round().toLocaleString(LANGUAGE)),
                    color = (null
                        ?? ['#FFD700', '#C0C0C0', '#CD7F32'][((place / 10).ceil() || 1) - 1]
                        ?? '#91FF47'
                    );

                rank = (
                    rank < 1 || isNaN(rank)?
                        '&infin;':
                    place <= 30?
                        `<span style="text-decoration:${ 4 - ((place / 10).ceil() || 1) }px underline ${ color }">${ string }</span>`:
                    string
                );

                if(nullish(ranking))
                    container.insertBefore(ranking = (
                        furnish('div', { style: 'animation:1s fade-in 1;' },
                            furnish('#tt-channel-point-ranking', { style: 'display:flex; position:relative; align-items:center; vertical-align:middle; height:100%;' })
                        )
                    ), container.lastElementChild);
                else
                    ranking.innerHTML = Glyphs.modify('trophy', { height: '16px', width: '16px', fill: color }) + rank;

                RANK_TOOLTIP ??= new Tooltip(ranking, rank, { from: 'top' });

                let placementString;

                if(rank.equals('&infin;'))
                    placementString = `Unable to get your rank for this channel`;
                else
                    placementString = `You are in the top ${ place }% of ${ (STREAMER.ping? 'follow': 'view') }ers`;

                if(RANK_TOOLTIP.innerHTML.unlike(placementString))
                    RANK_TOOLTIP.innerHTML = placementString;
            }, 5000);
        }

        StopWatch.stop('points_receipt_placement__ranking');

        // Display the receipt
        new StopWatch('points_receipt_placement');

        DisplayReceipt: {
            let placement;

            if((placement = Settings.points_receipt_placement ??= "null").equals("null"))
                return StopWatch.stop('points_receipt_placement');

            let live_time = $('.live-time');

            if(nullish(live_time))
                return RestartJob('points_receipt_placement', 'missing:live_time');

            let classes = element => [...element.classList].map(label => '.' + label).join('');

            let container = live_time.closest(`*:not(${ classes(live_time) })`),
                parent = container.closest(`*:not(${ classes(container) })`);

            let f = furnish;
            let points_receipt =
                f(`${ container.tagName }${ classes(container) }`, { style: 'min-width:7rem; text-align:center' },
                    f(`${ live_time.tagName }#tt-points-receipt${ classes(live_time).replace(/\blive-time\b/gi, 'points-receipt') }`, { receipt: 0, innerHTML: `${ Glyphs.modify('channelpoints', { height: '20px', width: '20px', style: 'vertical-align:bottom' }) } 0 &uarr;` })
                );

            parent.append(points_receipt);

            RECEIPT_TOOLTIP = new Tooltip(points_receipt);

            COUNTING_POINTS = setInterval(async() => {
                let points_receipt = $('#tt-points-receipt'),
                    balance = $.last('[data-test-selector*="balance-string"i]'),
                    exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p, [class*="points-icon"i] ~ p *:not(:empty)'),
                    exact_change = $('[class*="points"i][class*="summary"i][class*="add-text"i]');

                if(nullish(points_receipt))
                    return RestartJob('points_receipt_placement', 'missing:points_receipt');

                let [chat] = $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]), [data-test-selector*="banned"i][data-test-selector*="message"i], [data-test-selector^="video-chat"i]');

                if(nullish(chat)) {
                    let framedData = PostOffice.get('points_receipt_placement');

                    window.PostOffice = PostOffice;

                    if(nullish(framedData))
                        return;

                    balance ??= { textContent: framedData.balance };
                    exact_debt ??= { textContent: framedData.exact_debt };
                    exact_change ??= { textContent: framedData.exact_change };
                }

                EXACT_POINTS_DEBTED = parseCoin(exact_debt?.textContent ?? EXACT_POINTS_DEBTED) | 0;

                let animationID = ((exact_change?.textContent ?? exact_debt?.textContent ?? -EXACT_POINTS_SPENT) | 0).toString(),
                    animationTimeStamp = +new Date;

                if(!/^([\+\-, \d]+)$/.test(animationID))
                    return;

                // Don't keep adding the exact change while the animation is playing
                if(OBSERVED_COLLECTION_ANIMATIONS.has(animationID)) {
                    let time = OBSERVED_COLLECTION_ANIMATIONS.get(animationID);

                    // It's been less than 5 minutes
                    if(nullish(animationID) || !parseBool(animationID) || Math.abs(animationTimeStamp - time) < 300_000)
                        return;

                    // Continue executing...
                }
                OBSERVED_COLLECTION_ANIMATIONS.set(animationID, animationTimeStamp);

                $log(`Observing "${ animationID }" @ ${ new Date }`, OBSERVED_COLLECTION_ANIMATIONS);

                if(!~[points_receipt, exact_change, balance].findIndex(defined)) {
                    points_receipt?.parentElement?.remove();

                    RestartJob('points_receipt_placement', 'missing:points_receipt,exact_change,balance');

                    return clearInterval(COUNTING_POINTS);
                }

                EXACT_POINTS_EARNED += parseCoin(exact_change?.textContent);

                UpdateReceiptDisplay();
            }, 2_5_0);
        }

        StopWatch.stop('points_receipt_placement');
    };
    Timers.points_receipt_placement = -2_500;

    Unhandlers.points_receipt_placement = () => {
        [COUNTING_POINTS, DISPLAYING_RANK].map(clearInterval);

        $.all('#tt-points-receipt, #tt-channel-point-ranking')
            .forEach(span => span?.parentElement?.remove());
    };

    let REDEMPTION_LISTENERS = {};

    __PointsReceiptPlacement__:
    if(parseBool(Settings.points_receipt_placement)) {
        RegisterJob('points_receipt_placement');

        Chat.onbullet = async({ element, message, subject, mentions }) => {
            element = await element;

            if(!(true
                // The subject matches
                && subject.equals('coin')

                // And...
                && (false
                    // The message is from the user
                    || message.contains(USERNAME)

                    // The message is from the user (for embedded messages)
                    || $('[class*="message"i] [class*="username"i] [data-a-user]', element)?.dataset?.aUser?.equals(USERNAME)
                )
            )) return;

            let [item] = (await STREAMER.shop).filter(reward => reward.title.length && message.mutilate().contains(reward.title.mutilate()));

            if(nullish(item))
                return;

            EXACT_POINTS_SPENT += parseCoin(item.cost) | 0;

            UpdateReceiptDisplay();
        };

        AddRedemptionListener: {
            function addListener(address = 0b1111) {
                // Points spent on unlocked rewards
                if(address & 1) {
                    when.defined(() => $('[data-test-selector*="required"i]:empty'))
                        .then(element => {
                            if(defined(REDEMPTION_LISTENERS.UNLOCKED_REWARDS))
                                return;
                            REDEMPTION_LISTENERS.UNLOCKED_REWARDS = true;

                            element.closest('button').addEventListener('mouseup', ({ currentTarget }) => {
                                let title = $('[id*="reward"i][id*="header"i]').textContent.trim(),
                                    amount = parseCoin(currentTarget?.previousSibling?.nodeValue) | 0;

                                EXACT_POINTS_SPENT += amount;
                                TALLY.set(`Reward: "${ title }" @ ${ (new Date).toJSON() }`, amount);

                                delete REDEMPTION_LISTENERS.UNLOCKED_REWARDS;
                                addListener(1);

                                $log(`Spent ${ amount } on "${ title }"`, new Date);
                            });
                        });

                    when.nullish(() => $('[data-test-selector*="required"i]:empty'))
                        .then(() => delete REDEMPTION_LISTENERS.UNLOCKED_REWARDS);
                }

                // Points spent on votes
                if(address & 2) {
                    when.defined(() => $('[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button'))
                        .then(button => {
                            if(defined(REDEMPTION_LISTENERS.BRIBABLE_VOTES))
                                return;
                            REDEMPTION_LISTENERS.BRIBABLE_VOTES = true;

                            button.addEventListener('mouseup', ({ currentTarget }) => {
                                let title = $('[class*="community"i][class*="stack"i] [data-test-selector="header"i] ~ *')?.textContent ?? 'Something? No real title given',
                                    [amount] = /\p{N}+/u.exec(currentTarget?.textContent) || '';

                                EXACT_POINTS_SPENT += (amount |= 0);
                                TALLY.set(`Poll: "${ title }" @ ${ (new Date).toJSON() }`, amount | 0);

                                delete REDEMPTION_LISTENERS.BRIBABLE_VOTES;
                                addListener(2);

                                $log(`Spent ${ amount } on "${ title }"`, new Date);
                            });
                        });

                    when.nullish(() => $('[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button'))
                        .then(() => delete REDEMPTION_LISTENERS.BRIBABLE_VOTES);
                }
            }

            addListener();
        }
    }

    // Point Watcher → src/plugins/customization/point-watcher.js
    await TTV.run('point_watcher_placement', PLUGIN_CONTEXT);

    /*** Stream Preview
     *       _____ _                              _____                _
     *      / ____| |                            |  __ \              (_)
     *     | (___ | |_ _ __ ___  __ _ _ __ ___   | |__) | __ _____   ___  _____      __
     *      \___ \| __| '__/ _ \/ _` | '_ ` _ \  |  ___/ '__/ _ \ \ / / |/ _ \ \ /\ / /
     *      ____) | |_| | |  __/ (_| | | | | | | | |   | | |  __/\ V /| |  __/\ V  V /
     *     |_____/ \__|_|  \___|\__,_|_| |_| |_| |_|   |_|  \___| \_/ |_|\___| \_/\_/
     *
     *
     */
    let STREAM_PREVIEW;

    Handlers.stream_preview = async() => {
        new StopWatch('stream_preview');

        let richTooltips = $.all(`:is([class*="channel"i], [class*="guest-star"i])[class*="tooltip"i][class*="body"i]`),
            [richTooltip] = richTooltips;

        if(nullish(richTooltip)) {
            if(parseBool(Settings.stream_preview_sound) && MAINTAIN_VOLUME_CONTROL)
                SetVolume(parseBool(Settings.away_mode__volume_control) && AwayModeStatus? Settings.away_mode__volume: InitialVolume ?? 1);
            else if(parseBool(Settings.stream_preview_sound) && defined(STREAM_PREVIEW?.element))
                SetVolume(InitialVolume);

            return StopWatch.stop('stream_preview'), STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
        }

        let [title, subtitle] = $.all('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]) > *', richTooltip),
            isOnline = parseBool(richTooltip.classList?.value?.missing('offline'));

        if(nullish(subtitle)) {
            let [rTitle, rSubtitle] = $.all('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *');

            title = rTitle;
            subtitle = rSubtitle;
        }

        if(nullish(title))
            return StopWatch.stop('stream_preview'), STREAM_PREVIEW?.element?.remove();

        let [alias] = title.textContent.split(/[^\p{L}\w\s]/u);

        alias = alias?.trim();

        let name = (null
            ?? ALL_CHANNELS.find(({ name }) => (
                (name.contains('(') && name.contains(')'))?
                    name.contains(alias):
                name.equals(alias)
            ))
            ?? { name: alias.normalize('NFKD') }
        )?.name?.replace(/[^]*\(([^\(\)]+)\)[^]*/, '$1');

        // There is already a preview of the hovered tooltip
        if([STREAMER?.name, STREAM_PREVIEW?.name].contains(name))
            return StopWatch.stop('stream_preview');

        let { top, left, bottom, right, height, width } = getOffset(richTooltip),
            [body, video] = $.all('body, video').map(getOffset);

        STREAM_PREVIEW?.element?.remove();

        let scale = parseFloat(Settings.stream_preview_scale) || 1,
            muted = !parseBool(Settings.stream_preview_sound),
            quality = (scale > 1? 'auto': '720p'),
            watchParty = $.defined('[data-a-target^="watchparty"i][data-a-target*="overlay"i]'),
            controls = false;

        // Watch-party information...
        // @TODO: Use this...
        // let partyInfo = $('[class*="watch"i][class*="party"i][class*="info"i]'),
        //     partyThumbnail = $('[data-test-selector*="thumbnail"i]', partyInfo),
        //     partyTitle = $('[data-test-selector*="title"i]', partyInfo),
        //     [partyRating, partyReviews, partyYear, partyContentRating] = $.all('[data-test-selector*="title"i] + * > *', partyInfo) ?? [];

        STREAM_PREVIEW = {
            name,
            element:
                furnish(`.tt-stream-preview.invisible[@position=${ (top + height / 2 < body.height / 2)? 'below': 'above' }][@vods=${ richTooltips.length > 1 }]`, {
                        style: (
                            (top + height / 2 < body.height / 2)?
                                // Below tooltip
                                `top: calc(${ bottom }px + 0.5em);`:
                            // Above tooltip
                            `top: calc(${ top }px - 0.5em - (15rem * ${ scale }));`
                        ) + `left: calc(${ (watchParty? getOffset($('[data-a-target^="side-nav-bar"i]'))?.width: video?.left) ?? 50 }px - 6rem); height: calc(15rem * ${ scale }); width: calc(26.75rem * ${ scale }); z-index: ${ '9'.repeat(1 + parseInt(Settings.stream_preview_position ?? 0)) };`,
                    },
                    furnish('.tt-stream-preview--poster', {
                        style: `background-image: url("https://static-cdn.jtvnw.net/previews-ttv/live_user_${ name.toLowerCase() }-1280x720.jpg?${ +new Date }");`,
                        onerror: event => {
                            // Do something if the stream's live preview poster doesn't load...
                        },
                    }),
                    furnish(`iframe#tt-stream-preview--iframe[@index=0][@name=${ name }][@live=${ isOnline }][@controls=${ controls }][@muted=${ muted }][@quality=${ quality }]`, {
                        allow: 'autoplay',
                        src: parseURL(`https://player.twitch.tv/`).addSearch(
                            isOnline?
                                ({
                                    channel: name,
                                    parent: 'twitch.tv',

                                    controls, muted, quality,
                                }):
                            ({
                                video: `v${ richTooltip.closest('[href^="/videos/"i]').href.split('/').pop() }`,
                                parent: 'twitch.tv',
                                autoplay: true,

                                controls, muted, quality,
                            })
                        ).href,

                        height: '100%',
                        width: '100%',

                        onload: event => {
                            $('.tt-stream-preview--poster')?.classList?.add('invisible');
                            $.all('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])').at($('#tt-stream-preview--iframe').dataset.index | 0)?.closest('[href^="/videos/"i]')?.modStyle(`background:var(--color-twitch-purple-${ 6 + (THEME.equals('light')? 6: 0) })`);

                            if(!parseBool(Settings.stream_preview_sound))
                                return;

                            if(nullish(InitialVolume))
                                InitialVolume = GetVolume();

                            let hasAudio = element =>
                                parseBool(null
                                    ?? element?.webkitAudioDecodedByteCount
                                    ?? element?.audioTracks?.length
                                );

                            when.defined(() => $('#tt-stream-preview--iframe')).then(() => SetVolume(0));
                        },
                    })
                )
        };

        $.body.append(STREAM_PREVIEW.element);

        wait(2_5_0).then(() => $('.tt-stream-preview.invisible')?.classList?.remove('invisible'));

        StopWatch.stop('stream_preview');
    };
    Timers.stream_preview = 500;

    Unhandlers.stream_preview = () => {
        STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
    };

    __StreamPreview__:
    if(parseBool(Settings.stream_preview)) {
        $remark('Adding Stream previews...');

        top.onlocationchange = Unhandlers.stream_preview;

        // Add key event listeners to the card
        $.body.addEventListener('keyup', ({ key = '', altKey, ctrlKey, metaKey, shiftKey }) => {
            if(altKey || ctrlKey || metaKey || shiftKey)
                return;

            if(!/^Arrow(Up|Down)$/i.test(key))
                return;

            let richTooltips = $.all(`[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])`),
                { length } = richTooltips,
                iframe = $('#tt-stream-preview--iframe');

            if(nullish(iframe) || richTooltips.length < 1)
                return;

            let { index = 0, controls = false, muted = true, quality = 'auto' } = iframe.dataset;

            index |= 0;
            controls = parseBool(controls);
            muted = parseBool(muted);

            richTooltips.at(index)?.closest('[href^="/videos/"i]')?.removeAttribute('style');

            if(key.equals('ArrowUp'))
                --index;
            else if(key.equals('ArrowDown'))
                ++index;

            if(index < 0)
                index = length - 1;
            else if(index >= length)
                index = 0;

            iframe.dataset.index = index;
            iframe.src = parseURL(`https://player.twitch.tv/`).addSearch({
                video: `v${ richTooltips[index].closest('[href^="/videos/"i]')?.href?.split('/')?.pop() }`,
                parent: 'twitch.tv',
                autoplay: true,

                controls, muted, quality,
            }).href;
        });

        RegisterJob('stream_preview');
    }

    /*** Watch Time Placement
     *     __          __   _       _       _______ _                  _____  _                                     _
     *     \ \        / /  | |     | |     |__   __(_)                |  __ \| |                                   | |
     *      \ \  /\  / /_ _| |_ ___| |__      | |   _ _ __ ___   ___  | |__) | | __ _  ___ ___ _ __ ___   ___ _ __ | |_
     *       \ \/  \/ / _` | __/ __| '_ \     | |  | | '_ ` _ \ / _ \ |  ___/| |/ _` |/ __/ _ \ '_ ` _ \ / _ \ '_ \| __|
     *        \  /\  / (_| | || (__| | | |    | |  | | | | | | |  __/ | |    | | (_| | (_|  __/ | | | | |  __/ | | | |_
     *         \/  \/ \__,_|\__\___|_| |_|    |_|  |_|_| |_| |_|\___| |_|    |_|\__,_|\___\___|_| |_| |_|\___|_| |_|\__|
     *
     *
     */
    let WATCH_TIME_INTERVAL,
        WATCH_TIME_TOOLTIP,
        THIS_POLL = STREAMER.poll,
        THAT_POLL = 1,
        GET_TOP_100_INTERVAL,
        TOP_100_GAME = STREAMER.game,
        IN_TOP_100,
        ALL_WATCHTIME_COUNTS = {},
        ALL_WATCHTIME_VALUES = {};

    Handlers.watch_time_placement = async() => {
        let placement;

        if((placement = Settings.watch_time_placement ??= "null").equals("null"))
            return;

        let parent, container,
            extra = () => {};

        let classes = element => [...element.classList].map(label => '.' + label).join('');

        let live_time = $('.live-time');

        if(nullish(live_time))
            return RestartJob('watch_time_placement', 'missing:live_time');

        switch(placement) {
            // Option 1 "over" - video overlay, volume control area
            case 'over': {
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="left-control-group"i]');
            } break;

            // Option 2 "under" - under quick actions, live count/live time area
            case 'under': {
                container = live_time.closest(`*:not(${ classes(live_time) })`);
                parent = container.closest(`*:not(${ classes(container) })`);

                extra = ({ live_time }) => {
                    live_time.modStyle('color:var(--color-text-live)');

                    if(parseBool(Settings.show_stats))
                        live_time.tooltipAnimation = setInterval(() => {
                            live_time.tooltip ??= new Tooltip(live_time, '');

                            let percentage = (STREAMER.time / (STREAMER.data?.dailyBroadcastTime ?? 16_200_000)).clamp(0, 1),
                                timeLeft = (STREAMER.data?.dailyBroadcastTime ?? 16_200_000) - STREAMER.time;

                            live_time.tooltip.innerHTML = (timeLeft < 0? '+': '') + toTimeString(Math.abs(timeLeft), 'clock');
                            live_time.tooltip.modStyle(`background:linear-gradient(90deg, hsla(${ (120 * percentage) | 0 }, 100%, 50%, 0.5) ${ (100 * percentage).toFixed(2) }%, #0000 0), var(--color-background-tooltip)`);
                        }, 2_5_0);
                };
            } break;

            default: return;
        }

        let f = furnish;
        let watch_time = f(`${ container.tagName }${ classes(container) }`,
            { style: `color: var(--user-contrast-color)`, contrast: THEME__PREFERRED_CONTRAST },
            f(`${ live_time.tagName }#tt-watch-time${ classes(live_time).replace(/\blive-time\b/gi, 'watch-time') }`, { time: 0 })
        );

        WATCH_TIME_TOOLTIP ??= new Tooltip(watch_time);

        parent.append(watch_time);

        extra({ parent, container, live_time, placement });

        Cache.load([CURRENT_WATCHTIME_NAME, `Watching`], _ => {
            let { Watching } = _;
            if(!(Watching instanceof Array))
                Watching = [];

            if((Watching ??= [NORMALIZED_PATHNAME]).missing(NORMALIZED_PATHNAME)) {
                Watching.push(NORMALIZED_PATHNAME);
                STARTED_WATCHING = +($('#root').dataset.aPageLoaded ??= +new Date);
            }

            _[CURRENT_WATCHTIME_NAME] >>= 0;

            WATCH_TIME_INTERVAL = setInterval(() => {
                let watch_time = $('#tt-watch-time'),
                    time = GET_WATCH_TIME();

                if(nullish(watch_time) || !time) {
                    clearInterval(WATCH_TIME_INTERVAL);
                    return RestartJob('watch_time_placement', 'missing:watch_time|time');
                }

                watch_time.setAttribute('time', time);
                watch_time.innerHTML = toTimeString(time, 'clock');
                watch_time.modStyle(`mix-blend-mode:${ ANTITHEME }en;`);

                if(parseBool(Settings.show_stats))
                    WATCH_TIME_TOOLTIP.innerHTML = toTimeString(time, 'short-epoch');

                Cache.load(null, _ => {
                    for(let [key, val] of Object.entries(_).filter((key, val) => /^WatchTimes\/([\w\-]+)/.test(key))) {
                        fixer: if(UP_NEXT_ALLOW_THIS_TAB) {
                            if(key == CURRENT_WATCHTIME_NAME)
                                break fixer;

                            let count = ALL_WATCHTIME_COUNTS[key] >>= 0;
                            let value = ALL_WATCHTIME_VALUES[key] >>= 0;

                            if(value != val) {
                                ALL_WATCHTIME_COUNTS[key] = 0;
                                ALL_WATCHTIME_VALUES[key] = val;
                                continue;
                            }

                            if(++count > 60) {
                                Cache.remove(key);
                                delete ALL_WATCHTIME_COUNTS[key];
                                delete ALL_WATCHTIME_VALUES[key];

                                continue;
                            }

                            ALL_WATCHTIME_COUNTS[key] = count;
                        }

                        if(key == CURRENT_WATCHTIME_NAME)
                            val = time;

                        Cache.save({ [key]: val });
                    }
                });
            }, 500 + (Math.random() * 500));

            Cache.save({ Watching });
        });

        function getTop100(callback = $ => $) {
            let { filename } = parseURL(STREAMER.game.href);

            if(!filename?.length)
                return;

            fetchURL.idempotent(`https://gql.twitch.tv/gql`, {
                method: "POST",
                headers: { "client-id": Search.anonID },
                body: JSON.stringify([{
            		operationName: "DirectoryPage_Game",
            		variables: {
            			imageWidth: 50,
            			slug: filename,
            			options: {
            				sort: "VIEWER_COUNT",
            				freeformTags: null,
            				tags: [],
            				broadcasterLanguages: [],
            				systemFilters: [],
            			},
            			sortTypeIsRecency: false,
            			limit: 100, // [1, 100]
            		},
                    extensions: {
                        persistedQuery: {
                            version: 1,
                            sha256Hash: `3c9a94ee095c735e43ed3ad6ce6d4cbd03c4c6f754b31de54993e0d48fd54e30`,
                        },
                    },
            	}]),
            }).then(r => r.json()).then(json => {
                if(!json?.length)
                    throw `No query data available @ ${ filename }`;

                [json] = json;

                if(json.errors)
                    throw json.errors.join('; ');
                let edges = json
                    ?.data      // [...{ game:object }]
                    ?.game      // { displayName:string, id:string<int>, name:string, streams:object }
                    ?.streams   // { edges:array<object>, pageInfo:object<{ hasNextPage:boolean }> }
                    ?.edges     // [...{ broadcaster:object, freeFormTags:object|array, game:object, id:string<int~GameID>, previewImageURL:object<{ *:string<URL> }>, title:string, type:string, viewersCount:number<int> }]
                ?? [];

                let { game, poll, sole } = STREAMER;

                let polls = [{ sole, poll }], spot = 1, place = null;
                for(let edge of edges) {
                    let { broadcaster, freeFormTags, game, id, previewImageURL, title, type, viewersCount } = edge.node;

                    if(sole == broadcaster.id)
                        place = spot;

                    polls.push({ sole: broadcaster.id, poll: viewersCount, spot: spot++ });
                }

                let container = $('[data-a-target*="viewer"i][data-a-target*="count"i]').parentElement;

                if(IN_TOP_100 = defined(place))
                    new Tooltip(container, `Top 100! #${ place } for <ins>${ game }</ins>`)
                        .setAttribute('rainbow-border', true);
                else if(nullish(IN_TOP_100 = null))
                    new Tooltip(container, `Viewer change: &${ 'du'[+(THIS_POLL >= THAT_POLL)] }arr; ${ Math.abs(THIS_POLL - THAT_POLL) }`)
                        .setAttribute('rainbow-border', false);

                callback();
            }).catch(error => {
                $warn(error);

                clearInterval(GET_TOP_100_INTERVAL);
            });
        }

        GET_TOP_100_INTERVAL = setInterval(() => {
            THIS_POLL = STREAMER.poll;

            let updt = () => THAT_POLL = THIS_POLL;
            let DIFF = Math.abs(THIS_POLL - THAT_POLL) / THAT_POLL;

            // The game has changed
            if(TOP_100_GAME.unlike(STREAMER.game))
                return (TOP_100_GAME = STREAMER.game) && getTop100(updt);
            // 15% change in polls
            if(THIS_POLL > 5000 && DIFF > .15)
                getTop100(updt); // for gradual changes
            // 10% change in polls
            if(THIS_POLL > 500 && THIS_POLL <= 5000 && DIFF > .10)
                getTop100(updt); // for gradual changes
            // 5% change in polls
            else if(THIS_POLL > 50 && THIS_POLL <= 500 && DIFF > .05)
                getTop100(updt); // for gradual changes
            // Any change in polls
            else if(THIS_POLL <= 50 && THIS_POLL != THAT_POLL)
                if(IN_TOP_100 || nullish(IN_TOP_100))
                    getTop100(updt); // for gradual changes

            // THAT_POLL = THIS_POLL; // for spikes
        }, 5_000);
    };
    Timers.watch_time_placement = -1000;

    Unhandlers.watch_time_placement = () => {
        clearInterval(WATCH_TIME_INTERVAL);

        $('#tt-watch-time')?.parentElement?.remove();

        let live_time = $('.live-time');

        live_time?.removeAttribute('style');
        live_time?.tooltip?.remove?.();
        clearInterval(live_time?.tooltipAnimation);

        if(UnregisterJob.__reason__.anyOf('modify', 'reinit'))
            return;

        Cache.save({ Watching: [] });
    };

    __WatchTimePlacement__:
    if(parseBool(Settings.watch_time_placement)) {
        RegisterJob('watch_time_placement');
    }

    /*** Networking
     *      _   _      _                      _    _
     *     | \ | |    | |                    | |  (_)
     *     |  \| | ___| |___      _____  _ __| | ___ _ __   __ _
     *     | . ` |/ _ \ __\ \ /\ / / _ \| '__| |/ / | '_ \ / _` |
     *     | |\  |  __/ |_ \ V  V / (_) | |  |   <| | | | | (_| |
     *     |_| \_|\___|\__| \_/\_/ \___/|_|  |_|\_\_|_| |_|\__, |
     *                                                      __/ |
     *                                                     |___/
     */
    /*** Auto DVR
     *                    _          _______      _______
     *         /\        | |        |  __ \ \    / /  __ \
     *        /  \  _   _| |_ ___   | |  | \ \  / /| |__) |
     *       / /\ \| | | | __/ _ \  | |  | |\ \/ / |  _  /
     *      / ____ \ |_| | || (_) | | |__| | \  /  | | \ \
     *     /_/    \_\__,_|\__\___/  |_____/   \/   |_|  \_\
     *
     *
     */
    let AUTO_DVR__CHECKING, AUTO_DVR__CHECKING_INTERVAL,
        MASTER_VIDEO = $('[data-a-player-state] video');

    // Might take a few seconds to fulfill...
    when.defined(() => $('[data-a-player-state] video')).then(_ => MASTER_VIDEO = _);

    Handlers.video_clips__dvr = () => {
        new StopWatch('video_clips__dvr');

        // Add the button to all channels
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel))
            return StopWatch.stop('video_clips__dvr');

        Cache.load('DVRChannels', async({ DVRChannels }) => {
            try {
                DVRChannels = JSON.parse(DVRChannels || '{}');
            } catch(error) {
                // Probably an object already...
                DVRChannels ??= {};
            }

            let f = furnish,
                s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                DVR_ID = STREAMER.name.toLowerCase(),
                enabled = parseBool(DVRChannels[DVR_ID]?.length),
                [title, subtitle, icon] = [
                    ['Turn DVR on', `${ s(STREAMER.name) } live streams will be recorded`, 'host'],
                    ['Turn DVR off', `${ s(STREAMER.name) } live streams will no longer be recorded`, 'clip']
                ][+!!enabled];

            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

            // Create the action button...
            let action =
            f('div', { 'tt-action': 'auto-dvr', 'for': DVR_ID, enabled, 'action-origin': 'foreign', style: `animation:1s fade-in 1;` },
                f('button', {
                    onmouseup: async event => {
                        let { currentTarget, isTrusted = false, button = -1 } = event;

                        if(!!button)
                            return /* Not the primary button */;

                        Cache.load('DVRChannels', async({ DVRChannels }) => {
                            try {
                                DVRChannels = JSON.parse(DVRChannels || '{}');
                            } catch(error) {
                                // Probably an object already...
                                DVRChannels ??= {};
                            }

                            let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"),
                                DVR_ID = STREAMER.name.toLowerCase(),
                                enabled = !parseBool(DVRChannels[DVR_ID]?.length),
                                [title, subtitle, icon] = [
                                    ['Turn DVR on', `${ s(STREAMER.name) } live streams will be recorded`, 'host'],
                                    ['Turn DVR off', `${ s(STREAMER.name) } live streams will no longer be recorded`, 'clip']
                                ][+!!enabled];

                            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                            $('.tt-action-icon', currentTarget).innerHTML = icon;
                            $('.tt-action-title', currentTarget).textContent = title;
                            $('.tt-action-subtitle', currentTarget).textContent = subtitle;

                            // Add the DVR...
                            let message;
                            if(enabled) {
                                message = `${ s(STREAMER.name) } streams will be recorded.`;

                                DVRChannels[DVR_ID] = DVR_CLIP_PRECOMP_NAME;

                                when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                                    .then(() => {
                                        SetQuality(VideoClips.quality, 'auto').then(() => {
                                            MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: 'AUTO_DVR', as: DVR_CLIP_PRECOMP_NAME, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                                            MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                                        });
                                    });
                            }
                            // Remove the DVR...
                            else {
                                message = `${ STREAMER.name } will not be recorded.`;

                                delete DVRChannels[DVR_ID];

                                MASTER_VIDEO.DEFAULT_RECORDING?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                            }

                            currentTarget.closest('[tt-action]').setAttribute('enabled', enabled);

                            // @FIXME: Live Reminder alerts will not display if another alert is present...
                            Cache.save({ DVRChannels }, () => Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) }).then(() => parseBool(message) && alert.timed(message, 7000)).catch($warn));
                        });
                    },
                }, f.div(
                    f('.tt-action-icon').html(icon),
                    f.div(
                        f('p.tw-title.tt-action-title').with(title),
                        f('p.tt-action-subtitle').with(subtitle)
                    )
                ))
            );

            actionPanel.append(action);

            // Run DVR if enabled...
            if(enabled && !STREAMER.redo) {
                when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                    .then(() => {
                        SetQuality(VideoClips.quality, 'auto').then(() => {
                            MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: 'AUTO_DVR', mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats });

                            MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                        });
                    });

                let leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                    if(STASH_SAVED)
                        return;
                    STASH_SAVED = true;

                    for(let [guid, { recording }] of Recording.__RECORDERS__)
                        if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                            recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                        else
                            recording?.stop()?.save();

                    let next = await GetNextStreamer();

                    $log('Saving current DVR stash. Reason (DVR leave handler):', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);
                };

                $.on('focusin', event => {
                    let DVR_ID = STREAMER.name.toLowerCase();

                    if(top.focusedin)
                        return;
                    top.focusedin = true;
                    top.addEventListener('beforeunload', leaveHandler);

                    // top.addEventListener('visibilitychange', leaveHandler);
                });
            }

            // @performance
            PrepareForGarbageCollection(DVRChannels);
        });

        StopWatch.stop('video_clips__dvr');
    };
    Timers.video_clips__dvr = -2_500;

    try {
        Object.defineProperties(top, {
            DVR_CLIP_PRECOMP_NAME: {
                get() {
                    let chunks = MASTER_VIDEO.getRecording(Recording.ANY)?.blobs;

                    if(!chunks?.length)
                        return new ClipName(2);

                    let now = new Date;

                    // File Name
                    return [
                        STREAMER.name,
                        now.toLocaleDateString().replace(/[\/\\:\*\?"<>\|]+/g, '-'),
                        `(${ (parseBool(Settings.show_stats)? toTimeString(chunks.recordingLength, 'short'): ((now.getHours() % 12) || 12) + now.getMeridiem()).replace(/\b(0+[ydhms])+/ig, '') })`,
                    ]
                        .filter(s => s?.length)
                        .map(s => s.trim())
                        .join(' ');
                },
            },
        });

        top.addEventListener('beforeunload', async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
            if(STASH_SAVED)
                return;
            STASH_SAVED = true;

            for(let [guid, { recording }] of Recording.__RECORDERS__)
                if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                    recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                else
                    recording?.stop()?.save();

            let next = await GetNextStreamer();

            $log('Saving current DVR stash. Reason (beforeunload):', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);
        });
    } catch(error) {
        /* Ignore these errors :P */
    }

    Handlers.__MASTER_AUTO_DVR_HANDLER__ = event => {
        MASTER_VIDEO.DEFAULT_RECORDING?.then(({ target }) => {
            let chunks = target.blobs;
            let feed = null /* No prompt exists for the master recording */,
                halt = parseBool(feed?.getAttribute('halt')),
                name = (feed?.getAttribute('value') || DVR_CLIP_PRECOMP_NAME).replace(GetFileSystem().allIllegalFilenameCharacters, '-');
        })
        ?.stop()
        ?.save(DVR_CLIP_PRECOMP_NAME)
        ?.then(link => alert.silent(`
            <video controller controls
                title="Video Saved &mdash; ${ link.download }"
                src="${ link.href }" style="max-width:-webkit-fill-available"
            ></video>
            `)
        );
    };

    Unhandlers.video_clips__dvr = () => {
        let DVR_ID = STREAMER.name.toLowerCase();

        MASTER_VIDEO.DEFAULT_RECORDING?.stop();
    };

    setInterval(() => {
        if(nullish(top.titleInterval))
            top.titleInterval = setInterval(() => {
                document.title = (
                    MASTER_VIDEO.hasRecording(Recording.ANY)?
                        `\u{1f534} ${ STREAMER.name } - ${ toTimeString((new Date) - MASTER_VIDEO.getRecording(Recording.ANY)?.creationTime, 'clock') }`:
                    `${ STREAMER.name } - Twitch`
                );
            }, 250);
    }, 1000);

    __AutoDVR__:
    if(parseBool(Settings?.video_clips__dvr)) {
        $remark('Adding DVR functionality...');

        function HandleAd(adCountdown) {
            let [main, mini] = $.all('video');

            if(false
                || nullish(main)
                || !main.hasRecording('AUTO_DVR')
                || nullish(mini)
            )
                return when.defined(() => $('[data-a-target*="ad-countdown"i]')).then(HandleAd);

            let blobs = main.getRecording('AUTO_DVR')?.blobs ?? [];

            let InsertChunksAt = blobs.length;

            let AdBreak = Recording.proxy(mini, { name: 'AUTO_DVR:AD_HANDLER', mimeType: main.mimeType });

            AdBreak.then(event => {
                let chunks = event.target.blobs;

                $notice(`Adding chunks to main <video> @ ${ InsertChunksAt }`, { blobs, chunks, event });

                blobs.splice(InsertChunksAt, 0, ...chunks);
            });

            when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                .then(() => {
                    let [main, mini] = $.all('video');

                    main?.resumeRecording('AUTO_DVR');
                    mini?.stopRecording('AUTO_DVR:AD_HANDLER');

                    when.defined(() => $('[data-a-target*="ad-countdown"i]'))
                        .then(HandleAd);

                    $notice(`Ad is done playing... ${ toTimeString((new Date) - main?.getRecording('AUTO_DVR')?.creationTime, 'clock') } | ${ (new Date).toJSON() }`, { main, mini, blobs, chunks: mini?.getRecording('AUTO_DVR:AD_HANDLER')?.blobs });
                });

            main.pauseRecording('AUTO_DVR');

            $notice(`There is an ad playing... ${ toTimeString((new Date) - main.getRecording('AUTO_DVR')?.creationTime, 'clock') } | ${ (new Date).toJSON() }`, { main, mini });
        }

        when.defined(() => $('[data-a-target*="ad-countdown"i]'))
            .then(HandleAd);

        // This is where the magic happens
            // Begin looking for DVR channels...
        AUTO_DVR__CHECKING_INTERVAL =
        setInterval(AUTO_DVR__CHECKING ??= () => {
            new StopWatch('video_clips__dvr__checking_interval');

            if(UP_NEXT_ALLOW_THIS_TAB)
                Cache.load('DVRChannels', async({ DVRChannels }) => {
                    try {
                        DVRChannels = JSON.parse(DVRChannels || '{}');
                    } catch(error) {
                        // Probably an object already...
                        DVRChannels ??= {};
                    }

                    checking:
                    // Only check for the stream when it's live; if the dates don't match, it just went live again
                    for(let DVR_ID in DVRChannels) {
                        let streamer = (DVR_ID + '').toLowerCase();
                        let channel = await new Search(streamer).then(Search.convertResults),
                            ok = parseBool(channel?.ok);

                        // Search did not complete...
                        let num = 3;
                        while(!ok && num-- > 0) {
                            delete channel;

                            Search.void(streamer);

                            // @research
                            channel = await new Search(streamer).then(Search.convertResults);
                            ok = parseBool(channel?.ok);

                            // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [DVR]: "${ streamer }" → OK = ${ ok }`);
                        }

                        if(!num && !ok) {
                            channel = ALL_CHANNELS.find(channel => channel.name.equals(DVR_ID));

                            if(nullish(channel?.name))
                                continue checking;
                        }

                        if(!parseBool(channel.live)) {
                            // @performance
                            PrepareForGarbageCollection(channel, DVRChannels);

                            continue checking;
                        }

                        let { name, live, icon, href, data = { actualStartTime: null } } = channel,
                            slug = DVRChannels[name.toLowerCase()],
                            enabled = defined(slug);
                        let index = (ALL_FIRST_IN_LINE_JOBS.findIndex(href => parseURL(href).pathname.slice(1).equals(name))),
                            job = ALL_FIRST_IN_LINE_JOBS[index];

                        if(defined(job) && name.unlike(STREAMER.name) && enabled) {
                            // Skip the queue!
                            let [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1),
                                name = parseURL(removed).pathname.slice(1);

                            $notice(`Skipper work:`, removed);

                            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);

                            // Skipper
                            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: (parseURL(removed).searchParameters?.redo ?? "") });

                            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                                $log('Skipping queue in favor of a DVR channel', job);

                                goto(parseURL(job).addSearch({ dvr: true }).href);
                            });
                        }

                        // Release memory...
                        delete channel;
                    }

                    // Send the length to the settings page
                    Settings.set({ 'DVR_CHANNELS': Object.keys(DVRChannels) });

                    StopWatch.stop('video_clips__dvr__checking_interval', 30_000);

                    // @performance
                    PrepareForGarbageCollection(DVRChannels);
                });
        }, 30_000);

        // Add the panel & button
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel)) {
            actionPanel = furnish('.about-section__actions', { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });

            $('.about-section')?.append?.(actionPanel);
        } else {
            for(let child of actionPanel.children)
                child.setAttribute('action-origin', 'native');
        }

        // Pause Up Next and handle DVR events
        if(false
            || parseBool(parseURL(top.location.href).searchParameters?.dvr)
            || STREAMER?.redo === false
        )
            Cache.load('DVRChannels', async({ DVRChannels }) => {
                try {
                    DVRChannels = JSON.parse(DVRChannels || '{}');
                } catch(error) {
                    // Probably an object already...
                    DVRChannels ??= {};
                }

                for(let DVR_ID in DVRChannels) {
                    let streamer = (DVR_ID + '').toLowerCase();

                    if(parseBool(DVRChannels[DVR_ID]) && [STREAMER.name, STREAMER.sole].map(s => (s + '').toLowerCase()).contains(streamer))
                        when.defined(() => $('#up-next-control'))
                            .then(button => {
                                let paused = parseBool(button.getAttribute('paused'));

                                if(paused)
                                    return;

                                button?.click();
                            })
                            .then(() => {
                                if(compareVersions(`${ Manifest.version } ≥ 5.33.0.8`)) // @deprecated
                                    confirm.silent(`<div hidden controller deny="Why?" okay="Acknowledge (interact)" title="${ STREAMER.name } &mdash; DVR Notice"></div>
                                        To guarantee DVRs save when this page navigates to another stream (or reloads unexpectedly), you must interact with this page.
                                    `)
                                        .then(answer => {
                                            if(!answer)
                                                open('https://developer.mozilla.org/en-US/docs/Web/Security/User_activation', '_blank');
                                        });

                                if(parseBool($('[data-recording-status]')?.getAttribute('data-recording-status')))
                                    new Tooltip($('[data-recording-status]'), `Recording this stream: ${ STREAMER.name }`);

                                // Extra handler. This is suppose to handle ad-recording. But it's above (see `enabled && !STREAMER.redo`)
                                if(MASTER_VIDEO.hasRecording('AUTO_DVR'))
                                    return /* Already recording over ads... */;

                                when.nullish(() => $('[data-a-target*="ad-countdown"i]'))
                                    .then(() => {
                                        let recordingKey = 'AUTO_DVR:AD_COUNTDOWN';

                                        SetQuality(VideoClips.quality, 'auto').then(() => {
                                            Recording.proxy(MASTER_VIDEO, { name: recordingKey, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats })
                                                .then(Handlers.__MASTER_AUTO_DVR_HANDLER__);

                                            when(() => MASTER_VIDEO.hasRecording('AUTO_DVR')).then(() => {
                                                MASTER_VIDEO.cancelRecording(recordingKey, `Master recording ("AUTO_DVR") already exists. Removing "AUTO_DVR:AD_COUNTDOWN"`).removeRecording(recordingKey);
                                            });

                                            wait(5000).then(() => {
                                                if(!MASTER_VIDEO.hasRecording(recordingKey))
                                                    return;

                                                MASTER_VIDEO.DEFAULT_RECORDING = MASTER_VIDEO.getRecording(recordingKey);

                                                MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                                            });
                                        });
                                    });

                                let leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                                    if(STASH_SAVED)
                                        return;
                                    STASH_SAVED = true;

                                    let DVR_ID = STREAMER.name.toLowerCase();

                                    for(let [guid, { recording }] of Recording.__RECORDERS__)
                                        if(recording == MASTER_VIDEO.DEFAULT_RECORDING)
                                            recording?.stop()?.save(DVR_CLIP_PRECOMP_NAME);
                                        else
                                            recording?.stop()?.save();

                                    let next = await GetNextStreamer();

                                    $log('Saving current DVR stash. Reason (panel leave handler):', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);
                                };

                                $.on('focusin', event => {
                                    let DVR_ID = STREAMER.name.toLowerCase();

                                    if(top.focusedin)
                                        return;
                                    top.focusedin = true;
                                    top.addEventListener('beforeunload', leaveHandler);

                                    // top.addEventListener('visibilitychange', leaveHandler);
                                });
                            });
                }

                // @performance
                PrepareForGarbageCollection(DVRChannels);
            });

        AUTO_DVR__CHECKING?.();
        RegisterJob('video_clips__dvr');
    }

    /*** Video Recovery
     *     __      ___     _              _____
     *     \ \    / (_)   | |            |  __ \
     *      \ \  / / _  __| | ___  ___   | |__) |___  ___ _____   _____ _ __ _   _
     *       \ \/ / | |/ _` |/ _ \/ _ \  |  _  // _ \/ __/ _ \ \ / / _ \ '__| | | |
     *        \  /  | | (_| |  __/ (_) | | | \ \  __/ (_| (_) \ V /  __/ |  | |_| |
     *         \/   |_|\__,_|\___|\___/  |_|  \_\___|\___\___/ \_/ \___|_|   \__, |
     *                                                                        __/ |
     *                                                                       |___/
     */
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

    /*** Developer Features
     *      _____                 _                         ______         _
     *     |  __ \               | |                       |  ____|       | |
     *     | |  | | _____   _____| | ___  _ __   ___ _ __  | |__ ___  __ _| |_ _   _ _ __ ___  ___
     *     | |  | |/ _ \ \ / / _ \ |/ _ \| '_ \ / _ \ '__| |  __/ _ \/ _` | __| | | | '__/ _ \/ __|
     *     | |__| |  __/\ V /  __/ | (_) | |_) |  __/ |    | | |  __/ (_| | |_| |_| | | |  __/\__ \
     *     |_____/ \___| \_/ \___|_|\___/| .__/ \___|_|    |_|  \___|\__,_|\__|\__,_|_|  \___||___/
     *                                   | |
     *                                   |_|
     */
    Handlers.extra_keyboard_shortcuts = () => {
        /* Add the shortcuts */

        // Take screenshots of the stream
        // Alt + Shift + X | Opt + Shift + X
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X))
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X = function Take_a_Screenshot({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey) && altKey && shiftKey && key.equals('x'))
                    $.all('video').pop().copyFrame()
                        .then(async copied => await alert.timed(`Screenshot saved to clipboard!<p tt-x>${ (new UUID).value }</p>`, 5000))
                        .catch(async error => await alert.timed(`Failed to take screenshot: ${ error }<p tt-x>${ (new UUID).value }</p>`, 7000));
            });

        // Begin recording the stream
        // Alt + Z | Opt + Z
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z)) {
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z = function Start_$_Stop_a_Recording({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || shiftKey) && altKey && key.equals('z')) {
                    let video = MASTER_VIDEO;
                    let system =  GetFileSystem();

                    video.setAttribute('uuid', video.uuid ??= (new UUID).value);

                    let body = `<input hidden controller anchor="${ video.uuid }"
                        icon="\uD83D\uDD34\uFE0F" title="Recording ${ (STREAMER?.name ?? top.location.pathname.slice(1).split('/').shift()) }..."
                        placeholder="${ DEFAULT_CLIP_NAME }"
                        pattern="${ system.acceptableFilenames.source }"

                        okay="${ encodeHTML(Glyphs.modify('download', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Save"
                        deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Discard"
                        />

                        <table is-hidden="${ !Settings.experimental_mode }">
                            <caption>Video details</caption>
                            <tbody>
                                <tr>
                                    <td>Slug</td>
                                    <td><code>${ DEFAULT_CLIP_NAME }</code></td>
                                </tr>
                                <tr>
                                    <td>Length</td>
                                    <td><code tt-clip-timer data-connected-to=${ video.uuid }></code></td>
                                </tr>
                                <tr>
                                    <td>Size</td>
                                    <td><code tt-clip-watcher data-connected-to=${ video.uuid }></code></td>
                                </tr>
                                <tr>
                                    <td style=padding-right:1em>Dimensions</td>
                                    <td><code tt-clip-sizer data-connected-to=${ video.uuid }></code></td>
                                </tr>
                                <tr>
                                    <td>Quality</td>
                                    <td tt-clip-rater data-connected-to=${ video.uuid }></td>
                                </tr>
                                <tr>
                                    <td>Type</td>
                                    <td tt-clip-typer data-connected-to=${ video.uuid }></td>
                                </tr>
                            </tbody>
                        </table>

                        <div>
                            <h4>You can change the filename of this recording below.</h4>
                            <p>You <strong>cannot</strong> use the following characters: ${ system.unacceptableFilenameCharacters.filter(c => system.characterNames[c].composable).map(c => `<code title="${ system.characterNames[c] }">${ c }</code>`).join(' ') }</p>
                        </div>`;

                    let EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;
                    let SAVE_NAME = DEFAULT_CLIP_NAME;

                    if(!video.hasRecording(EVENT_NAME)) {
                        prompt.silent(body).then(value => {
                            let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`);
                            let temp = video.stopRecording(EVENT_NAME);

                            feed?.setAttribute('halt', nullish(value));

                            if(nullish(value)) {
                                phantomClick($('.deny', feed));
                            } else {
                                phantomClick($('.okay', feed));
                                temp.saveRecording(EVENT_NAME, SAVE_NAME = value || SAVE_NAME);
                            }

                            temp?.removeRecording(EVENT_NAME);
                        });

                        SetQuality(VideoClips.quality, 'auto').then(() => {
                            Recording.proxy(video, { name: EVENT_NAME, as: DEFAULT_CLIP_NAME, mimeType: `video/${ VideoClips.filetype }`, hidden: !Settings.show_stats })
                                .then(({ target }) => {
                                    let chunks = target.blobs;
                                    let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`),
                                        halt = parseBool(feed?.getAttribute('halt')),
                                        name = (feed?.getAttribute('value') || SAVE_NAME).replace(GetFileSystem().allIllegalFilenameCharacters, '-');

                                    return SAVE_NAME = name;
                                })
                                .catch(error => {
                                    $warn(error);

                                    alert.timed(error, 7000);
                                })
                                .finally(() => {
                                    DEFAULT_CLIP_NAME = new ClipName(2);

                                    video.stopRecording(EVENT_NAME).saveRecording(EVENT_NAME, SAVE_NAME);

                                    when.defined(() => $(`[data-save-name="${ SAVE_NAME.replaceAll('"', '&quot;') }"i]`)).then(link => alert.silent(`
                                        <video controller controls
                                            title="Video Saved &mdash; ${ link.download }"
                                            src="${ link.href }" style="max-width:-webkit-fill-available"
                                        ></video>
                                        `)
                                    );
                                });
                        });
                    } else {
                        let feed = $(`.tt-prompt[uuid="${ UUID.from(body).value }"i]`);

                        phantomClick($('.okay', feed));
                    }
                }
            });

            // Save current recording(s) before leaving
            let leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                if(STASH_SAVED)
                    return;
                STASH_SAVED = true;

                let next = await GetNextStreamer();

                $log('Saving current recording(s). Reason (keyboard shortcuts leave handler):', { hosting, raiding, raided, leaving: defined(from) }, 'Moving onto:', next);

                for(let [guid, { recording }] of Recording.__RECORDERS__)
                    recording?.stop()?.save();
            };

            $.on('focusin', event => {
                if(top.focusedin)
                    return;
                top.focusedin = true;
                top.addEventListener('beforeunload', leaveHandler);

                // top.addEventListener('visibilitychange', leaveHandler);
            });
        }

        // Send the previewed channel to the miniplayer
        // <Stream Preview>:hover → Z
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_Z))
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_Z = function Send_to_Miniplayer({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('z') && $.defined('#tt-stream-preview--iframe') && parseBool($('#tt-stream-preview--iframe').dataset.live))
                    MiniPlayer = $('#tt-stream-preview--iframe').dataset.name;
            });

        // Send the previewed channel to Live Reminders
        // <Stream Preview>:hover → R
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_R))
            $.on('keydown', GLOBAL_EVENT_LISTENERS.KEYDOWN_R = function Send_to_Live_Reminders({ key = '', altKey, ctrlKey, metaKey, shiftKey }) {
                if(!(ctrlKey || metaKey || altKey || shiftKey) && key.equals('r') && $.defined('#tt-stream-preview--iframe') && parseBool($('#tt-stream-preview--iframe').dataset.live)) {
                    let name = $('#tt-stream-preview--iframe').dataset.name;

                    Cache.load('LiveReminders', async({ LiveReminders }) => {
                        try {
                            LiveReminders = JSON.parse(LiveReminders || '{}');
                        } catch(error) {
                            // Probably an object already...
                            LiveReminders ??= {};
                        }

                        let justInCase = { ...LiveReminders };

                        if(defined(LiveReminders[name]))
                            return confirm
                                .timed(`<div hidden controller
                                    okay="${ encodeHTML(Glyphs.modify('checkmark', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } OK"
                                    deny="${ encodeHTML(Glyphs.modify('trash', { height: '20px', width: '20px', style: 'vertical-align:bottom' })) } Stop"
                                    ></div>You're already getting notifications for <a href="/${ name }">${ name }</a>.`, 7000)
                                .then(ok => {
                                    // The user pressed "Cancel"
                                    if(ok === false) {
                                        delete LiveReminders[name];

                                        Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                                    }
                                });
                        let search = await new Search(name).then(Search.convertResults);

                        LiveReminders[name] = (search.live? new Date(search?.data?.actualStartTime): search?.data?.lastSeen ?? new Date);

                        Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));

                        await confirm
                            .timed(`You'll be notified when <a href="/${ name }">${ name }</a> goes live.`, 7000)
                            .then(ok => {
                                // The user pressed "Cancel"
                                if(ok === false)
                                    Cache.save({ LiveReminders: { ...justInCase } }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }));
                            });

                        // @performance
                        PrepareForGarbageCollection(LiveReminders);
                    });
                }
            });

        // Display the enabled keyboard shortcuts
        let [help] = $.body.getAllElementsByText('space/k', 'i').filter(element => element.tagName.equals('TBODY'));

        let f = furnish;
        if(defined(help) && $.nullish('.tt-extra-keyboard-shortcuts', help))
            for(let shortcut in GLOBAL_EVENT_LISTENERS)
                if(/^(key(?:up|down)_)/i.test(shortcut)) {
                    let name = GLOBAL_EVENT_LISTENERS[shortcut].toTitle(),
                        macro = GetMacro(shortcut.toLowerCase().split('_').slice(1).join('+'));

                    if(!name.length)
                        continue;

                    help.append(
                        f('tr.tw-table-row.tt-extra-keyboard-shortcuts').with(
                            f('td.tw-table-cell').with(
                                f.p(name)
                            ),
                            f('td.tw-table-cell').with(
                                f.span(macro)
                            )
                        )
                    );
                }
    };
    Timers.extra_keyboard_shortcuts = 2_5_0;

    __ExtraKeyboardShortcuts__:
    if(parseBool(Settings.extra_keyboard_shortcuts)) {
        RegisterJob('extra_keyboard_shortcuts');
    }

    let DEFAULT_CLIP_NAME = new ClipName(2);
    let GLOBAL_CLIP_HANDLER = setInterval(() => {
        // The Alt+Z recorder only exists while Extra Keyboard Shortcuts is on (#53)
        if(nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z))
            return;

        let EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;

        // Maintains a timer of the clip
        $.all('[tt-clip-timer]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`),
                    recorder = video.getRecording(EVENT_NAME);

                element.closest('[icon]').setAttribute('icon', element.innerHTML = toTimeString((+new Date) - recorder?.creationTime, 'clock'));
            });

        // Gets the clip's dimensions
        $.all('[tt-clip-sizer]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`);

                element.innerHTML = `${ video.videoWidth }&times;${ video.videoHeight }`;
            });

        // Gets the clip's file type
        $.all('[tt-clip-typer]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`),
                    [type] = (video?.mimeType ?? 'video/x-unknown').split(';');

                element.innerHTML =  `<code>${ MIME_Types.find(type) }</code> <code>${ type }</code>`;
            });

        // Maintains the framerate of the clip
        $.all('[tt-clip-rater]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`),
                    recorder = video.getRecording(EVENT_NAME),
                    data = recorder?.blobs;

                element.innerHTML = `<code>${ video.videoHeight }p</code> <code>${ ((data?.reduce((total, { size = 0 }) => total += size, 0) / data?.length) | 0).suffix('bps', false, 'data') }</code>`;
            });

        // Maintains the file size of the clip
        $.all('[tt-clip-watcher]')
            .map(element => {
                let video = $(`video[uuid="${ element.dataset.connectedTo }"]`),
                    recorder = video.getRecording(EVENT_NAME),
                    data = recorder?.blobs;

                element.innerHTML = data?.reduce((total, { size = 0 }) => total += size, 0)?.suffix('B', 2);
            });

        // All unit targets
        $.all('[unit] input').map(input => {
            input.onfocus ??= ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', true);
            input.onblur ??= ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', false);

            if(input.disabled)
                input.closest('[unit]').setAttribute('valid', true);
            else
                input.oninput = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('valid', currentTarget.checkValidity());
        });
    }, 1000);

    // Miscellaneous → src/plugins/misc/miscellaneous.js
    await TTV.run('miscellaneous', PLUGIN_CONTEXT);

};
// End of Initialize

let PAGE_CHECKER,
    WAIT_FOR_PAGE,
    PAGE_IS_READY = false,
    RECOVERY_TRIALS = 0,
    VIDEO_AD_COUNTDOWN,
    NORMALIZED_AD_VOLUME = false,
    NORMALIZED_AD_COUNTER = 0,
    NORMALIZED_AD_COUNTER_CURRENT = 1,
    LAST_TIME_AD_WAS_CHECKED,
    LAST_VALUE_WHEN_AD_WAS_CHECKED;

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
        let KeepAlive = Runtime.connect({ name: 'PING' });

        KeepAlive.postMessage('PING', () => KeepAlive.disconnect());
    }, 180e3);

    Runtime.sendMessage({ action: 'GET_VERSION' }, async({ version = null }) => {
        let isProperRuntime = Manifest.version === version;

        PAGE_CHECKER = !isProperRuntime?
            $error(`The current runtime (v${ Manifest.version }) is not correct (v${ version })`)
                .toNativeStack():
        setInterval(WAIT_FOR_PAGE = async() => {
            // Do NOT run on unsafe pages
            if(UNSAFE_TWITCH_PATHNAMES.test(location.pathname))
                return false;

            let sadOverlay = $('[data-test-selector*="sad"i][data-test-selector*="overlay"i]');
            let adCountdown = $('[data-a-target*="ad-countdown"i]');

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
                    let scale = parseFloat(Settings.stream_preview_scale) || 1,
                        muted = !parseBool(Settings.stream_preview_sound),
                        quality = (scale > 1? 'auto': '720p'),
                        controls = false;

                    $.all('[data-a-target*="preview"i][data-a-target*="card"i]:not([data-test-selector])').map(a => {
                        a.addEventListener('mouseenter', ({ currentTarget }) => {
                            let { href } = currentTarget;
                            let name = (parseURL(href).pathname ?? '/').slice(1).split('/').shift();

                            if(!name?.length)
                                return;

                            let isOnline = $.defined('[class*="status"i][class*="indicator"i]', currentTarget);

                            if($.defined('#tt-stream-preview--iframe'))
                                return;

                            let iframe = furnish(`iframe#tt-stream-preview--iframe[@index=0][@name=${ name }][@live=${ isOnline }][@controls=${ controls }][@muted=${ muted }][@quality=${ quality }]`, {
                                allow: 'autoplay',
                                src: parseURL(`https://player.twitch.tv/`).addSearch(
                                    isOnline?
                                        ({
                                            channel: name,
                                            parent: 'twitch.tv',

                                            controls, muted, quality,
                                        }):
                                    href
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

            let ready = (true
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
            let [documentLanguage] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toLowerCase().split('-');

            window.LANGUAGE = LANGUAGE = Settings.user_language_preference || documentLanguage;

            // Give the storage 3s to perform any "catch-up"
            wait(3000, ready).then(async ready => {
                await Initialize(ready)
                    .then(() => {
                        // TTV Tools has the max Timer amount to initilize correctly...
                        let REINIT_JOBS =
                        when(() => {
                            let NOT_LOADED_CORRECTLY = [],
                                ALL_LOADED_CORRECTLY = (true
                                    // Lurking
                                    && parseBool(
                                            parseBool(Settings.away_mode)?
                                                (false
                                                    || $.defined('#away-mode')

                                                    || !NOT_LOADED_CORRECTLY.push('away_mode')
                                                ):
                                            true
                                        )

                                    // Auto-Claim Bonuses
                                    && parseBool(
                                            parseBool(Settings.auto_claim_bonuses)?
                                                (false
                                                    || $.defined('#tt-auto-claim-bonuses')
                                                    || $.nullish('[data-test-selector*="balance-string"i]')
                                                    || parseBool(Settings.view_mode)
                                                    || STREAMER.veto

                                                    || !NOT_LOADED_CORRECTLY.push('auto_claim_bonuses')
                                                ):
                                            true
                                        )

                                    // Up Next
                                    && parseBool(
                                            !parseBool(Settings.first_in_line_none)?
                                                (false
                                                    || $.defined('[up-next--container]')

                                                    || !NOT_LOADED_CORRECTLY.push('first_in_line')
                                                ):
                                            true
                                        )

                                    // Watch Time
                                    && parseBool(
                                            parseBool(Settings.watch_time_placement)?
                                                (false
                                                    || $.defined('#tt-watch-time')

                                                    || !NOT_LOADED_CORRECTLY.push('watch_time_placement')
                                                ):
                                            true
                                        )

                                    // Channel Points Receipt
                                    && parseBool(
                                            parseBool(Settings.points_receipt_placement)?
                                                (false
                                                    || $.defined('#tt-points-receipt')

                                                    || !NOT_LOADED_CORRECTLY.push('points_receipt_placement')
                                                ):
                                            true
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

                            for(let job of NOT_LOADED_CORRECTLY)
                                if(defined(job))
                                    RestartJob(job, 'FAILED_TO_ACTIVATE');

                            if(parseBool(Settings.recover_pages)) {
                                if(++RECOVERY_TRIALS > 10)
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
                    let { sole, name, fiat } = STREAMER;
                    let line = $('[data-test-selector="user-notice-line"i]:not([data-uuid])');

                    if(nullish(line))
                        return;

                    let [head, body] = line.children,
                        type = 'unknown';

                    if($.defined(`img[class*="channel-points"i][class*="icon"i][alt="${ fiat }"i], [class*="channel-points"i][class*="icon"i] svg`, head))
                        type = 'coin';
                    else if($.defined(`a[target="_blank"i]:is([rel~="noopener"i], [rel~="noreferrer"i])`))
                        type = 'shoutout';

                    let [user] = ($('[data-a-target$="username"i]', body) || head).textContent.split(' ');

                    let badges = $.all('img.chat-badge', body).map(badge => badge.alt.toLowerCase() + badge.src.replace(/^.*?\/(?:v(\d+))\/.*$/i, '/$1')),
                        color = Color.destruct($('[data-a-target$="username"i]', body)?.style?.color || '#9147FF').HEX,
                        mod = +STREAMER.perm.is('mod'),
                        sub = +STREAMER.paid,
                        shopID = await STREAMER.shop.find(entry => (true
                            && head.textContent.contains(entry.title)
                            && head.textContent.contains(comify(entry.cost))
                        ))?.id,
                        spotlight = $('a[target="_blank"i]', body)?.textContent;

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
                    let { mini = '' } = parseURL(location).searchParameters;

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

                            for(let [name, callback] of GetVolume.__onchange__)
                                callback(currentTarget.value, { isTrusted });
                        });

                        element.addEventListener('mouseup', ({ currentTarget, isTrusted }) => {
                            currentTarget.closest('.player-controls').dataset.isTrusted = isTrusted;

                            for(let [name, callback] of GetVolume.__onchange__)
                                callback(currentTarget.value, { isTrusted });
                        });

                        element.addEventListener('change', ({ currentTarget, isTrusted }) => {
                            currentTarget.closest('.player-controls').dataset.isTrusted = isTrusted;

                            for(let [name, callback] of GetVolume.__onchange__)
                                callback(currentTarget.value, { isTrusted });
                        });
                    });
            }

            // Set the SVGs' section IDs
            SectionLabeling: {
                let conversions = {
                    favorite: [
                        "followed",
                    ],

                    video: [
                        "related",
                        "suggested",
                    ],

                    people: [
                        "watch-channel-trailer",
                        "friends",
                    ],

                    inform: [
                        "live-reminders",
                    ],

                    checkmark: [
                        "live-reminders",
                    ],

                    rewind: [
                        "rewind-stream",
                    ],

                    crown: [
                        "prime-subscription",
                    ],

                    button_2to1_transparent: [
                        "theatre-mode-off"
                    ],

                    button_2to1_opaque: [
                        "theatre-mode-on"
                    ],
                };

                for(let container of $.all('[id*="side"i][id*="nav"i] .side-nav-section[aria-label], .about-section__actions > * > *, [data-target^="channel-header"i] button, :is([data-test-selector*="video-player"i], [data-test-selector*="video-container"i]) button')) {
                    let svg = $('svg', container);

                    if(nullish(svg))
                        continue;

                    comparing:
                    for(let glyph in Glyphs)
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

                                    let matchPercentage = 100 - misMatchPercentage;

                                    if(matchPercentage < 80 || container.getAttribute('tt-svg-label')?.length)
                                        return;

                                    let family = conversions[glyph].pop();

                                    if(!family)
                                        return;

                                    // $notice(`Labeling section "${ family[family.length - 1] }" (${ matchPercentage }% match | "${ glyph }")...`, container);

                                    container.setAttribute('tt-svg-label', family);

                                    if(family.missing('-mode-'))
                                        return;

                                    // Auto-toggle
                                    let observer = new MutationObserver(function(mutations) {
                                        for(let { target, attributeName, oldValue } of mutations) {
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
            }

            top.onlocationchange = () => {
                $warn("[Parent] Re-initializing...");

                Balloon.get('Up Next')?.remove();

                // Do NOT soft-reset ("turn off, turn on") these settings
                // They will be destroyed, including any data they are using
                let VOLATILE = window.VOLATILE = ['first_in_line*'].map(AsteriskFn);

                DestroyingJobs:
                for(let job in Jobs)
                    if(!!~VOLATILE.findIndex(name => name.test(job)))
                        continue DestroyingJobs;
                    else
                        RestartJob(job, 'job-destruction');

                Reinitialize:
                if(NORMAL_MODE) {
                    if(parseBool(Settings.keep_popout)) {
                        PAGE_CHECKER ??= setInterval(WAIT_FOR_PAGE, 500);

                        // Save states...
                        let states = {
                            mini: (MiniPlayer?.dataset?.name),
                            redo: (parseURL(window.location).searchParameters?.redo ?? ""),
                        };

                        for(let key in states)
                            if(parseBool(states[key]))
                                addToSearch({ [key]: states[key] });

                        break Reinitialize;
                    }

                    ReloadPage();
                }
            };

            // Add custom styling
            CustomCSSInitializer: {
                let [accent, contrast] = (Settings.accent_color || 'blue/12').split('/');

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
            }

            // Update the settings
            SettingsInitializer: {
                switch(Settings.onInstalledReason) {
                    // Is this the first time the extension has run?
                    // If so, then point out what's been changed
                    case INSTALL: {
                        // Detect the user's desired language
                            // Capitalizing the language code notifies the Settings page the code was not manually input
                        let [user_language_preference] = (document.documentElement?.lang ?? navigator?.userLanguage ?? navigator?.language ?? 'en').toUpperCase().split('-');

                        Settings.set({ user_language_preference });

                        // Point out the newly added buttons
                        wait(10_000).then(() => {
                            for(let element of $.all('#tt-auto-claim-bonuses, [up-next--container]'))
                                element.classList.add('tt-first-run');

                            let style = new CSSObject({ verticalAlign: 'bottom', height: '20px', width: '20px', fill: '#ff9ab4' });

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

                let R = RegExp;

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
                        let { next, obit } = request,
                            name = parseURL(next).pathname?.slice(1);

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
                            respond({ ok: false });
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
                            let imgSize = '70px';

                            unpin: if(defined(request.oldValue?.name)) {
                                let pidged = $(`.tt-pinnable [data-name="${ request.oldValue.name }"i]`);

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
                                let currentTarget = $(`.tt-pinnable [data-name="${ request.newValue.name }"i]`);

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
                                Cache.remove(['PinnedStreamer']);
                            }
                        });
                    } break;
                }
            });

            // Lag reporter
            Runtime.sendMessage({ action: `${ (Settings.auto_tab_reloads? 'BEGIN': 'WAIVE') }_REPORT` });
        }, 500);
    });

    document.body.onload = event => {
        // Move on from banned/moved channels
        AntiTimeMachine:
        when.defined(() => $('main [data-a-target*="error"i][data-a-target*="message"i] ~ * [href$="directory"i]'))
            .then(() => {
                let ErrorMessage = $('main [data-a-target*="error"i][data-a-target*="message"i]')?.textContent;

                when.defined(() => $(`[id*="side"i][id*="nav"i] .side-nav-section a:not([href$="${ PATHNAME }"i])`))
                    .then(channel => {
                        $warn(`${ location.pathname.slice(1) } is not available: ${ ErrorMessage }\nHeading to ${ channel.href }`);

                        goto(channel.href);
                    })
            });

        // Color compontents
        ColorComponents:
        if($.nullish('#tt-custom-css')) {
            let color = window
                ?.getComputedStyle?.($(`main a[href$="${ NORMALIZED_PATHNAME }"i]`) ?? $(':root'))
                ?.getPropertyValue?.('--color-accent');

            color = Color.destruct(color || '#9147FF');

            AddCustomCSSBlock('Color Components', `:root { --user-accent-color:${ color.HSL }; --user-complement-color:hsl(${ [color.H + 180, color.S, color.L].map((v, i) => v+'%deg'.slice(+!i,1+3*!i)) }) }`);
        }

        // Alerts for users
        DisplayNews:
        Cache.load('ReadNews', async({ ReadNews }) => {
            let TTVToolsNewsURL = `https://github.com/Ephellon/Twitch-Tools/wiki/News?fetched-at=${ +new Date }`,
                TTVToolsNewsArticles = ReadNews || [];

            fetchURL(TTVToolsNewsURL)
                .then(r => r.text())
                .then(html => {
                    let dom = (new DOMParser).parseFromString(html, 'text/html');

                    return $('#wiki-body', dom)?.children ?? [];
                })
                .then(([main, footer]) => {
                    if(nullish(main))
                        return;

                    let articles = main.getAllElementsByText(/(\d{4}-\d{2}-\d{2})/)
                        .filter(({ tagName }) => /^h\d$/i.test(tagName))
                        .map(header => {
                            let content = [];

                            let e = header;
                            while(defined(e = e.nextElementSibling) && !/^h\d$/i.test(e.tagName))
                                content.push(e);

                            return { header, content };
                        }).map(({ header, content }) => {
                            let articleID = UUID.from(header.textContent, true).value;

                            if(TTVToolsNewsArticles.contains(articleID))
                                return;
                            if(!content?.length)
                                return;
                            TTVToolsNewsArticles.push(articleID);

                            header.textContent = new Date(header.textContent).toLocaleDateString();

                            let article = furnish(`#tt-news-${ articleID }`).with(
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
            let [CHANNEL] = location.pathname.toLowerCase().slice(1).split('/').slice(+IS_A_FRAMED_CONTAINER),
                USERNAME = Search.cookies.login ?? `User_Not_Logged_In_${ +new Date }`;

            CHANNEL = `#${ CHANNEL }`;

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

            let START_WS = socket.onopen = event => {
                $log(`Chat Relay (main) connected to "${ CHANNEL }"`);

                // CONNECTING → 0; OPEN → 1; CLOSING → 2; CLOSED → 3
                when(() => socket.readyState === WebSocket.OPEN)
                    .then(() => {
                        socket.send(`CAP REQ :twitch.tv/commands twitch.tv/membership twitch.tv/tags`);
                        socket.send(`PASS oauth:${ Search.cookies.auth_token }`);
                        socket.send(`NICK ${ USERNAME.toLowerCase() }`);
                    });

                let restrictions = (TTV_IRC.restrictions ??= new Map);

                socket.onmessage = socket.reflect = CHAT_SELF_REFLECTOR = async event => {
                    let messages = event.data.trim().split('\r\n').map(TTV_IRC.parseMessage).filter(defined);

                    // $remark('Chat Relay received messages', messages);

                    for(let { command, parameters, source, tags } of messages) {
                        const channel = (command.channel ?? CHANNEL).toLowerCase();
                        const usable = parseBool(channel.equals(CHANNEL));

                        switch(command.command) {
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
                                    let msg = tags.msg_id,
                                        typ = msg.replace(/.*((?:mod|vip)s?).*/i, '$1').toLowerCase();

                                    if(msg.startsWith('no_'))
                                        /* Do nothing */;
                                    else if(/^(mod|vip)_/i.test(msg))
                                        Chat[typ].push(parameters.replace(/.*added\s+(\S+).*/i, '$1').toLowerCase());
                                    else if(/^un(mod|vip)_/i.test(msg))
                                        Chat[typ] = Chat[typ].filter(name => name.unlike(parameters.replace(/.*removed\s+(\S+).*/i, '$1')));
                                    else
                                        Chat[typ].push(...parameters.replace(/^[^:]*(.+?)\.?$/, ($0, $1) => $1.replace(/[:\s]+/g, '').toLowerCase()).split(','));
                                } else if('host_on host_off'.contains(tags?.msg_id)) {
                                    if(!usable) continue;

                                    when.defined(() => STREAMER)
                                        .then(() => {
                                            for(let callback of STREAMER.__eventlisteners__.onhost)
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
                                let { room_id, emote_only, followers_only, r9k, slow, subs_only } = tags;

                                restrictions.set(channel, {
                                    room_id,
                                    emote_only: parseBool(+emote_only),
                                    followers_only: (+followers_only > 0? +followers_only * 60_000: !1),
                                    r9k: parseBool(+r9k),
                                    slow: (+slow * 1000),
                                    subs_only: parseBool(+subs_only),
                                });
                            } break;

                            // Something happened (alert)
                            case 'USERNOTICE': {
                                let { id, msg_id, system_msg } = tags;

                                let message = (system_msg ?? parameters).replace(/\\s/g, ' '),
                                    mentions = message.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase()),
                                    subject = (
                                        'sub resub'.split(' ').contains(msg_id)?
                                            'dues':
                                        'giftpaidupgrade anongiftpaidupgrade'.split(' ').contains(msg_id)?
                                            'keep':
                                        'subgift rewardgift submysterygift rewardmysterygift'.split(' ').contains(msg_id)?
                                            'gift':
                                        'raid unraid'.split(' ').contains(msg_id)?
                                            'raid': // incoming raids
                                        'pointsredeemed'.split(' ').contains(msg_id)?
                                            'coin':
                                        // ritual (new_chatter, etc.); bitsbadgetier (100, 1000, 10000, etc.)
                                        'note'
                                    ),
                                    element = when.defined((message, subject) =>
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
                                                        ) I = item;
                                                    });

                                                    if(defined(I))
                                                        element.dataset.shopItemId = I.id;
                                                }

                                                element.dataset.uuid ||= UUID.from(element.getPath());
                                                element.dataset.type ||= subject;

                                                return message.mutilate().errs(element.textContent.mutilate()) < .2;
                                            })
                                        , 100, message, subject);

                                let results = {
                                    element,
                                    usable,
                                    message,
                                    subject,
                                    mentions,
                                    timestamp: new Date,

                                    // @TODO: see if there are extra `msg_id` values
                                    // msg_id,
                                };

                                Chat.__allbullets__.add(results);

                                for(let [name, callback] of Chat.__onbullet__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(let [name, callback] of Chat.__deferredEvents__.__onbullet__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 250, callback, results).then(([callback, results]) => callback(results));

                                for(let [name, callback] of Chat.__consumableEvents__.__onbullet__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onbullet__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            // The channel is hosting...
                            case 'HOSTTARGET': {
                                if(!usable) continue;

                                let [to, amount] = parameters.split(' ', 2);

                                when.defined(() => STREAMER)
                                    .then(() => {
                                        for(let callback of STREAMER.__eventlisteners__.onhost)
                                            when(() => PAGE_IS_READY, 250).then(() => callback({ hosting: to.unlike('-') }));
                                    });
                            } break;

                            // Got a message...
                            case 'PRIVMSG': {
                                // $remark('PRIVMSG:', { command, parameters, source, tags });

                                // Bot commands...
                                if(defined(command.botCommand)) {
                                    let results = { name: command.botCommand, arguments: command.botCommandParams };

                                    for(let [name, callback] of Chat.__oncommand__)
                                        when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                    for(let [name, callback] of Chat.__deferredEvents__.__oncommand__)
                                        when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                    for(let [name, callback] of Chat.__consumableEvents__.__oncommand__) {
                                        when(() => PAGE_IS_READY, 250).then(() =>
                                            callback(results).then(complete => {
                                                if(complete)
                                                    Chat.__consumableEvents__.__oncommand__.delete(name);
                                            })
                                        );
                                    }

                                    continue;
                                }

                                let author = source.nick,
                                    badges = Object.keys(tags?.badges ?? {}),
                                    message = parameters.replace(/^([\u0001-\u0007\u000e-\u001f])((?:\w+)\s*)([^]+)\1$/g, '$3').trim(),
                                    // Have to wait on the page to play catch-up...
                                    element = when.defined((message, uuid) =>
                                        $.all('[data-test-selector$="message-container"i] [data-a-target$="message"i]')
                                            .find(div =>
                                                $.all(`[data-a-user="${ author }"i]`, div)
                                                    .map(div => div.closest('[data-test-selector$="message"i], [data-a-target$="message"i]'))
                                                    .filter(defined)
                                                    .find(div => {
                                                        let text = [],
                                                            body = $('[data-test-selector$="message-body"i], [class*="message-container"i]', div);

                                                        if(nullish(body))
                                                            return;

                                                        for(let child of $.all('[class*="username"i][class*="container"i] ~ :last-child > *', body))
                                                            if(child.dataset.testSelector?.contains('emote')) {
                                                                text.push($('img', child).alt);
                                                            } else if(child.dataset.aTarget?.contains('timestamp')) {
                                                                continue;
                                                            } else if($.defined('var', child)) {
                                                                let { textContent } = child;

                                                                for(let v of $.all('var', child))
                                                                    textContent = textContent.replace(v.textContent, '');

                                                                child.textContent = textContent;
                                                            } else {
                                                                text.push(child.textContent);
                                                            }

                                                        let match = text.join('').mutilate(true).equals(message.mutilate(true));

                                                        if(match)
                                                            div.dataset.uuid = uuid;

                                                        return match
                                                    })
                                            )
                                        , 100, message, tags.id),
                                    emotes = Object.keys(tags.emotes ?? {}).map(key => {
                                        let emote = (tags.emotes[+key] || tags.emotes[key]).shift(),
                                            name = parameters.substring(+emote.startPosition, ++emote.endPosition),
                                            url = `https://static-cdn.jtvnw.net/emoticons/v2/${ key }/default/${ THEME }/1.0`;

                                        Chat.__allemotes__.set(name, url);

                                        return name;
                                    }),
                                    handle = tags.display_name,
                                    mentions = parameters.split(/(@\S+)/).filter(s => s.startsWith('@')).map(s => s.slice(1).toLowerCase()),
                                    raw = [(handle.unlike(author)? `${ handle } (${ author })`: handle), message].join(': '),
                                    reply = when.defined(e => e, 100, element).then(element => element?.querySelector('[class*="reply"i] button')),
                                    style = `color: ${ tags.color || '#9147FF' };`,
                                    uuid = tags.id,
                                    sent = (new Date).toJSON();

                                let results = {
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

                                for(let [name, callback] of Chat.__onmessage__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(let [name, callback] of Chat.__deferredEvents__.__onmessage__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(let [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onmessage__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            // Got a whisper
                            case 'WHISPER': {
                                let results = { unread: 1, from: channel, message: parameters, timestamp: new Date };

                                for(let [name, callback] of Chat.__onwhisper__)
                                    when(() => PAGE_IS_READY, 250).then(() => callback(results));

                                for(let [name, callback] of Chat.__deferredEvents__.__onwhisper__)
                                    when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                                for(let [name, callback] of Chat.__consumableEvents__.__onwhisper__) {
                                    when(() => PAGE_IS_READY, 250).then(() =>
                                        callback(results).then(complete => {
                                            if(complete)
                                                Chat.__consumableEvents__.__onwhisper__.delete(name);
                                        })
                                    );
                                }
                            } break;

                            default: continue;
                        };
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
                    let unhandled = $.all('[data-a-target="chat-line-message"i]:not([data-uuid])', chat);

                    for(let element of unhandled) {
                        let raw = $('[class*="message"i][class*="container"i]', element).textContent.trim().replace($('[data-a-target="chat-timestamp"]', element)?.textContent || '', ''),
                            uuid = UUID.from(raw).toString(),
                            reply = $('[class*="reply"i] button', element),
                            style = $('[data-a-user]', element)?.getAttribute('style')?.trim(),
                            author = $('[data-a-user]', element).dataset.aUser,
                            emotes = new Set,
                            badges = new Set,
                            __bs__ = $.all('[class*="username"i][class*="container"i] [data-a-target*="badge"i] img', element).map(e => badges.add(e.alt.toLowerCase())),
                            handle = $('[data-a-user]', element).textContent,
                            usable = false,
                            message = raw.replace(/^[^:]+?:/, '').trim(),
                            mentions = $.all('[data-a-target*="mention"i]', element).map(e => e.textContent),
                            highlighted = parseBool(element.dataset.testSelector?.contains('notice'));

                        element.dataset.uuid = uuid;

                        emotes = [...emotes];
                        badges = [...badges];

                        let results = {
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

                        for(let [name, callback] of Chat.__onmessage__)
                            when(() => PAGE_IS_READY, 250).then(() => callback(results));

                        for(let [name, callback] of Chat.__deferredEvents__.__onmessage__)
                            when.defined.pipe(async(callback, results) => await results?.element, 1000, callback, results).then(([callback, results]) => callback(results));

                        for(let [name, callback] of Chat.__consumableEvents__.__onmessage__) {
                            when(() => PAGE_IS_READY, 250).then(() =>
                                callback(results).then(complete => {
                                    if(complete)
                                        Chat.__consumableEvents__.__onmessage__.delete(name);
                                })
                            );
                        }
                    }
                });
        }
    };
}
