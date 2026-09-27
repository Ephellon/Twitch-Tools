/*** /lib/index.js
 * Bundled by esbuild into `lib.js`, which loads right before `tools.js` on www.twitch.tv.
 *
 * The legacy scripts (`tools.js`, `chat.js`) still reach these helpers as globals, so each one is
 * published on `globalThis`. New code should import them instead.
 */

import { Balloon } from './balloon.js';
import { ChatFooter } from './chat-footer.js';
import { Card } from './card.js';
import { ContextMenu } from './context-menu.js';
import { Search } from './search.js';
import { Chat } from './chat.js';
import { parseCoin } from './currency.js';
import { GetQuality, SetQuality, GetVolume, SetVolume, GetViewMode, SetViewMode } from './player.js';
import { GetActivity, GetLanguage, ReloadPage } from './page.js';
import { scoreTagActivity } from './tags.js';
import { plugin, plugins, run, start } from './plugins.js';

// Registers every plugin; tools.js starts them with `TTV.start('main', …)`
import '../plugins/index.js';

Object.assign(globalThis, {
    TTV: { plugin, plugins, run, start },
    Balloon,
    ChatFooter,
    Card,
    ContextMenu,
    Search,
    Chat,
    parseCoin,
    GetQuality, SetQuality, GetVolume, SetVolume, GetViewMode, SetViewMode,
    GetActivity, GetLanguage, ReloadPage,
    scoreTagActivity,
});
