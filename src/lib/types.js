/*** /lib/types.js
 * Shapes used in more than one file, for JSDoc headers to refer to by name (docs/STYLEGUIDE.md, Header comments).
 * Nothing here runs, and nothing imports it.
 */

/**
 * A channel as the channel lists hold it (`ALL_CHANNELS`, `STREAMERS`, `CHANNELS`, `SEARCH`, `NOTIFICATIONS`).
 * Most fields are read from the page when asked for, so they stay current.
 * @typedef {object} Channel
 * @property {string} name - The channel's name (its login, or its display name when that's all the page shows)
 * @property {string} href - The channel's page, e.g. `https://www.twitch.tv/name`
 * @property {boolean} live - Whether the channel is live right now
 * @property {String|null} icon - The avatar's URL (a `String` carrying the parsed URL's parts), or `null`
 * @property {string} from - Which list it came from: `STREAMERS`, `CHANNELS`, `SEARCH`, `NOTIFICATIONS`, …
 * @property {Element} [element] - The link on the page the entry was read from
 * @property {string} [desc] - The stream's title, when known
 * @property {string} [game] - The stream's category, when known
 */

/**
 * A channel-points reward, as `STREAMER.shop` lists them (cheapest first).
 * @typedef {object} Reward
 * @property {string} id - Twitch's id for the reward
 * @property {string} title - Its name
 * @property {number} cost - Its price in channel points
 * @property {string} type - `CUSTOM`, or the kind of a built-in (automatic) reward
 * @property {string} image - Its picture's URL
 * @property {string} backgroundColor - Its colour, as `#rrggbb`
 * @property {boolean} enabled - The streamer turned it on
 * @property {boolean} available - It's in stock
 * @property {boolean} paused - The streamer paused it
 * @property {boolean} hidden - Hidden from subscribers (the viewer is one)
 * @property {boolean} premium - Subscribers only
 * @property {boolean} needsInput - Asks the viewer for text
 * @property {boolean} skips - Skips the streamer's request queue
 * @property {string} prompt - The text shown with it
 * @property {number} count - Times redeemed this stream
 * @property {{ global: number, user: number }} maximum - Redemptions allowed per stream, in all and per viewer (`0` = no limit)
 * @property {string} updated - When Twitch last changed it (an ISO date)
 */

/**
 * What every plugin hook receives (see `lib/plugins.js`).
 * @typedef {object} PluginContext
 * @property {typeof StopWatch} StopWatch - Times a job: `new StopWatch(name)`, then `StopWatch.stop(name)`
 */

export {};
