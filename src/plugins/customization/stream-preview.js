/*** /plugins/customization/stream-preview.js
 * Stream Preview.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let STREAM_PREVIEW;

plugin({
    id: 'stream_preview',
    timer: 500,

    /**
     * Resets the stream preview state.
     */
    init() {
        STREAM_PREVIEW = void null;
    },

    /**
     * Runs every tick: Creates and positions a stream preview player when hovering over a channel or guest tooltip.
     * @param {Object} params - The handler parameters
     * @param {Object} params.StopWatch - Utility for measuring execution time
     */
    handler: async({ StopWatch }) => {
        new StopWatch('stream_preview');

        const richTooltips = $.all(`:is([class*="channel"i], [class*="guest-star"i])[class*="tooltip"i][class*="body"i]`)
            , [richTooltip] = richTooltips;

        if(nullish(richTooltip)) {
            if(parseBool(Settings.stream_preview_sound) && MAINTAIN_VOLUME_CONTROL)
                SetVolume(parseBool(Settings.away_mode__volume_control) && AwayModeStatus ? Settings.away_mode__volume : InitialVolume ?? 1);
            else if(parseBool(Settings.stream_preview_sound) && defined(STREAM_PREVIEW?.element))
                SetVolume(InitialVolume);

            return StopWatch.stop('stream_preview'), STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
        }

        let [title, subtitle] = $.all('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]) > *', richTooltip)
            , isOnline = parseBool(richTooltip.classList?.value?.missing('offline'));

        if(nullish(subtitle)) {
            const [rTitle, rSubtitle] = $.all('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *');

            title = rTitle;
            subtitle = rSubtitle;
        }

        if(nullish(title))
            return StopWatch.stop('stream_preview'), STREAM_PREVIEW?.element?.remove();

        let [alias] = title.textContent.split(/[^\p{L}\w\s]/u);

        alias = alias?.trim();

        const name = (null
            ?? ALL_CHANNELS.find(({ name }) => (
                (name.contains('(') && name.contains(')'))
                    ? name.contains(alias)
                    : name.equals(alias)
            ))
            ?? { name: alias.normalize('NFKD') }
        )?.name?.replace(/[^]*\(([^\(\)]+)\)[^]*/, '$1');

        // There is already a preview of the hovered tooltip
        if([STREAMER?.name, STREAM_PREVIEW?.name].contains(name))
            return StopWatch.stop('stream_preview');

        const { top, left, bottom, right, height, width } = getOffset(richTooltip)
            , [body, video] = $.all('body, video').map(getOffset);

        STREAM_PREVIEW?.element?.remove();

        const scale = parseFloat(Settings.stream_preview_scale) || 1
            , muted = !parseBool(Settings.stream_preview_sound)
            , quality = (scale > 1 ? 'auto' : '720p')
            , watchParty = $.defined('[data-a-target^="watchparty"i][data-a-target*="overlay"i]')
            , controls = false;

        // Watch-party information...
        // @TODO: Use this...
        // let partyInfo = $('[class*="watch"i][class*="party"i][class*="info"i]'),
        //     partyThumbnail = $('[data-test-selector*="thumbnail"i]', partyInfo),
        //     partyTitle = $('[data-test-selector*="title"i]', partyInfo),
        //     [partyRating, partyReviews, partyYear, partyContentRating] = $.all('[data-test-selector*="title"i] + * > *', partyInfo) ?? [];

        STREAM_PREVIEW = {
            name,
            element:
                furnish(`.tt-stream-preview.invisible[@position=${ (top + height / 2 < body.height / 2) ? 'below' : 'above' }][@vods=${ richTooltips.length > 1 }]`, {
                    style: (
                        (top + height / 2 < body.height / 2)
                            // Below tooltip
                            ? `top: calc(${ bottom }px + 0.5em);`
                            // Above tooltip
                            : `top: calc(${ top }px - 0.5em - (15rem * ${ scale }));`
                    ) + `left: calc(${ (watchParty ? getOffset($('[data-a-target^="side-nav-bar"i]'))?.width : video?.left) ?? 50 }px - 6rem); height: calc(15rem * ${ scale }); width: calc(26.75rem * ${ scale }); z-index: ${ '9'.repeat(1 + parseInt(Settings.stream_preview_position ?? 0)) };`,
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
                            isOnline
                                ? ({
                                    channel: name,
                                    parent: 'twitch.tv',

                                    controls, muted, quality,
                                })
                                : ({
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
                            $.all('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])').at($('#tt-stream-preview--iframe').dataset.index | 0)?.closest('[href^="/videos/"i]')?.modStyle(`background:var(--color-twitch-purple-${ 6 + (THEME.equals('light') ? 6 : 0) })`);

                            if(!parseBool(Settings.stream_preview_sound))
                                return;

                            if(nullish(InitialVolume))
                                InitialVolume = GetVolume();

                            /**
                             * Checks if the given element has an active audio track.
                             * @param {HTMLElement} element - The element to check for audio
                             * @returns {boolean} True if audio is present
                             */
                            const hasAudio = element =>
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
    },

    /**
     * Undoes the stream preview by removing the preview element from the DOM.
     */
    unhandler: () => {
        STREAM_PREVIEW = { element: STREAM_PREVIEW?.element?.remove() };
    },

    /**
     * Initializes stream previews, sets up location change cleanup, and adds keyboard navigation for the preview player.
     */
    setup() {
        $remark("Adding Stream previews...");

        top.onlocationchange = Unhandlers.stream_preview;

        // Add key event listeners to the card
        $.body.addEventListener('keyup', ({ key = '', altKey, ctrlKey, metaKey, shiftKey }) => {
            if(altKey || ctrlKey || metaKey || shiftKey)
                return;

            if(!/^Arrow(Up|Down)$/i.test(key))
                return;

            const richTooltips = $.all(`[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])`)
                , { length } = richTooltips
                , iframe = $('#tt-stream-preview--iframe');

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
    },
});
