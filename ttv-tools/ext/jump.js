/*** /jump.js
 *           _                        _
 *          | |                      (_)
 *          | |_   _ _ __ ___  _ __   _ ___
 *      _   | | | | | '_ ` _ \| '_ \ | / __|
 *     | |__| | |_| | | | | | | |_) || \__ \
 *      \____/ \__,_|_| |_| |_| .__(_) |___/
 *                            | |   _/ |
 *                            |_|  |__/
 */
/***
 *      ______                               _
 *     |  ____|                             | |
 *     | |__ _ __ __ _ _ __ ___   ___       | |_   _ _ __ ___  _ __   ___ _ __
 *     |  __| '__/ _` | '_ ` _ \ / _ \  _   | | | | | '_ ` _ \| '_ \ / _ \ '__|
 *     | |  | | | (_| | | | | | |  __/ | |__| | |_| | | | | | | |_) |  __/ |
 *     |_|  |_|  \__,_|_| |_| |_|\___|  \____/ \__,_|_| |_| |_| .__/ \___|_|
 *                                                            | |
 *                                                            |_|
 */

/**
 * @file Hands Twitch's page data to TTV Tools. Injected into the page itself (not the extension's isolated world), so it
 * can read Twitch's Apollo GraphQL cache, which content scripts can't reach; it posts that data to the top window once.
 *
 * @simply jump.js → postMessage(JumpMessage)
 */

/**
 * The message this file posts to the top window.
 * @typedef {object} JumpMessage
 *
 * @property {string} action    Always <code>"jump"</code>
 * @property {object} [data]    Twitch's Apollo cache data (<code>__APOLLO_CLIENT__.cache.data.data</code>), keyed by
 *                              GraphQL object ID; <code>undefined</code> when the page hasn't built its cache yet
 */
FrameJumper: {
    let action = 'jump',
        data = top.__APOLLO_CLIENT__?.cache?.data?.data;

    top.postMessage({ action, data });
}
