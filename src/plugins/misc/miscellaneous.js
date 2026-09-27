/*** /plugins/misc/miscellaneous.js
 * Miscellaneous.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'miscellaneous',

    async install() {
        Miscellaneous: {
            // The theme
            THEME = [...$('html').classList].find(c => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, '$1').toLowerCase();
            ANTITHEME = window.ANTITHEME = ['light', 'dark'].filter(theme => theme.unlike(THEME)).pop();

            let [PRIMARY, SECONDARY] = [STREAMER.tint, STREAMER.tone]
                .map(Color.HEXtoColor)
                // Primary → Closest to theme; Secondary → Furthest from theme
                .sort((C1, C2) => {
                    let background = (THEME.equals('dark')? Color.black: Color.white);

                    return Color.contrast(background, [C1.R, C1.G, C1.B]) - Color.contrast(background, [C2.R, C2.G, C2.B]);
                })
                .map(color => color.HEX);

            THEME__CHANNEL_DARK = (THEME.equals('dark')? PRIMARY: SECONDARY);
            THEME__CHANNEL_LIGHT = (THEME.unlike('dark')? PRIMARY: SECONDARY);

            PRIMARY = Color.HEXtoColor(PRIMARY);
            SECONDARY = Color.HEXtoColor(SECONDARY);

            let contrastOf = (C1, C2) => Color.contrast(...[C1, C2].map(({ R, G, B }) => [R, G, B])),

                black = { R: 0, G: 0, B: 0 },
                white = { R: 255, G: 255, B: 255 },

                theme = (THEME.equals('dark')? black: white),
                antitheme = (THEME.unlike('dark')? black: white);

            THEME__BASE_CONTRAST = contrastOf(PRIMARY, SECONDARY);
            THEME__PREFERRED_CONTRAST = `${ THEME__BASE_CONTRAST.toString() } prefer ${ (contrastOf(PRIMARY, theme) > contrastOf(SECONDARY, theme)? THEME: ANTITHEME) }`;

            // Better styling. Will match the user's theme choice as best as possible
            AddCustomCSSBlock('Better-Themed Styling', `
                /* The user is using the light theme (like a crazy person) */
                :root {
                    --channel-color: ${ STREAMER.tint };
                    --channel-color-contrast: ${ STREAMER.tone };
                    --channel-color-complement: ${ STREAMER.aego };
                    --channel-color-dark: ${ THEME__CHANNEL_DARK };
                    --channel-color-light: ${ THEME__CHANNEL_LIGHT };
                }

                /* The user likes hurting their eyes */
                :root[class*="light"i] {
                    --color-colored: var(--channel-color-light);
                    --color-colored-contrast: var(--channel-color-dark);
                    --channel-color-opposite: var(--channel-color-complement);
                }

                /* The user is using the correct theme */
                :root[class*="dark"i] {
                    --color-colored: var(--channel-color-dark);
                    --color-colored-contrast: var(--channel-color-light);
                    --channel-color-opposite: var(--channel-color-complement);
                }

                [up-next--body] *:is(button, h5) {
                    --color: var(--user-contrast-color) !important;
                    --fill: var(--user-contrast-color) !important;
                }

                /* Apply contrast correction... div[contrast="low prefer dark"] */
                :root[class*="light"i] [contrast~="low"i][contrast~="light"i],
                [contrast~="low"i][contrast~="dark"i] {
                    color: #000 !important;
                    fill: #000 !important;

                    /** Over complicated method
                     * background-color: #0000;
                     * mix-blend-mode: lighten;
                     * text-shadow: 0 0 5px #000;
                     */
                }

                :root[class*="dark"i] [contrast~="low"i][contrast~="dark"i],
                [contrast~="low"i][contrast~="light"i] {
                    color: #fff !important;
                    fill: #fff !important;

                    /** Over complicated method
                     * background-color: #fff0;
                     * mix-blend-mode: darken;
                     * text-shadow: 0 0 5px #fff;
                     */
                }
            `);
        }

        __GET_UPDATE_INFO__: {
            // Getting the version information
            let installedFromWebstore = parseURL(Runtime.getURL('profile.png')).host.equals("fcfodihfdbiiogppbnhabkigcdhkhdjd");

            wait(3_600_000, installedFromWebstore).then(async installedFromWebstore => {
                let FETCHED_DATA = { wasFetched: false };
                let properties = {
                    origin: {
                        github: !installedFromWebstore,
                        chrome: installedFromWebstore,
                    },
                    version: {
                        installed: Manifest.version,
                        github: '5.6',
                        chrome: '5.6',
                    },
                    Glyphs,
                };

                await Settings.get(['buildVersion', 'chromeVersion', 'githubVersion', 'versionRetrivalDate'], async({ buildVersion, chromeVersion, githubVersion, versionRetrivalDate }) => {
                    buildVersion ??= properties.version.installed;
                    versionRetrivalDate ||= 0;

                    // Only refresh if the data is older than 1h
                    // The data has expired →
                    __FetchingUpdates__:
                    if((FETCHED_DATA.wasFetched === false) && (versionRetrivalDate + 3_600_000) < +new Date) {
                        let githubURL = 'https://api.github.com/repos/ephellon/twitch-tools/releases/latest';

                        fetchURL(githubURL)
                            .then(response => {
                                if(FETCHED_DATA.wasFetched)
                                    throw 'Data was already fetched';

                                return response.json();
                            })
                            .then(metadata => {
                                $log({ ['GitHub']: metadata });

                                return properties.version.github = metadata.tag_name;
                            })
                            .then(version => Settings.set({ githubVersion: version }))
                            .catch(async error => {
                                await Settings.get(['githubVersion'], ({ githubVersion }) => {
                                    if(defined(githubVersion))
                                        properties.version.github = githubVersion;
                                });
                            })
                            .finally(() => {
                                let githubUpdateAvailable = compareVersions(`${ properties.version.installed } < ${ properties.version.github }`),
                                    chromeUpdateAvailable = false;

                                FETCHED_DATA = { ...FETCHED_DATA, ...properties };
                                Settings.set({ githubUpdateAvailable });

                                // Only applies to versions installed from the Chrome Web Store
                                __ChromeOnly__:
                                if(installedFromWebstore)
                                    Settings.set({ chromeUpdateAvailable: githubUpdateAvailable });

                                if((!installedFromWebstore && githubUpdateAvailable) || (installedFromWebstore && chromeUpdateAvailable))
                                    confirm
                                        .timed(`There is an update available for ${ Manifest.name } (${ properties.version.installed } &rarr; ${ properties.version.github })`)
                                        .then(ok => {
                                            if(nullish(ok))
                                                return;

                                            open([
                                                'https://github.com/Ephellon/Twitch-Tools/releases',
                                                'https://chrome.google.com/webstore/detail/ttv-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd',
                                            ][+installedFromWebstore], '_blank');
                                        });
                            });

                        // GitHub-only logic - get Chrome version information

                        if(FETCHED_DATA.wasFetched === false) {
                            FETCHED_DATA.wasFetched = true;
                            versionRetrivalDate = +new Date;

                            Settings.set({ versionRetrivalDate });
                        }
                    }
                    // The data hasn't expired yet
                    else {
                        properties.version.github = githubVersion ?? properties.version.github;
                        properties.version.chrome = chromeVersion ?? properties.version.chrome;
                    }
                });
            });
        }

        // End of Initialize
    },
});
