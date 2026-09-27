/*** /plugins/chat/convert-bits.js
 * Convert Bits.
 * Moved from chat.js (Chat__Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'chat.convert_bits',
    job: 'convert_bits',
    timer: 1000,

    handler: (context) => {
        new context.StopWatch('convert_bits');

        let dropdown = $('[class*="bits-buy"i]'),
            bits_counter = $.all('[class*="bits-count"i]:not([tt-tusda])'),
            bits_cheer = $.all('[class*="cheer-amount"i]:not([tt-tusda])'),
            hype_trains = $.all('[class*="community-highlight-stack"i] p:not([tt-tusda])');

        let bits_num_regexp = /([\d,]+)(?: +bits)?/i,
            bits_alp_regexp = /([\d,]+) +bits/i;

        let _0 = /(\D\d)$/;

        if(defined(dropdown))
            $.all('h5:not([tt-tusda])', dropdown).map(header => {
                let bits = parseInt(header.textContent.replace(/\D+/g, '')),
                    usd;

                usd = (bits * .01).toFixed(2);

                header.append(furnish.var(` ($${ comify(usd).replace(_0, '$10') })`));

                header.setAttribute('tt-tusda', usd);
            });

        for(let counter of bits_counter) {
            let { innerHTML } = counter;

            if(bits_alp_regexp.test(innerHTML))
                counter.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    counter.setAttribute('tt-tusda', usd);

                    return `${ $0 } ${ furnish.var(`($${ comify(usd).replace(_0, '$10') })`).outerHTML }`;
                });
        }

        for(let cheer of bits_cheer) {
            let { innerHTML } = cheer;

            if(bits_num_regexp.test(innerHTML))
                cheer.innerHTML = innerHTML.replace(bits_num_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    cheer.setAttribute('tt-tusda', usd);

                    return `${ $0 } ${ furnish.var(`($${ comify(usd).replace(_0, '$10') })`).outerHTML }`;
                });
        }

        for(let train of hype_trains) {
            let { innerHTML } = train;

            if(bits_alp_regexp.test(innerHTML))
                train.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
                    let bits = parseInt($1.replace(/\D+/g, '')),
                        usd;

                    usd = (bits * .01).toFixed(2);

                    train.setAttribute('tt-tusda', usd);

                    return `${ $0 } ${ furnish.var(`($${ comify(usd).replace(_0, '$10') })`).outerHTML }`;
                });
        }

        context.StopWatch.stop('convert_bits');
    },

    setup() {
        $remark("Adding Bit converter...");
    },
});
