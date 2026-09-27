/*** /lib/search.js
 * Twitch GQL search for channels and categories.
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

// Search Twitch for channels/categories
    // new Search(ID:string|number?, type:string?, as:string?) → Promise<object>
/** Returns a promised Object →
 * { data:object, extensions:object }
 */
class Search {
    static cookies = {
        ...((cookies = []) => {
            const object = ({});

            for(const cookie of cookies) {
                let [name, value] = cookie.split('=', 2);

                if(/^[\{\[]/.test(value))
                    value = JSON.parse(decodeURIComponent(value));

                object[name.replace(/\W+/g, '_')] = value;
            }

            return object;
        })(document?.cookie?.split(/;\s*/))
    };

    static anonID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

    static #cache = new Map;
    static cacheLeaseTime = 300_000 * (parseInt(Settings.low_data_mode) || 1);

    constructor(ID = null, type = 'channel', as = null) {
        const spadeEndpoint = `https://spade.twitch.tv/track`
            , twilightBuildID = '5fc26188-666b-4bf4-bdeb-19bd4a9e13a4';

        const pathname = location.pathname.slice(1)
            , options = ({
                method: 'POST',
                headers: {
                    "Accept-Language":  'en-US',
                    "Accept":           '*/*',
                    "Authorization":    Search.authorization,
                    "Client-ID":        Search.clientID,
                    "Content-Type":     `text/plain; charset=UTF-8`,
                }
            })
            , player = ({
                type: 'site',
                routes: {
                    exact: ['activate', 'bits', 'bits-checkout', 'directory', 'following', 'luna', 'popout', 'prime', 'store', 'subs'],
                    start: ['bits-checkout/', 'checkout/', 'collections/', 'communities/', 'dashboard/', 'directory/', 'event/', 'luna/', 'prime/', 'products/', 'settings/', 'store/', 'subs/'],
                },
            });

        let vodID = null, channelName = null;

        if(nullish(ID) && /^auto(?:matic)?$/i.test(type)) {
            if(true
                && player.routes.exact.missing(pathname)
                && !player.routes.start.filter(route => pathname.startsWith(route)).length
                && (
                    // Is a VOD
                    pathname.startsWith('videos/')
                        ? (
                            vodID = pathname
                                .replace('videos/', '')
                                .replace(/\//g, '')
                                .replace(/^v/, '')
                        )
                    // Is a channel
                    : (
                        channelName = pathname.replace(/\//g, '')
                    )
                )
            )
                /* All good */;
            else
                throw `Unable to parse Search data`;

            if(vodID?.length) {
                ID = vodID;
                type = 'vod';
            } else if(channelName?.length) {
                ID = channelName;
                type = 'channel';
            }
        }

        if(type.equals('vod'))
            vodID = ID;

        if(type.equals('channel'))
            channelName = ID;

        let searchID = UUID.from([ID, type, as, new Date((+new Date).floorToNearest(Search.cacheLeaseTime)).toJSON()].join('~')).value
            , searchResults;

        if(Search.#cache.has(searchID))
            return Search.#cache.get(searchID);

        let template;
        switch(Search.parseType = as) {
            case 'query': {
                const query = ('query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) { streamPlaybackAccessToken(channelName: $login, params: { platform: "web", playerBackend: "mediaplayer", playerType: $playerType }) @include(if: $isLive) { value signature __typename } videoPlaybackAccessToken(id: $vodID, params: { platform: "web", playerBackend: "mediaplayer", playerType: $playerType }) @include(if: $isVod) { value signature __typename }}');

                template = ({ operationName: 'PlaybackAccessToken_Template', query });
            } break;

            case 'chat.info': {
                const variables = { login: channelName }
                    , extensions = { persistedQuery: 'SHA-256', version: 1 };

                template = ({ operationName: 'StreamChat', variables, extensions });
            } break;

            case 'chat.user': {
                const variables = {}
                    , extensions = { persistedQuery: 'SHA-256', version: 1 };

                template = ({ operationName: 'Chat_UserData', variables, extensions });
            } break;

            case 'video.ad': {
                const variables = { login: channelName, ownsCollectionID: null, ownsVideoID: vodID }
                    , extensions = { persistedQuery: 'SHA-256', version: 1 };

                template = ({ operationName: 'VideoAdBanner', variables, extensions });
            } break;

            case 'video.info': {
                const variables = { id: STREAMER.sole }
                    , extensions = { persistedQuery: 'SHA-256', version: 1 };

                template = ({ operationName: 'WithIsStreamLiveQuery', variables, extensions });
            } break;

            case '.legacy': {
                // https://api.twitch.tv/helix/channels?broadcaster_id=39367256
                // {
                //     "broadcaster_id": "39367256",
                //     "broadcaster_login": "aimzatchu",
                //     "broadcaster_name": "AimzAtchu",
                //     "broadcaster_language": "en",
                //     "game_id": "491487",
                //     "game_name": "Dead by Daylight",
                //     "title": "FriYAYY ❤️",
                //     "delay": 0,
                //     "tags": [
                //         "ClosedCaptions",
                //         "Ally",
                //         "English",
                //         "Interactive",
                //         "fogwhisperer",
                //         "PlayingwithViewers",
                //         "MentalHealth",
                //         "ChronicIllness"
                //     ]
                // }
                return fetchURL.fromDisk(`https://api.twitch.tv/helix/channels?broadcaster_id=${ ID }`, { headers: { "Authorization": Search.authorization, "Client-ID": Search.clientID }, hoursUntilEntryExpires: 168 })
                    .then(response => response.json())
                    .then(json => {
                        const id = parseInt(json?.data?.shift?.()?.broadcaster_id);

                        if(nullish(id))
                            throw `${ json.error }: ${ json.message }`;

                        return id;
                    });
            } break;

            /** Twitch Insights JSON
             * id: string<number~int>
             * displayName: string
             * createdAt: string<Date~ISO>
             * updatedAt: string<#empty|Date~ISO>
             * deletedAt: string<#empty|Date~ISO>
             * userType: string
             * broadcasterType: string
             * unavailableReason: string
             */
            case 'getID': {
                return Search.findUserID(ID);
            } break;

            case 'getName': {
                return Search.findUsername(ID);
            } break;

            case 'status.live': {
                return Search.getUserStatus(ID);
            } break;

            default: {
                const languages = `bg cs da de el en es es-mx fi fr hu it ja ko nl no pl ro ru sk sv th tr vi zh-cn zh-tw x-default`.split(' ');
                const name = channelName?.toLowerCase();

                if(nullish(name) || type.unlike('channel'))
                    break;

                if(SEARCH_CACHE.has(name))
                    return Promise.resolve(SEARCH_CACHE.get(name));

                searchResults = fetchURL.idempotent(`./${ name }`)
                    .then(response => response.text())
                    .then(html => (new DOMParser).parseFromString(html, 'text/html'))
                    .then(async doc => {
                        let alt_languages = $.all('link[rel^="alt"i][hreflang]', doc).map(link => link.hreflang)
                            , data = $('head>script[type^="application"i][type$="json"i]', doc)?.textContent;

                        try {
                            [data] = JSON.parse(data || `{"@graph":[]}`)['@graph'];
                        } catch(error) {
                            // Not an object...
                            try {
                                [data] = JSON.parse(data || `[{}]`);
                            } catch(error) {
                                // Not an array...
                                throw new Error(`Unable to perform a search for "${ name }": ${ JSON.stringify(data) }`);
                            }
                        }

                        let display_name = (data?.name ?? `${ channelName } - Twitch`).split('-').slice(0, -1).join('-').trim()
                            , [language] = languages.filter(lang => alt_languages.missing(lang))
                            , name = display_name?.trim()?.toLowerCase()
                            , profile_image = ($('meta[property$="image"i]', doc)?.content || Runtime.getURL('profile.png'))
                            , live = parseBool(data?.publication?.isLiveBroadcast)
                            , started_at = new Date(data?.publication?.startDate).toJSON()
                            , status = (data?.description ?? $('meta[name$="description"i]', doc)?.content)
                            , updated_at = new Date(data?.publication?.endDate).toJSON()
                            , broadcaster_id;

                        try {
                            broadcaster_id = parseInt(await fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${ name }`, { hoursUntilEntryExpires: 744 }).then(r => r.json()).then(j => j.id)) | 0;
                        } catch(error) {
                            // Do nothing...
                        }

                        const json = { display_name, broadcaster_id, language, live, name, profile_image, started_at, status, updated_at, href: `https://www.twitch.tv/${ display_name }` };

                        Search.parseType = 'pure';

                        const channelData = await Search.convertResults({ async json() { return json } });

                        SEARCH_CACHE.set(display_name.toLowerCase(), channelData);
                        ALL_CHANNELS = [...ALL_CHANNELS, channelData].filter(defined).filter(uniqueChannels);

                        // Pre-reads the stream if converted into a proper `Response`
                        return ({
                            async arrayBuffer() {
                                return new Blob([JSON.stringify(json, null, 0)], { type: 'application/json' }).arrayBuffer();
                            },

                            async blob() {
                                return new Blob([JSON.stringify(json, null, 4)], { type: 'application/json' });
                            },

                            async json() {
                                return json;
                            },

                            async text() {
                                return JSON.stringify(json);
                            },

                            async formData() {
                                const form = new FormData;

                                for(const key of Object.keys(json))
                                    form.set(key, json[key]);
                                return form;
                            },
                        });
                    })
                    .catch(error => {
                        $warn(error);

                        return STREAMER?.jump?.[name];
                    });

                Search.#cache.set(searchID, searchResults);

                return searchResults;
            } break; // switch Search.parseType = as | default
        } // switch Search.parseType = as

        let body, results;
        switch(type) {
            case 'vod': {
                body = JSON.stringify({
                    ...template,
                    variables: {
                        isLive: !1,
                        login: '',
                        isVod: !0,
                        vodID: ID,
                        playerType: player.type,
                    }
                });

                results = {
                    contentType: 'vod',
                    id: ID,
                    playerType: player.type,
                    request: Search.retrieve({ ...options, body }),
                };
            } break;

            case 'channel': {
                body = JSON.stringify({
                    ...template,
                    variables: {
                        isLive: !0,
                        login: ID,
                        isVod: !1,
                        vodID: '',
                        playerType: player.type,
                    }
                });

                results = {
                    contentType: 'live',
                    id: ID,
                    playerType: player.type,
                    request: Search.retrieve({ ...options, body }),
                };
            } break;

            default: { throw `Unable to search for item of type "${ type }"` }
        }

        const blob = new Blob([
            `data=${
                encodeURIComponent(
                    btoa(
                        JSON.stringify({
                            event: 'benchmark_template_loaded',
                            properties: {
                                app_version: twilightBuildID,
                                benchmark_server_id: Search.cookies.server_session_id,
                                client_time: (Date.now() / 1e3),
                                device_id: Search.cookies.unique_id,
                                duration: Math.round(performance.now()),
                                url: `${ location.protocol }//${ [location.hostname, location.pathname, location.search].join('') }`,
                            }
                        })
                    )
                )
            }`
        ], {
            type: `application/x-www-form-urlencoded; charset=UTF-8`
        });

        const request = new XMLHttpRequest;

        request.open('POST', spadeEndpoint);
        request.send(blob);

        Search.#cache.set(searchID, searchResults = results.request);

        return searchResults;
    }

    static void(ID = null, type = 'channel', as = null) {
        const pathname = location.pathname.slice(1)
            , player = ({
                type: 'site',
                routes: {
                    exact: ['activate', 'bits', 'bits-checkout', 'directory', 'following', 'luna', 'popout', 'prime', 'store', 'subs'],
                    start: ['bits-checkout/', 'checkout/', 'collections/', 'communities/', 'dashboard/', 'directory/', 'event/', 'luna/', 'prime/', 'products/', 'settings/', 'store/', 'subs/'],
                },
            });

        let vodID = null, channelName = null;

        if(nullish(ID) && /^auto(?:matic)?$/i.test(type)) {
            if(true
                && player.routes.exact.missing(pathname)
                && !player.routes.start.filter(route => pathname.startsWith(route)).length
                && (
                    // Is a VOD
                    pathname.startsWith('videos/')
                        ? (
                            vodID = pathname
                                .replace('videos/', '')
                                .replace(/\//g, '')
                                .replace(/^v/, '')
                        )
                    // Is a channel
                    : (
                        channelName = pathname.replace(/\//g, '')
                    )
                )
            )
                /* All good */;
            else
                throw `Unable to parse Search data`;

            if(vodID?.length) {
                ID = vodID;
                type = 'vod';
            } else if(channelName?.length) {
                ID = channelName;
                type = 'channel';
            }
        }

        if(type.equals('vod'))
            vodID = ID;

        if(type.equals('channel'))
            channelName = ID;

        const searchID = UUID.from([ID, type, as, new Date((+new Date).floorToNearest(Search.cacheLeaseTime)).toJSON()].join('~')).value;

        SEARCH_CACHE.delete(ID?.toLowerCase());

        return Search.#cache.delete(searchID);
    }

    static retrieve(query) {
        if(typeof fetch == 'function')
            return fetchURL('https://gql.twitch.tv/gql', query);

        return new Promise((onSuccess, onError) => {
            const request = new XMLHttpRequest;

            request.open('POST', `https://gql.twitch.tv/gql`);

            Object.keys(query.headers).map(key => {
                try {
                    request.setRequestHeader(key, query.headers[key]);
                } catch(error) {
                    $warn(error);
                }
            });

            request.withCredentials = parseBool(query.credentials?.equals('include'));
            request.onerror = onError;
            request.onload = () => onSuccess({
                status: request.status,
                statusText: request.statusText,
                body: request.response || request.responseText,
                ok: request.status >= 200 && request.status < 300,
                json: () => new Promise((onsuccess, onerror) => {
                    try {
                        onsuccess(JSON.parse(request.response || request.responseText));
                    } catch(query) {
                        onerror(query);
                    }
                })
            });

            request.send(query.body);
        });
    }

    static async convertResults(response) {
        let json = (null
                ?? (await response?.json?.())
                ?? ({})
            )
            , data = {};

        let ConversionKey = {
            banStatus:          'veto',
            broadcaster_id:     'sole',
            channel:            'name',
            channel_id:         'sole',
            createdAt:          'date',
            displayName:        'name',
            hosting:            'host',
            id:                 'sole',
            isMature:           'nsfw',
            login:              'name',
            mature:             'nsfw',
            partner:            'ally',
            primaryColorHex:    'tint',
            profileImageURL:    'icon',
            role:               'role',
            subscriber:         'paid',
            turbo:              'fast',
            viewersCount:       'poll',

            display_name:       'name',
            status:             'desc',
            title:              "desc",
            live:               'live',
            href:               'href',
            profile_image:      'icon',
        }
        , DataConversionKey = {
            started_at:         'actualStartTime',
            updated_at:         'lastSeen',
            stream:             'broadcast',
        }
            , deeper = [];

        switch(Search.parseType) {
            case 'advanced': {
                // @TODO: Parse advanced Search results...
            } break;

            case 'pure': {
                /* Do nothing... */
            } break;

            case 'chat.info': {
                try {
                    json = JSON.parse(json?.data?.channel ?? 'null');
                    deeper = ['self'];
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;

            case 'chat.user': {
                try {
                    json = JSON.parse(json?.data?.user ?? 'null');
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;

            case 'video.ad': {
                try {
                    json = JSON.parse(json?.data?.userByAttribute ?? 'null');
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;

            case 'video.info': {
                try {
                    json = JSON.parse(json?.data?.user?.stream ?? 'null');
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;

            default: {
                try {
                    json = JSON.parse(json?.data?.streamPlaybackAccessToken?.value ?? 'null');
                } catch(error) {
                    throw `Unable to parse results: ${ error }`;
                }
            } break;
        } // switch Search.parseType

        // Deeper levels
        const deeperLevels = {};

        for(const key in json) {
            const to = ConversionKey[key];

            if(to?.length)
                data[to] = json[key];
            if(deeper.contains(to))
                deeperLevels[to] = json[key];
        }

        for(const key in deeperLevels) {
            const to = ConversionKey[key];

            if(to?.length)
                data[to] = deeperLevels[key];
        }

        // Deeper data levels
        data.data ??= {};

        const deeperDataLevels = {};

        for(const key in json) {
            const to = DataConversionKey[key];

            if(to?.length)
                data.data[to] ??= json[key];
            if(deeper.contains(to))
                deeperDataLevels[to] = json[key];
        }

        for(const key in deeperDataLevels) {
            const to = DataConversionKey[key];

            if(to?.length)
                data.data[to] ??= deeperDataLevels[key];
        }

        return new Promise(resolve => resolve({ ok: parseBool(parseURL(data.icon).pathname?.startsWith('/jtv_user')), ...data }));
    }

    static async findUserID(username = null) {
        return fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${ username }`)
            .then(response => response.json())
            .then(json => {
                const id = parseInt(json?.id);

                if(nullish(id))
                    throw `[${ json.status }] An error occurred: ${ json.error }`;

                return id;
            })
            .catch($warn);
    }

    static async findUsername(userID = null) {
        return fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${ userID }`)
            .then(response => response.json())
            .then(json => {
                const name = json?.displayName;

                if(nullish(name))
                    throw `[${ json.status }] An error occurred: ${ json.error }`;

                return name;
            })
            .catch($warn);
    }

    static async getUserStatus(username = null) {
        return fetchURL.idempotent(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${ username.toLowerCase() }-80x45.jpg`, { as: 'native', hoursUntilEntryExpires: 1 / 12, keepDefectiveEntry: true })
            .then(response => {
                const { pathname, filename } = parseURL(response.url);

                return !(/\/404_/.test(pathname) || !/\/previews-ttv\//i.test(pathname));
            });
    }
}

export { Search };
