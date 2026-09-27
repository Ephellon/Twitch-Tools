/*** /plugins/chat/auto-claim-bonuses.js
 * Auto-claim Channel Points.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.auto_claim_bonuses',
    job: 'auto_claim_bonuses',
    timer: 2_500,

    handler: (context) => {
        new context.StopWatch('auto_claim_bonuses');

        let ChannelPoints = (null
                ?? $('[class*="bonus"i]')?.closest('button')
                ?? $('[data-test-selector*="points"i][data-test-selector*="summary"i] button[class*="success"i]')
                ?? $('[data-test-selector*="points"i][data-test-selector*="summary"i] button:is([class*="destruct"i], [class*="error"i])')
                ?? $('[class*="points"i] button [class*="bonus"i]')?.closest('button')
            ),
            Enabled = (Settings.auto_claim_bonuses && parseBool($('#tt-auto-claim-bonuses')?.getAttribute('tt-auto-claim-enabled') ?? $('[data-a-page-loaded-name="PopoutChatPage"i]')));

        if(Enabled && defined(ChannelPoints)) {
            ChannelPoints.click();

            let playedAnimation;

            when.defined(() => $('.pulse-animation [class*="channel"i][class*="points"i]')).then(ok => playedAnimation = ok);

            wait(10_000).then(() => top.TWITCH_INTEGRITY_FAIL = !playedAnimation);
        }

        // Draw the toggle-button...
        try {
            let BonusChannelPointsSVG = Glyphs.modify('bonuschannelpoints', {
                id: 'tt-auto-claim-indicator',
                height: '2rem',
                width: '2rem',
                style: `vertical-align: middle; margin-left: 0.5rem; background-color: #00ad96; fill: #000; border: 0; border-radius: .25rem;`
            });

            let parent = $('div:not(#tt-auto-claim-bonuses) > [data-test-selector*="points"i][data-test-selector*="summary"i] [role="tooltip"i]'),
                tooltip = $('#tt-auto-claim-bonuses [role="tooltip"i]');

            if(tooltip && parent)
                tooltip.innerText = parent.innerText;

            // Actual jobbing
            let button = $('#tt-auto-claim-bonuses');

            if(nullish(button)) {
                let parent    = $('[data-test-selector*="points"i][data-test-selector*="summary"i]'),
                    heading   = $.all('.top-nav__menu > div').pop(),
                    container = furnish('div');

                if(nullish(parent) || nullish(heading)) {
                    // wait(5000).then(Chat__Initialize);
                    return context.StopWatch.stop('auto_claim_bonuses');
                }

                container.innerHTML = parent.outerHTML;
                container.id = 'tt-auto-claim-bonuses';
                container.classList.add('community-points-summary', 'tt-align-items-center', 'tt-flex', 'tt-full-height');
                container.modStyle(`animation:1s fade-in 1;`);

                heading.insertBefore(container, heading.children[1]);

                $('#tt-auto-claim-bonuses [data-test-selector*="points"i][data-test-selector*="summary"i] > div:last-child:not(:first-child)')?.remove();

                let textContainer = $('[data-test-selector*="balance"i] *:not(:empty)', container);

                if(defined(textContainer)) {
                    let { parentElement } = textContainer;
                    parentElement.removeAttribute('data-test-selector');
                } else {
                    return context.StopWatch.stop('auto_claim_bonuses');
                }

                button = {
                    container,
                    enabled: true,
                    text: textContainer,
                    icon: $('svg, img', container),
                    get offset() { return getOffset(container) },
                    tooltip: new Tooltip(container, Glyphs.modify('channelpoints', { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${ (320 * context.CHANNEL_POINTS_MULTIPLIER) | 0 } / h`, { top: -10 }),
                };

                // button.tooltip.id = new UUID().toString();
                button.text.innerHTML = '+' + BonusChannelPointsSVG;
                button.container.setAttribute('tt-auto-claim-enabled', true);

                button.icon ??= $('svg, img', container);

                if($.nullish('.channel-points-icon', container)) {
                    button.icon.outerHTML = Glyphs.channelpoints;
                    button.icon = $('svg, img', container);
                }

                button.icon.modStyle(`height: 2rem; width: 2rem; margin-top: .25rem; margin-left: .25rem;`);

                when.defined(container => $('[data-test-selector*="balance"i][data-test-selector*="string"i]', container), 30, container).then(text => text.remove());
                when.defined(container => ($.all('svg, img', container).length > 2? container: null), 30, container).then(container => {
                    let oldIcon = $('svg, img', container);
                    let newIcon = $.last('svg, img, .tw-img, .tw-svg', container);

                    newIcon.closest('*:not(:first-of-type):not(:first-child)')?.remove();

                    oldIcon.replaceWith(newIcon);
                });
            } else {
                let container = button,
                    textContainer = $('[data-test-selector*="balance"i] *:not(:empty)', container);

                button = {
                    container,
                    enabled: true,
                    text: textContainer,
                    tooltip: Tooltip.get(container),
                    icon: $('svg, img', container),
                    get offset() { return getOffset(container) },
                };
            }

            button.container.onclick ??= event => {
                let enabled = button.container.getAttribute('tt-auto-claim-enabled').unlike('true');

                button.container.setAttribute('tt-auto-claim-enabled', enabled);
                button.text.innerHTML = ['','+'][+enabled] + BonusChannelPointsSVG;
                button.tooltip.innerHTML = Glyphs.modify('channelpoints', { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${ ((120 + (200 * +enabled)) * context.CHANNEL_POINTS_MULTIPLIER) | 0 } / h`;
            };

            top.onintegritychange = okay =>
                $('#tt-auto-claim-indicator')?.modStyle(`background-color:${ ['#ff4f4d','#00ad96'][+okay] }`);

            top.onintegritychange = okay =>
                button.tooltip.innerHTML = Glyphs.modify('channelpoints', { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${ ((120 + (200 * +okay)) * context.CHANNEL_POINTS_MULTIPLIER) | 0 } / h`;

            button.container.onmouseenter ??= event => {
                button.icon?.setAttribute('hover', true);
            };

            button.container.onmouseleave ??= event => {
                button.icon?.setAttribute('hover', false);
            };

            // Make sure the button is all the way to the left
            for(let max = 10; max > 0 && defined(button.container.previousElementSibling); --max)
                button.container.parentElement.insertBefore(button.container, button.container.previousElementSibling);

            // Adjust the text size
            button.text?.classList?.add('text');

            // Make the tooltip easier to manage
            button.tooltip?.classList?.add('img-container');

            // Clean up leftovers from Twitch animations
            let junk = $(`#tt-auto-claim-bonuses ${ '> :last-child'.repeat(3) }`);
            junk && (junk.innerHTML = '');

            // Set the Channel Point icon's color & positioning
            $('svg:not([id])', button.container)
                ?.modStyle(`fill:var(--channel-color-${ ANTITHEME })`);

            $('svg:not([id])', button.container)
                ?.closest('div:not([class*="channel"i])')
                ?.modStyle('margin-top:0.1em');
        } catch(error) {
            $error(error);
            addReport({ 'Failed-to-load-Auto-Claim-Bonuses': error });
        }

        context.StopWatch.stop('auto_claim_bonuses');
    },

    unhandler: () => {
        $('#tt-auto-claim-bonuses')?.remove();
    },
});
