/*** /settings/layout.js
 * The Settings page: its groups, in order, and the sections in each. Each section is declared beside the
 * plugin it configures (`<plugin>.settings.js`) or, for page-level settings, in `settings/sections/`.
 */

import autoJoin1 from '../plugins/automation/auto-join.settings.js';
import claimBonuses2 from '../plugins/chat/auto-claim-bonuses.settings.js';
import claimDrops3 from '../plugins/automation/claim-drops.settings.js';
import claimPrimeLoot4 from '../plugins/automation/claim-loot.settings.js';
import easyLurk5 from '../plugins/automation/lurking.settings.js';
import firstInLineUpNext6 from '../plugins/up-next/first-in-line.settings.js';
import follows7 from '../plugins/automation/auto-follow.settings.js';
import killExtensions8 from '../plugins/automation/kill-extensions.settings.js';
import nextChannel9 from './sections/next-channel.js';
import parseCommands10 from '../plugins/automation/parse-commands.settings.js';
import preventRaiding11 from '../plugins/automation/prevent-raiding.settings.js';
import primeSubscription12 from '../plugins/automation/claim-prime.settings.js';
import stayLive13 from '../plugins/automation/stay-live.settings.js';
import timeZones14 from '../plugins/automation/time-zones.settings.js';
import viewMode15 from '../plugins/automation/view-mode.settings.js';
import accessibility16 from '../plugins/chat/simplify-chat.settings.js';
import betterttvEmotes17 from '../plugins/chat/bttv-emotes.settings.js';
import filterMessages18 from '../plugins/chat/filter-messages.settings.js';
import highlightMentions19 from '../plugins/chat/highlight-mentions.settings.js';
import highlightPhrases20 from '../plugins/chat/highlight-phrases.settings.js';
import linkMaker21 from '../plugins/chat/link-maker-chat.settings.js';
import lurkingMessage22 from '../plugins/chat/auto-chat-vip.settings.js';
import nativeReply23 from '../plugins/chat/native-twitch-reply.settings.js';
import notificationSounds24 from '../plugins/notifications/mention-audio.settings.js';
import preventSpam25 from '../plugins/chat/prevent-spam.settings.js';
import recoverChat26 from '../plugins/chat/recover-chat.settings.js';
import recoverMessages27 from '../plugins/chat/recover-messages.settings.js';
import showPopUps28 from '../plugins/chat/highlight-mentions-popup.settings.js';
import convertBits29 from '../plugins/chat/convert-bits.settings.js';
import channelPointsReceipt30 from '../plugins/currencies/points-receipt.channel-points-receipt.settings.js';
import rewardsCalculator31 from '../plugins/chat/rewards-calculator.settings.js';
import accentColor32 from './sections/accent-color.js';
import blockBanners33 from '../plugins/customization/block-banners.settings.js';
import contextMenuOverride34 from './sections/context-menu-override.js';
import easyLurk35 from '../plugins/automation/lurking.easy-lurk.settings.js';
import hideBlankAds36 from '../plugins/player/hide-blank-ads.settings.js';
import pointsReceiptAndRank37 from '../plugins/currencies/points-receipt.settings.js';
import pointWatcher38 from '../plugins/customization/point-watcher.settings.js';
import streamPreview39 from '../plugins/customization/stream-preview.settings.js';
import watchTime40 from '../plugins/customization/watch-time.settings.js';
import exportSettings41 from './sections/export-settings.js';
import siteAccess from './sections/site-access.js';
import storeIntegration42 from '../plugins/customization/store-integration.settings.js';
import videoClips43 from '../plugins/networking/auto-dvr.settings.js';
import keepPopOuts44 from './sections/keep-pop-outs.js';
import ramAlarms45 from './sections/ram-alarms.js';
import recoverAds46 from '../plugins/video-recovery/recover-stream.recover-ads.settings.js';
import recoverFrames47 from '../plugins/video-recovery/recover-frames.settings.js';
import recoverPages48 from '../plugins/video-recovery/recover-pages.settings.js';
import recoverStream49 from '../plugins/video-recovery/recover-stream.settings.js';
import recoverVideo50 from '../plugins/video-recovery/recover-video.settings.js';
import displayConsoleMessages51 from './sections/display-console-messages.js';
import displayStatistics52 from './sections/display-statistics.js';
import experimentalFeatures53 from '../plugins/developer/developer-features.experimental-features.settings.js';
import extraKeyboardShortcuts54 from '../plugins/developer/developer-features.settings.js';
import lowDataUsage55 from './sections/low-data-usage.js';
import userScripts from './sections/user-scripts.js';
import useFineDetails56 from './sections/use-fine-details.js';
import automaticTabReloads57 from './sections/automatic-tab-reloads.js';
import showDefaultValues58 from './sections/show-default-values.js';
import autoFocus59 from '../plugins/automation/auto-focus.settings.js';
import convertEmotes60 from '../plugins/chat/convert-emotes.settings.js';
import softUnban61 from '../plugins/chat/safe-soft-unban.settings.js';
import version62 from './sections/version.js';
import dataUsage63 from './sections/data-usage.js';
import support64 from './sections/support.js';
import language65 from './sections/language.js';

export default [
    {
        header: 'Automation',
        tr: 'header:automation',
        save: true,
        sections: [
            autoJoin1,
            claimBonuses2,
            claimDrops3,
            claimPrimeLoot4,
            easyLurk5,
            firstInLineUpNext6,
            follows7,
            killExtensions8,
            nextChannel9,
            parseCommands10,
            preventRaiding11,
            primeSubscription12,
            stayLive13,
            timeZones14,
            viewMode15,
        ],
    },
    {
        header: 'Chat &amp; Messaging',
        tr: 'header:chat-and-messaging',
        headerAttrs: {
            subtitle: 'These settings do not apply to banned channels unless otherwise noted.',
        },
        save: true,
        sections: [
            accessibility16,
            betterttvEmotes17,
            filterMessages18,
            highlightMentions19,
            highlightPhrases20,
            linkMaker21,
            lurkingMessage22,
            nativeReply23,
            notificationSounds24,
            preventSpam25,
            recoverChat26,
            recoverMessages27,
            showPopUps28,
        ],
    },
    {
        header: 'Currencies',
        tr: 'header:currencies',
        save: true,
        sections: [
            convertBits29,
            channelPointsReceipt30,
            rewardsCalculator31,
        ],
    },
    {
        header: 'Customization',
        tr: 'header:customization',
        save: true,
        sections: [
            accentColor32,
            blockBanners33,
            contextMenuOverride34,
            easyLurk35,
            hideBlankAds36,
            pointsReceiptAndRank37,
            pointWatcher38,
            streamPreview39,
            watchTime40,
        ],
    },
    {
        header: 'Networking',
        tr: 'header:networking',
        headerAttrs: {
            subtitle: 'Data here will interact with the Internet.',
        },
        save: true,
        sections: [
            exportSettings41,
            siteAccess,
            storeIntegration42,
            videoClips43,
        ],
    },
    {
        header: 'Video Recovery',
        tr: 'header:video-recovery',
        save: true,
        sections: [
            keepPopOuts44,
            ramAlarms45,
            recoverAds46,
            recoverFrames47,
            recoverPages48,
            recoverStream49,
            recoverVideo50,
        ],
    },
    {
        header: 'User Scripts',
        tr: 'header:user-scripts',
        headerAttrs: {
            subtitle: 'Your own automation, written in the TTV DSL.',
        },
        save: true,
        sections: [
            userScripts,
        ],
        // The installed scripts and the permissions approved for them (kept by the list above, not a control)
        stored: ['user_scripts', 'user_scripts__consent'],
    },
    {
        header: 'Developer Features',
        tr: 'header:developer-features',
        headerAttrs: {
            subtitle: 'These are advanced features that should be used for testing.',
        },
        attrs: {
            id: ':settings--developer',
            danger: '',
        },
        save: true,
        sections: [
            displayConsoleMessages51,
            displayStatistics52,
            experimentalFeatures53,
            extraKeyboardShortcuts54,
            lowDataUsage55,
            useFineDetails56,
            automaticTabReloads57,
            showDefaultValues58,
        ],
    },
    {
        header: 'Experimental Features',
        tr: 'header:experimental-features',
        headerAttrs: {
            subtitle: 'These are experimental features that may produce errors.',
        },
        attrs: {
            id: ':settings--experimental',
            caution: '',
        },
        save: true,
        sections: [
            autoFocus59,
            convertEmotes60,
            softUnban61,
        ],
    },
    {
        header: 'About TTV Tools',
        tr: 'about',
        footer: `<footer tr-id='footer'>
            <div>
                <h3>This extension is in no way affiliated with, nor endorsed by:</h3>
                <ul>
                    <li>
                        <a href='https://www.amazon.com/gp/help/customer/display.html?nodeId=G202075070' target='_blank'>Amazon.com, Inc.</a>
                        <ul>
                            <li><a href='https://twitch.tv/legal' target='_blank'>Twitch Interactive, Inc.</a></li>
                        </ul>
                    </li>
                    <li><a href='https://blerp.com/legal' target='_blank'>Blerp, Inc.</a></li>
                    <li><a href='https://policies.google.com/terms' target='_blank'>Google, LLC</a></li>
                    <li><a href='https://streamelements.com/terms' target='_blank'>Live Momentum, Ltd.</a></li>
                    <li>
                        <a href='https://microsoft.com/legal/terms-of-use' target='_blank'>Microsoft Co.</a>
                        <ul>
                            <li><a href='https://github.com/site-policy/github-terms' target='_blank'>GitHub, Inc.</a></li>
                        </ul>
                    </li>
                    <li><a href='https://nightdev.com/terms' target='_blank'>NightDev, LLC</a></li>
                    <li><a href='https://nintendo.com/terms-of-use' target='_blank'>Nintendo Co., Ltd.</a></li>
                    <li><a href='https://electronics.sony.com/terms-conditions' target='_blank'>Sony Group Co.</a></li>
                    <li><a href='https://streamloots.com/terms-and-conditions' target='_blank'>Streamloots</a></li>
                    <li><a href='https://valvesoftware.com/legal' target='_blank'>Valve Co.</a></li>
                    <li><em>...either aforementioned party's partners, affiliates, or subsidiaries.</em></li>
                </ul>
            </div>
        </footer>`,
        stored: ['clientID', 'oauthToken'],
        sections: [
            version62,
            dataUsage63,
            support64,
            language65,
        ],
    },
];
