/*** /plugins/player/index.js
 * Bundled by esbuild into `player-plugins.js`, which loads right before `player.js` on player.twitch.tv.
 * Player plugins, in the order they were in player.js.
 */

import { plugin, plugins, run, start } from '../../lib/plugins.js';

globalThis.TTV ??= { plugin, plugins, run, start };
import './auto-accept-mature.js';
import './recover-video.js';
import './hide-blank-ads.js';
import './auto-dvr.js';
import './miscellaneous.js';
