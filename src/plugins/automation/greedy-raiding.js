/*** /plugins/automation/greedy-raiding.js
 * Greedy Raiding.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'greedy_raiding',

    async install() {
        let GREEDY_RAIDING_FRAMES = new Map;
        Handlers.greedy_raiding = () => {
            let online = [STREAMER, ...STREAMERS].filter(isLive).filter(({ name }) => name.unlike(STREAMER.name)),
                container = (null
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

            for(let channel of online) {
                let { name } = channel;
                let frame = (null
                    ?? $(`#tt-greedy-raiding--${ name }`)
                    ?? furnish(`iframe#tt-greedy-raiding--${ name }`, {
                        src: `./popout/${ name }/chat?hidden=true&parent=twitch.tv&current=${ STREAMER.name.equals(name) }&allow=greedy_raiding`,
                        destroy: setTimeout(name => $(`#tt-greedy-raiding--${ name }`)?.remove(), 120_000, name),

                        // sandbox: `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals`,
                    })
                );

                GREEDY_RAIDING_FRAMES.set(channel.name, frame);

                if([...container.children].missing(frame))
                    container.append(frame);
            }

            if([...$.body.children].missing(container))
                $.body.append(container);
        };
        Timers.greedy_raiding = 5000;

        Unhandlers.greedy_raiding = () => {
            for(let [name, frame] of GREEDY_RAIDING_FRAMES)
                frame?.remove();
        };

        __GreedyRaiding__:
        if(UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.greedy_raiding)) {
            $remark('Adding raid-watching logic...');

            RegisterJob('greedy_raiding');
        }
    },
});
