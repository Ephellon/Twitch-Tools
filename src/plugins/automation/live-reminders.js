/*** /plugins/automation/live-reminders.js
 * Live Reminders.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'live_reminders',
    timer: -2_500,

    /**
     * Adds the "Remind me" action button to the channel's about section.
     * @param {Object} params - The plugin context
     * @param {Object} params.StopWatch - Utility to track and stop the handler execution
     */
    handler: ({ StopWatch }) => {
        new StopWatch('live_reminders');

        // Add the button to all channels
        const actionPanel = $('.about-section__actions');

        if(nullish(actionPanel))
            return StopWatch.stop('live_reminders');

        let action = $('[tt-action="live-reminders"i]', actionPanel);

        if(defined(action))
            return StopWatch.stop('live_reminders');

        Cache.load('LiveReminders', async({ LiveReminders }) => {
            try {
                LiveReminders = JSON.parse(LiveReminders || '{}');
            } catch(error) {
                // Probably an object already...
                LiveReminders ??= {};
            }

            let f = furnish
                , s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s")
                , reminderName = STREAMER.name
                , realName = (Object.keys(LiveReminders).find(name => name.equals(reminderName)))
                , hasReminder = sated(realName)
                , tense = (parseBool(Settings.keep_live_reminders) ? '' : ' next')
                , stream_s = 'stream'.pluralSuffix(+!!tense)
                , [title, subtitle, icon] = [
                    ['Remind me', `Receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'inform'],
                    ['Reminder set', `You will receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'notify']
                ][+!!hasReminder];

            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

            // Create the action button...
            action =
                f('div', { 'tt-action': 'live-reminders', 'for': realName, 'remind': hasReminder, 'action-origin': 'foreign', style: `animation:1s fade-in 1;` },
                f('button', {
                    onmouseup: async event => {
                        const { currentTarget, isTrusted = false, button = -1 } = event;

                        if(button)
                            return /* Not the primary button */;

                        Cache.load('LiveReminders', async({ LiveReminders }) => {
                            try {
                                LiveReminders = JSON.parse(LiveReminders || '{}');
                            } catch(error) {
                                // Probably an object already...
                                LiveReminders ??= {};
                            }

                            /**
                             * Formats a string to be possessive by adding "'s".
                             * @param {string} string - The text to modify
                             * @returns {string} The string with possessive punctuation
                             */
                            let s = string => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s")
                                , reminderName = STREAMER.name
                                , realName = (Object.keys(LiveReminders).find(name => name.equals(reminderName)))
                                , notReminded = empty(realName)
                                , tense = (parseBool(Settings.keep_live_reminders) ? '' : ' next')
                                , stream_s = 'stream'.pluralSuffix(+!!tense)
                                , [title, subtitle, icon] = [
                                    ['Remind me', `Receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'inform'],
                                    ['Reminder set', `You will receive a notification for ${ s(STREAMER.name) }${ tense } live ${ stream_s }`, 'notify']
                                ][+!!notReminded];

                            icon = Glyphs.modify(icon, { style: 'fill:var(--user-contrast-color)!important', height: '20px', width: '20px' });

                            $('.tt-action-icon', currentTarget).innerHTML = icon;
                            $('.tt-action-title', currentTarget).innerText = title;
                            $('.tt-action-subtitle', currentTarget).innerText = subtitle;

                            // Add the reminder...
                            let message;

                            if(notReminded) {
                                message = `You'll be notified when <a href="/${ reminderName }">${ reminderName }</a> goes live.`;
                                LiveReminders[reminderName] = (STREAMER.live ? new Date(STREAMER?.data?.actualStartTime) : STREAMER?.data?.lastSeen ?? new Date);
                            }
                            // Remove the reminder...
                            else {
                                message = `Reminder for <a href="/${ reminderName }">${ reminderName }</a> removed successfully!`;
                                delete LiveReminders[reminderName];
                            }

                            currentTarget.closest('[tt-action]').setAttribute('remind', notReminded);

                            // @FIXME: Live Reminder alerts will not display if another alert is present...
                            Cache.save({ LiveReminders }, () => Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) }).then(() => parseBool(message) && confirm.timed(message, 7000)).catch($warn));
                        });
                    },
                }, f.div(
                    f('.tt-action-icon').html(icon),
                    f.div(
                        f('p.tw-title.tt-action-title').with(title),
                        f('p.tt-action-subtitle').with(subtitle)
                    )
                ))
                );

            actionPanel.append(action);

            // @performance
            PrepareForGarbageCollection(LiveReminders);
        });

        StopWatch.stop('live_reminders');
    },

    /**
     * Undoes the live reminders feature by removing the action buttons and clearing the check interval.
     */
    unhandler: () => {
        $.all('[tt-action="live-reminders"i]').map(action => action.remove());
        [LIVE_REMINDERS__LISTING_INTERVAL].map(clearInterval);
    },

    /**
     * Determines if the live reminders feature is enabled in the settings.
     * @returns {boolean} True if the feature should be active
     */
    enabled() {
        return true
            && (false
                || nullish(Settings.live_reminders)
                || parseBool(Settings.live_reminders)
            );
    },

    /**
     * Initializes the live reminders system and sets up the background checker.
     */
    setup() {
        $remark("Adding Live Reminders...");

        // See if there are any notifications to push...
        const REMINDERS_INDEX = -1, REMINDERS_LENGTH = 0, PARSED_REMINDERS = new Map;

        // Lists Live Reminders periodically...
        /**
         * Periodically checks cached reminders to notify the user when a tracked streamer goes live.
         */
        const LIVE_REMINDERS__CHECKER = () => {
            Cache.load('LiveReminders', async({ LiveReminders }) => {
                try {
                    LiveReminders = JSON.parse(LiveReminders || '{}');
                } catch(error) {
                    // Probably an object already...
                    LiveReminders ??= {};
                }

                checking: // Only check for the stream when it's live; if the dates don't match, it just went live again
                for(const reminderName in LiveReminders) {
                    const realName = (Object.keys(LiveReminders).find(name => name.equals(reminderName)));

                    culling: if(PARSED_REMINDERS.has(realName)) {
                        const repeats = PARSED_REMINDERS.get(realName) + 1;

                        PARSED_REMINDERS.set(realName, repeats);

                        // Let reminders refresh every 15mins
                        if(repeats % 3)
                            continue checking;
                    }

                    let channel = await new Search(reminderName).then(Search.convertResults)
                        , ok = parseBool(channel?.ok);

                    // Search did not complete...
                    let num = 3;

                    while(!ok && num-- > 0) {

                        Search.void(reminderName);

                        // @research
                        channel = await new Search(reminderName).then(Search.convertResults);
                        ok = parseBool(channel?.ok);

                        // $warn(`Re-search, ${ num } ${ 'retry'.pluralSuffix(num) } left [Reminders]: "${ reminderName }" → OK = ${ ok }`);
                    }

                    if(!num && !ok) {
                        channel = ALL_CHANNELS.find(channel => channel.name.equals(reminderName));

                        if(nullish(channel?.name))
                            continue checking;
                    }

                    if(!channel.live) {
                        // Ignore this reminder (channel not live)
                        continue checking
                    }

                    const { name, live, icon, href, data = { actualStartTime: null, lastSeen: null } } = channel;
                    const lastOnline = new Date((+new Date(LiveReminders[realName])).floorToNearest(1000)).toJSON()
                        , justOnline = new Date((+new Date(data.actualStartTime)).floorToNearest(1000)).toJSON();

                    // The channel just went live!
                    if(lastOnline != justOnline) {
                        PARSED_REMINDERS.set(realName, 0);

                        if(parseBool(Settings.keep_live_reminders)) {
                            LiveReminders[realName] = justOnline
                        } else {
                            $(`[tt-action="live-reminders"i][for="${ realName }"i][remind="true"i] button`)
                                ?.dispatchEvent?.(new MouseEvent('mouseup', { bubbles: false }));

                            delete LiveReminders[realName];
                        }

                        Cache.save({ LiveReminders }, async() => {
                            // @TODO: Currently, only one option looks for Live Reminder notifications...
                            Handle_phantom_notification: {
                                const notification = { href, innerText: `${ name } is live [Live Reminders]` }
                                    , [page, note] = [STREAMER.href, href].map(url => parseURL(url).pathname);

                                // If already on the stream, break
                                if(page?.equals(note))
                                    break Handle_phantom_notification;

                                // All of the Live Reminder handlers...
                                Handlers.first_in_line(notification);

                                const last = new Date(lastOnline);
                                const just = new Date(justOnline);
                                const instance = (last - just < 60_000) ? 'just now' : toTimeString((last - just).abs().floorToNearest(60_000), '?minutes minutes ago');

                                // Show a notification
                                Display_phantom_notification: {
                                    $warn(`Live Reminders: ${ name } went live ${ instance }`, new Date);
                                    alert.timed(`<a href='/${ name }'>${ name }</a> went live ${ instance }!`, 7000);
                                }

                                // Update the cached-streamer
                                Update_cached_streamer: {
                                    GetNextStreamer.cachedStreamer = null;
                                    (GetNextStreamer.cachedReminders ??= []).push({
                                        name, live, href,

                                        from: 'LIVE_REMINDERS__CHECKER',
                                    });

                                    GetNextStreamer();
                                }
                            }

                            // The reminder has been parsed...
                        });
                    } else {
                        // The reminder (date) hasn't been changed...
                    }

                } // :checking

                // Send the length to the settings page
                Settings.set({ 'LIVE_REMINDERS': Object.keys(LiveReminders) });

                // @performance
                PrepareForGarbageCollection(LiveReminders);
            });
        };

        // Add the panel & button
        let actionPanel = $('.about-section__actions');

        if(nullish(actionPanel)) {
            actionPanel = furnish('.about-section__actions', { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });

            $('.about-section')?.append?.(actionPanel);
        } else {
            for(const child of actionPanel.children)
                child.setAttribute('action-origin', 'native');
        }

        setTimeout(LIVE_REMINDERS__CHECKER, 5_000);
        setInterval(LIVE_REMINDERS__CHECKER, 300_000);
    },
});
