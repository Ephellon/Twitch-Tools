/*** /plugins/automation/greedy-raiding.js
 * Greedy Raiding.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let GREEDY_RAIDING_FRAMES;

plugin({
    id: 'greedy_raiding',
    timer: 5000,

    /**
     * Init: Initializes the map used to track greedy raiding frames.
     */
    init() {
        GREEDY_RAIDING_FRAMES = new Map;
    },

    /**
     * Watches the live followed channels for raids through one hidden chat frame, one channel at a time.
     */
    handler: () => {
        const online = [STREAMER, ...STREAMERS].filter(isLive).filter(({ name }) => name.unlike(STREAMER.name))
            , container = (null
                ?? $('#tt-greedy-raiding--container')
                ?? furnish('#tt-greedy-raiding--container', {
                    style: new CSSObject(`
                        display: none;
                        visibility: hidden;

                        position: absolute;
                        top: -100vh;
                        left: -100vw;

                        height: 0;
                        width: 0;
                    `, true).toString('all'),
                })
            );

        // One channel at a time, at all times: each hidden frame is a whole Twitch chat page, and one per live followed channel
        // froze pages once the followed channels could be read (v5 #99). The frame watches a channel for 15 seconds, then moves
        // on to the next live one, in name order. The turn outlives the page (kept in localStorage: only the Up Next tab
        // runs this): Up Next moves on every few minutes, and starting over on each page left channels without a turn
        const frames = [...container.querySelectorAll('iframe[id^="tt-greedy-raiding--"i]')]
            , names = online.map(channel => channel.name).sort((a, b) => a.localeCompare(b))
            , now = +new Date;

        let [frame] = frames
            , turn = {};

        for(const extra of frames.slice(1))
            extra.remove();

        try {
            turn = JSON.parse(localStorage.getItem('ttv-tools:greedy-raiding') ?? '{}') ?? {};
        } catch {
            // No storage: this page's frame is the turn
        }

        let name = frame?.getAttribute('channel') ?? turn.name
            , since = parseInt(frame?.getAttribute('since') ?? turn.since) || 0;

        // The turn is over (15 seconds: a raid's countdown is 90, so with up to 6 channels live each one is looked at during it),
        // or its channel isn't live any more: the next channel's turn
        if(!names.includes(name) || now - since >= 15_000) {
            name = names.find(next => next.localeCompare(name ?? '') > 0) ?? names[0];
            since = now;
        }

        // One frame for good: it goes to the next channel instead of being removed and made again (removing it gave no memory
        // back any sooner). `replace` keeps the turns out of the tab's Back history
        const goto = (frame, src) => {
            try {
                frame.contentWindow.location.replace(new URL(src, location.href).href);
            } catch {
                frame.src = src;
            }
        };

        if(nullish(name)) {
            // No live followed channel: the frame waits on a blank page
            if(defined(frame) && frame.getAttribute('channel')?.length) {
                goto(frame, 'about:blank');
                frame.setAttribute('channel', '');
            }

            GREEDY_RAIDING_FRAMES.clear();
        } else if(frame?.getAttribute('channel') != name) {
            const src = `./popout/${ name }/chat?hidden=true&parent=twitch.tv&current=${ STREAMER.name.equals(name) }&allow=greedy_raiding`;

            GREEDY_RAIDING_FRAMES.clear();

            if(defined(frame)) {
                goto(frame, src);
                frame.setAttribute('channel', name);
                frame.setAttribute('since', since);
            } else {
                frame = furnish('iframe#tt-greedy-raiding--frame', {
                    src,
                    channel: name,
                    since,

                    // Each turn loads a Twitch chat page, which focuses its own chat box: the frame must never take focus
                    // from what the viewer is typing in (see the focus guard below)
                    inert: '',
                    tabindex: -1,

                    // sandbox: `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals`,
                });

                container.append(frame);
            }

            GREEDY_RAIDING_FRAMES.set(name, frame);

            try {
                localStorage.setItem('ttv-tools:greedy-raiding', JSON.stringify({ name, since }));
            } catch {
                // No storage
            }
        }
        if([...$.body.children].missing(container))
            $.body.append(container);
    },

    /**
     * Undoes greedy-raiding: Removes all created raiding iframes.
     */
    unhandler: () => {
        for(const [name, frame] of GREEDY_RAIDING_FRAMES)
            frame?.remove();
    },

    /**
     * Checks if greedy raiding is enabled in settings and allowed in the current tab.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
        return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.greedy_raiding);
    },

    setup() {
        $remark("Adding raid-watching logic...");

        // The hidden chat can't take focus (it's inert); should it get it anyway, focus goes straight back where it was
        if(top == window && !top.GREEDY_RAIDING_FOCUS_GUARD) {
            top.GREEDY_RAIDING_FOCUS_GUARD = true;

            document.addEventListener('focusout', ({ target }) => {
                setTimeout(() => {
                    if(document.activeElement?.id == 'tt-greedy-raiding--frame' && target?.isConnected)
                        target.focus({ preventScroll: true });
                });
            }, true);
        }
    },
});
