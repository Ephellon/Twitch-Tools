/*** /plugins/player/index.js
 * Bundled by esbuild into `player-plugins.js`, which loads right before `player.js` on player.twitch.tv.
 * Player plugins, in the order they were in player.js.
 */

import { plugin, plugins, run, start } from '../../lib/plugins.js';
import { Recording, installVideoMethods } from '../../lib/recording.js';

/**
 * The plugin registry's API (`plugin`, `plugins`, `run`, `start`), shared by every bundle over one registry; whichever bundle loads first sets it.
 * @type {object}
 */
globalThis.TTV ??= { plugin, plugins, run, start };
globalThis.Recording = Recording;
installVideoMethods();

import './auto-accept-mature.js';
import './recover-video.js';
import './hide-blank-ads.js';
import './auto-dvr.js';
import './miscellaneous.js';
