/*** /plugins/up-next/search-actions.js
 * Search Actions (#79): small Live Reminder, Pin and DVR buttons on the channels in Twitch's search results, so a channel
 * can be set up without opening its page. Each button shows only while its feature is on; Up Next takes the channel by
 * drag-and-drop, as before.
 */

import { plugin } from '../../lib/plugins.js';

// A channel row in Twitch's search tray; its parent holds the buttons
const RESULT = '[id^="search-result"i] a[data-tray-item][href^="/"]';

/**
 * The channel a search result opens, or nothing for other results (games, categories, searches).
 * @param {HTMLAnchorElement} link
 * @returns {string|undefined}
 */
function channelOf(link) {
    const [name, ...rest] = parseURL(link.href).pathname.split('/').filter(defined).filter(part => part.length);

    if(nullish(name) || rest.length || [USERNAME, ...TWITCH_PATHNAMES].some(path => path?.equals?.(name)))
        return;

    return name;
}

/**
 * Reads a cached object (`LiveReminders`, `DVRChannels`), stored as JSON or as an object.
 * @param {string} key
 * @returns {Promise<object>}
 */
async function loadObject(key) {
    const value = (await Cache.load(key))?.[key];

    try {
        return JSON.parse(value || '{}');
    } catch(error) {
        // Probably an object already...
        return value ?? {};
    }
}

/**
 * The buttons: each reads its state, flips it, and saves it the way the channel page's own button does.
 * `on()` says whether the button is shown (its feature is on).
 */
const ACTIONS = {
    reminder: {
        on: () => nullish(Settings.live_reminders) || parseBool(Settings.live_reminders),
        glyph: active => (active ? 'notify' : 'inform'),
        title: (name, active) => (active ? `Remove the Live Reminder for ${ name }` : `Remind me when ${ name } goes live`),

        async active(name) {
            const LiveReminders = await loadObject('LiveReminders');

            return Object.keys(LiveReminders).some(key => key.equals(name));
        },

        async toggle(name) {
            const LiveReminders = await loadObject('LiveReminders')
                , realName = Object.keys(LiveReminders).find(key => key.equals(name));

            if(defined(realName))
                delete LiveReminders[realName];
            else
                LiveReminders[name] = new Date;

            await Cache.save({ LiveReminders });
            await Settings.set({ LIVE_REMINDERS: Object.keys(LiveReminders) });

            return nullish(realName);
        },
    },

    pin: {
        on: () => parseBool(Settings.first_in_line) || parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all) || parseBool(Settings.first_in_line_now),
        glyph: () => 'pinned',
        title: (name, active) => (active ? `Unpin ${ name }` : `Pin ${ name } (Up Next goes there when the queue is empty and this stream ends)`),

        async active(name) {
            return (GetNextStreamer.pinnedStreamers ?? []).some(pin => pin.equals(name));
        },

        async toggle(name) {
            const pins = GetNextStreamer.pinnedStreamers ?? []
                , pinned = pins.some(pin => pin.equals(name));

            top.SET_PINNED_STREAMERS?.(pinned ? pins.filter(pin => !pin.equals(name)) : [...pins, name]);

            return !pinned;
        },
    },

    dvr: {
        on: () => parseBool(Settings.video_clips__dvr),
        glyph: active => (active ? 'clip' : 'host'),
        title: (name, active) => (active ? `Stop recording ${ name }` : `Record ${ name } when live (DVR)`),

        async active(name) {
            return parseBool((await loadObject('DVRChannels'))[name.toLowerCase()]?.length);
        },

        async toggle(name) {
            const DVRChannels = await loadObject('DVRChannels')
                , DVR_ID = name.toLowerCase()
                , enabled = !parseBool(DVRChannels[DVR_ID]?.length);

            // Any name marks the channel (`DVR_CLIP_PRECOMP_NAME` names this page's stream, not that channel's); the
            // recording starts when the channel goes live, as with its own button
            if(enabled)
                DVRChannels[DVR_ID] = name;
            else
                delete DVRChannels[DVR_ID];

            await Cache.save({ DVRChannels });
            await Settings.set({ DVR_CHANNELS: Object.keys(DVRChannels) });

            return enabled;
        },
    },
};

/**
 * Draws one button in its state.
 * @param {HTMLButtonElement} button
 * @param {object} action - One of `ACTIONS`
 * @param {string} name - The channel
 * @param {boolean} active
 */
function paint(button, action, name, active) {
    button.dataset.active = active;
    button.innerHTML = Glyphs.modify(action.glyph(active), { height: '16px', width: '16px', style: 'fill:currentcolor' });
    button.modStyle(`color:${ active ? 'var(--color-text-link)' : 'var(--color-text-alt-2)' }`);
    button.tooltip ??= new Tooltip(button, action.title(name, active));
    button.tooltip.innerHTML = action.title(name, active);
}

plugin({
    id: 'search_actions',
    timer: 500,

    /**
     * Shows while any of its features is on.
     * @returns {boolean}
     */
    enabled() {
        return Object.values(ACTIONS).some(action => action.on());
    },

    /**
     * Adds the buttons to new search results.
     * @param {Object} params - Execution context
     * @param {StopWatch} params.StopWatch - Timer for performance tracking
     */
    handler({ StopWatch }) {
        new StopWatch('search_actions');

        const f = furnish;

        for(const link of $.all(RESULT)) {
            const row = link.parentElement
                , name = channelOf(link);

            if(nullish(name) || defined($('.tt-search-actions', row)))
                continue;

            row.modStyle('display:flex; align-items:center');
            link.modStyle('flex:1; min-width:0');

            const buttons = Object.entries(ACTIONS)
                .filter(([, action]) => action.on())
                .map(([type, action]) => {
                    const button = f('button.tt-search-action', {
                        'data-action': type,
                        style: 'display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0; border-radius:var(--ttv-radius-xs, 4px); background:none',

                        // Keep the search box focused: the tray closes when it loses focus
                        onmousedown: event => event.preventDefault(),

                        onclick: async event => {
                            event.preventDefault();
                            event.stopPropagation();

                            const { currentTarget } = event;

                            currentTarget.disabled = true;
                            paint(currentTarget, action, name, await action.toggle(name).catch($warn) ?? await action.active(name));
                            currentTarget.disabled = false;
                        },
                    });

                    action.active(name).then(active => paint(button, action, name, active));

                    return button;
                });

            if(buttons.length)
                row.append(f('.tt-search-actions', { style: 'display:flex; gap:2px; flex:none; padding-right:0.5rem' }).with(...buttons));
        }

        StopWatch.stop('search_actions');
    },

    /**
     * Removes the buttons.
     */
    unhandler() {
        $.all('.tt-search-actions').map(actions => actions.remove());
    },
});
