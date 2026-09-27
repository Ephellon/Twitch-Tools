/*** /plugins/automation/lurking.js
 * Lurking.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let AwayModeButton, AwayModeEnabled, InitialQuality, InitialViewMode, NUMBER_OF_FAILED_QUALITY_FETCHES;

plugin({
    id: 'away_mode',
    timer: 1000,

    init() {
        AwayModeButton = void null;
        AwayModeStatus = false;
        AwayModeEnabled = false;
        InitialQuality = void null;
        InitialVolume = void null;
        InitialViewMode = void null;
        MAINTAIN_VOLUME_CONTROL = true;
        NUMBER_OF_FAILED_QUALITY_FETCHES = 0;
    },

    handler: async({ StopWatch }) => {
        new StopWatch('away_mode');

        let button = $('#away-mode')
            , currentQuality = (Handlers.away_mode.quality ??= await GetQuality());

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
                const scapeGoat = await GetNextStreamer();

                $warn(`The following page failed to load correctly (no quality controls present): ${ STREAMER.name } @ ${ (new Date) }`);
                    // .toNativeStack();

                goto(parseURL(scapeGoat.href).addSearch({ tool: 'away-mode--scape-goat' }).href);
            }

            // Twitch can reset the volume (player reload, ad break) without the viewer touching it (#26);
            // while Lurking still owns the volume, put it back
            if(defined(button) && AwayModeStatus && MAINTAIN_VOLUME_CONTROL && parseBool(Settings.away_mode__volume_control)) {
                const target = parseFloat(Settings.away_mode__volume);

                if(!Number.isNaN(target) && Math.abs(GetVolume() - target) > 0.01)
                    SetVolume(target);
            }

            return StopWatch.stop('away_mode');
        }

        await Cache.load({ AwayModeEnabled }, cache => AwayModeEnabled = cache.AwayModeEnabled ?? false);

        const enabled = AwayModeStatus = AwayModeEnabled || (currentQuality.low && !(currentQuality.auto || currentQuality.high || currentQuality.source));

        if(nullish(button)) {
            let sibling, parent, before
                , extra = () => {}
                , placement = (Settings.away_mode_placement ??= 'null');

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
                        const classes = $('button', container)?.closest('div')?.classList ?? [];

                        [...classes].map(value => {
                            if(/[-_]/.test(value))
                                return StopWatch.stop('away_mode');

                            classes.remove(value);
                        });
                    };
                } break;

                default: { return StopWatch.stop('away_mode') }
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
                container.firstElementChild.classList.remove('tt-mg-l-1')
            } else if(['under'].contains(placement)) {
                $('span', container)?.remove();
                $('[style]', container)?.modStyle('opacity: 1; transform: translateX(15%) translateZ(0px);');
            }

            extra({ container, sibling, parent, before, placement });

            button = {
                enabled,
                container,
                icon: $('svg', container),
                background: $('button', container),
                get offset() { return getOffset(container) },
                tooltip: new Tooltip(container, `${ ['Start', 'Stop'][+enabled] } Lurking (${ GetMacro('alt+a') })`, { from: 'top', left: +5 }),
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
            const container = $('#away-mode');

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

            await SetQuality(['auto', 'low'][+enabled])
                .then(() => {
                    if(parseBool(Settings.away_mode__volume_control))
                        SetVolume([InitialVolume, Settings.away_mode__volume][+enabled]);

                    const controls = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls');

                    if(defined(controls))
                        controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && enabled && parseBool(Settings.away_mode__volume_control);

                    if(parseBool(Settings.away_mode__hide_chat))
                        ([
                            () => SetViewMode(InitialViewMode),
                            () => SetViewMode('fullwidth'),
                        ][+enabled])();
                });
        }

        const [accent, contrast] = (Settings.accent_color ?? 'blue/12').split('/');

        // if(init === true) →
        // Don't use above, event listeners won't work
        button.background?.modStyle(`background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+(button.container.getAttribute('tt-away-mode-enabled').equals('true'))] } !important;`);
        // button.icon.setAttribute('height', '20px');
        // button.icon.setAttribute('width', '20px');

        button.container.onclick ??= async event => {
            const enabled = !parseBool(AwayModeButton.container.getAttribute('tt-away-mode-enabled'))
                , { container, background, tooltip } = AwayModeButton;

            container.setAttribute('tt-away-mode-enabled', enabled);
            tooltip.innerHTML = `${ ['Start', 'Stop'][+enabled] } Lurking (${ GetMacro('alt+a') })`;
            background?.modStyle(`background:${ [`var(--user-accent-color)`, 'var(--color-background-button-secondary-default)'][+enabled] } !important;`);

            // Return control when Lurking is engaged
            MAINTAIN_VOLUME_CONTROL = true;

            const controls = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls');

            if(defined(controls))
                controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && enabled && parseBool(Settings.away_mode__volume_control);

            // Sets the size according to the video's physical size
            let size = (parseBool(Settings.low_data_mode) ? getOffset($('video')).height.floorToNearest(100) : -1);

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
            } // switch size

            await SetQuality([size, 'low'][+enabled])
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
            let { currentTarget } = event
                , svgContainer = $('figure', currentTarget)
                , svgShow = $('svg#tt-away-mode--show', svgContainer)
                , svgHide = $('svg#tt-away-mode--hide', svgContainer);
            const enabled = parseBool(currentTarget.closest('#away-mode').getAttribute('tt-away-mode-enabled'));

            svgShow?.setAttribute('preview', !enabled);
            svgHide?.setAttribute('preview', !!enabled);
        };

        button.container.onmouseleave ??= event => {
            let { currentTarget } = event
                , svgContainer = $('figure', currentTarget)
                , svgShow = $('svg#tt-away-mode--show', svgContainer)
                , svgHide = $('svg#tt-away-mode--hide', svgContainer);

            svgShow?.removeAttribute('preview');
            svgHide?.removeAttribute('preview');
        };

        AwayModeButton = button;

        StopWatch.stop('away_mode');
    },

    unhandler: () => {
        $('#away-mode')?.remove();
    },

    setup() {
        $remark("Adding & Scheduling the Lurking button...");

        RegisterJob('away_mode');

        // Maintain the volume until the user changes it
        GetVolume.onchange = (volume, { isTrusted = false }) => {
            if(!MAINTAIN_VOLUME_CONTROL || !isTrusted)
                return;

            $warn("[Lurking] is releasing volume control due to user interaction...");

            MAINTAIN_VOLUME_CONTROL = !isTrusted;

            $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls').dataset.automatic = MAINTAIN_VOLUME_CONTROL;

            SetVolume(volume);
        };

        // Set the color and control scheme
        when.defined(() => $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls'))
            .then(controls => controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && AwayModeStatus && parseBool(Settings.away_mode__volume_control));

        // Scheduling logic...
        when.defined(() => $('#away-mode'), 3000).then(awayMode => {
            const schedules = JSON.parse(Settings?.away_mode_schedule || '[]');
            const today = new Date()
                , YEAR = today.getFullYear()
                , MONTH = today.getMonth()
                , DATE = today.getDate()
                , TODAY = today.getDay()
                , H = today.getHours()
                , M = today.getMinutes()
                , S = today.getSeconds();

            const weekdays = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ')
                , months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

            let desiredStatus
                , currentStatus = parseBool(awayMode.getAttribute('tt-away-mode-enabled'));

            for(const schedule of schedules) {
                let { day, time, duration, status } = schedule;

                if(TODAY != day)
                    continue;

                if((H < time) || (H > (time + duration) % 24))
                    continue;

                duration *= 3_600_000;

                $warn(`Lurking is scheduled to be "${ ['off', 'on'][+status] }" for ${ weekdays[day] } @ ${ time }:00 for ${ toTimeString(duration, '?hours_h') }`);

                // Found at least one schedule...
                if(defined(desiredStatus = status))
                    break;
            }

            // Scheduled state...
            // $log('Lurking needs to be:', desiredStatus, 'Currently:', currentStatus);
            if(defined(desiredStatus) && desiredStatus != currentStatus)
                awayMode.click();
        });
    },
});
