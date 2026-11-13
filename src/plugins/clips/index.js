/*** /plugins/clips/index.js
 * Bundled by esbuild into `clips-plugins.js`, which loads right before `clips.js` on clips.twitch.tv.
 * Clips plugins, in the order they were in clips.js.
 */

import { plugin, plugins, run, start } from '../../lib/plugins.js';

/**
 * The plugin registry's API (`plugin`, `plugins`, `run`, `start`), shared by every bundle over one registry; whichever bundle loads first sets it.
 * @type {object}
 */
globalThis.TTV ??= { plugin, plugins, run, start };
import './save-ttv-clips.js';
