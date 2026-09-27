/*** /plugins/chat/user-scripts.js
 * User Scripts: runs the viewer's `.ttv` scripts (TTV DSL). Each script is its own plugin with its own toggle and
 * settings; this plugin only hosts them. See docs/DSL-HOST.md and src/lib/user-scripts.js.
 */

import { plugin } from '../../lib/plugins.js';
import { createUserScripts } from '../../lib/user-scripts.js';

let RUNNER;

plugin({
    id: 'chat.user_scripts',
    job: 'user_scripts',
    frames: ['chat'],
    register: false,

    // Always hosts; each script is switched on and off by its own toggle
    enabled: () => true,

    setup(context) {
        if(RUNNER)
            return;

        if(!globalThis.TTV_DSL)
            return $warn("User Scripts: the TTV DSL did not load");

        $remark("Hosting user scripts...");

        const frame = /^\/popout\//i.test(location.pathname) ? 'chat' : 'main';

        // The chat frame reassigns its STREAMER; read through to whichever is current
        const STREAMER = new Proxy({}, { get: (target, key) => context.STREAMER?.[key] });

        RUNNER = createUserScripts({
            DSL: globalThis.TTV_DSL,
            storage: {
                get: keys => new Promise(resolve => Storage.get(keys, resolve)),
                onChanged: callback => Storage.onChanged.addListener(changes => callback(changes)),
            },
            env: {
                Chat,
                STREAMER,
                USERNAME: context.USERNAME,
                viewerBadges: () => Chat.viewerBadges,
                ...(frame == 'main' ? { goto: name => goto(`/${ name }`) } : {}),
            },
            frame,
            log: { log: $log, warn: $warn, error: $error },
        });

        RUNNER.start();
    },
});
