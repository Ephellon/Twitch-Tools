/*** /plugins/chat/safe-greedy-raiding.js
 * Greedy Raiding.
 * Moved from chat.js (Chat__Initialize_Safe_Mode) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let RAID_LOGGED;

plugin({
    id: 'chat-safe.greedy_raiding',
    job: 'greedy_raiding',
    timer: 5000,

    init() {
        RAID_LOGGED = false;
    },

    handler: () => {
        const raiding = $.defined('[data-test-selector="raid-banner"i]')
            , atTop = (top == window);

        if(RAID_LOGGED || atTop || !raiding)
            return;
        RAID_LOGGED ||= raiding;

        const { current = false } = parseBool(parseURL(location).searchParameters);
        let raid_banner = $.all('[data-test-selector="raid-banner"i] strong').map(strong => strong?.innerText)
            , [,from] = location.pathname.split(/(?<!^)\//)
            , [to] = raid_banner.filter(name => !RegExp(`^${ from }$`, 'i').test(name));

        // Already on the channeling that's raiding...
        if(current)
            return;

        $warn(`There is a raid happening on another channel... ${ from } → ${ to } (${ raid_banner.join(' to ') })`);

        Runtime.sendMessage({ action: 'LOG_RAID_EVENT', data: { from, to } }, async({ events }) => {
            $warn(`${ from } has raided ${ events } time${ (events != 1 ? "s" : "") } this week. Current raid: ${ to } @ ${ (new Date) }`);

            const payable = $.defined('[data-test-selector*="balance-string"i]');

            top.postMessage({ action: 'raid', from, to, events, payable }, location.origin);
        });
    },

    unhandler: () => {},
});
