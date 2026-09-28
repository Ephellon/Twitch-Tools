/*** /plugins/chat/user-scripts.js
 * User Scripts: runs the viewer's `.ttv` scripts (TTV DSL). Each script is its own plugin with its own toggle and
 * settings; this plugin only hosts them. See docs/DSL-HOST.md and src/lib/user-scripts.js.
 *
 * Starts on its own once the page has what the runner needs (the DSL, `Chat` fed by the main relay, a channel and a
 * signed-in viewer), so it doesn't wait on `Chat__Initialize`, which needs chat on screen.
 * Like most of the extension, it needs a live channel: `STREAMER` is only set, and the relay only calls `onmessage`
 * hooks, once `tools.js` has initialized the page.
 */

import { plugin } from '../../lib/plugins.js';
import { createUserScripts } from '../../lib/user-scripts.js';

let RUNNER;

const IS_POPOUT = /^\/popout\//i.test(location.pathname);

/**
 * The signed-in viewer's login, as the relay uses it. `USERNAME` can be a display name or a placeholder.
 * @returns {string|undefined}
 */
const login = () => Search.cookies.login;

/**
 * Whether this window can host scripts: the top window of a channel page, with the main relay open.
 * Framed containers are skipped so a script never runs twice; pop-out chat has no relay yet (see TRIAGE.md).
 * @returns {boolean}
 */
function hostable() {
    return (true
        && top == window
        && !IS_POPOUT
        && defined(globalThis.TTV_DSL)
        && defined(globalThis.Chat)
        && defined(globalThis.TTV_IRC?.socket)
        && !!globalThis.STREAMER?.name
        && !!login()
    );
}

/**
 * Starts the runner once.
 * @param {Object} [context] - A plugin context; the page globals are used when omitted
 */
function boot(context = globalThis) {
    if(RUNNER || !hostable())
        return;

    $remark("Hosting user scripts...");

    // `STREAMER` is replaced on some navigations; read through to whichever is current
    const STREAMER = new Proxy({}, { get: (target, key) => (context.STREAMER ?? globalThis.STREAMER)?.[key] });

    RUNNER = createUserScripts({
        DSL: globalThis.TTV_DSL,
        storage: {
            get: keys => new Promise(resolve => Storage.get(keys, resolve)),
            onChanged: callback => Storage.onChanged.addListener(changes => callback(changes)),
        },
        env: {
            Chat,
            STREAMER,
            USERNAME: login(),
            viewerBadges: () => Chat.viewerBadges,
            goto: name => goto(`/${ name }`),
        },
        frame: 'main',
        log: { log: $log, warn: $warn, error: $error },
    });

    RUNNER.start();
}

// Content scripts load before the page settles; check until the relay and channel are known
if(top == window && !IS_POPOUT) {
    const checker = setInterval(() => {
        if(RUNNER)
            return clearInterval(checker);

        if(hostable()) {
            clearInterval(checker);
            boot();
        }
    }, 1000)
}

plugin({
    id: 'chat.user_scripts',
    job: 'user_scripts',
    frames: ['chat'],
    register: false,

    // Always hosts; each script is switched on and off by its own toggle
    enabled: () => true,

    setup(context) {
        if(!globalThis.TTV_DSL)
            return $warn("User Scripts: the TTV DSL did not load");

        boot(context);
    },
});
