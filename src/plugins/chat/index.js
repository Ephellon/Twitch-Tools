/*** /plugins/chat/index.js
 * Bundled by esbuild into `chat-plugins.js`, which loads right before `chat.js` wherever chat runs
 * (www.twitch.tv and pop-out chat). Chat plugins, in the order they were in chat.js.
 */

import { plugin, plugins, run, start } from '../../lib/plugins.js';

globalThis.TTV ??= { plugin, plugins, run, start };
import './auto-claim-bonuses.js';
import './emote-searching.js';
import './bttv-emotes.js';
import './convert-emotes.js';
import './filter-messages.js';
import './easy-filter.js';
import './filter-bulletins.js';
import './highlight-phrases.js';
import './easy-highlighter.js';
import './easy-helper-card-resizer.js';
import './highlight-mentions.js';
import './highlight-mentions-popup.js';
import './native-twitch-reply.js';
import './link-maker-chat.js';
import './auto-chat-vip.js';
import './prevent-spam.js';
import './simplify-chat.js';
import './convert-bits.js';
import './rewards-calculator.js';
import './points-receipt-placement-framed-helper.js';
import './recover-chat.js';
import './recover-messages.js';
import './safe-greedy-raiding.js';
import './safe-point-watcher-helper.js';
import './safe-soft-unban.js';
import './user-scripts.js';
