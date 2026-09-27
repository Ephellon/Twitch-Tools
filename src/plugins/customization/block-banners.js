/*** /plugins/customization/block-banners.js
 * Customization.
 * Moved verbatim from tools.js (Initialize) in Phase 4; it wires its own jobs and settings.
 */

import { plugin } from '../../lib/plugins.js';

plugin({
    id: 'block_banners',

    async install() {
        /***
         *      ____  _            _      ____
         *     |  _ \| |          | |    |  _ \
         *     | |_) | | ___   ___| | __ | |_) | __ _ _ __  _ __   ___ _ __ ___
         *     |  _ <| |/ _ \ / __| |/ / |  _ < / _` | '_ \| '_ \ / _ \ '__/ __|
         *     | |_) | | (_) | (__|   <  | |_) | (_| | | | | | | |  __/ |  \__ \
         *     |____/|_|\___/ \___|_|\_\ |____/ \__,_|_| |_|_| |_|\___|_|  |___/
         *
         *
         */
        const UNWANTED_BANNER_AD_SELECTOR = new nanoid(21, nanoid.LOWERCASE_SAFE).value;
        const LAST_ELEMENT = Symbol("last-selector-slot");
        const EMPTY_ELEMENT_SUBSTITUTE = ({ dataset: {} });

        Handlers.block_banners = () => {
            /** Syntax (CSS-superset) — Comments are not allowed in the actual syntax. Each line represents a banner query.
             * [class*="turbo"i]                // Find all `[class*="turbo"i]`
             * [class*="subtember"i] < 1        // Find all `[class*="subtember"i]`, then travel up one (1) generation (elements' "parent")
             * [class*="subtember"i] <          // Same as previous (elements' "parent")
             * [style*="asset"i] < button < 3   // Find all `[style*="asset"i]`, travel up to closest `button`, then travel up three more (3) generations (buttons' "great-grand-parent")
             */
            // TTV Tools — Banner Rules
            fetchURL.fromDisk(`https://ephellon.github.io/ttv-tools/ad-banners.css`, { hoursUntilEntryExpires: 24 }).then(r => r.text()).then(bannerSelectors => {
                bannerSelectors = bannerSelectors.split(/[\r\n]+/).filter(s => s.trim().length).map(selector => {
                    let syntaxes = [];
                    let path = [''];
                    let curr = "";
                    let esc = false;
                    let detect = char => {
                        let { length } = syntaxes;

                        if(char == '(') {
                            curr = char;
                            syntaxes.push('operator');
                        } else if(char == '[') {
                            curr = char;
                            syntaxes.push('attribute');
                        } else if(char == '"') {
                            syntaxes.push('string:2');
                        } else if(char == "'") {
                            syntaxes.push('string:1');
                        } else if(char == '<') {
                            path.push('');
                            syntaxes.push('closest');
                        }

                        return length < syntaxes.length;
                    };

                    constructing: for(let char of selector)
                        switch(syntaxes.at(-1)) {
                            case 'operator': {
                                curr += char;

                                if(detect(char))
                                    continue constructing;
                                else if(char == ')') {
                                    path[path.length - 1] = curr;

                                    curr = "";
                                    syntaxes.pop();
                                }
                            } break;

                            case 'attribute': {
                                curr += char;

                                if(detect(char))
                                    continue constructing;
                                else if(char == ']') {
                                    path[path.length - 1] = curr;

                                    curr = "";
                                    syntaxes.pop();
                                }
                            } break;

                            case 'string:2': {
                                curr += char;

                                if(char == '\\')
                                    esc = !esc;
                                else if(esc)
                                    esc = !esc;
                                else if(!esc && char == '"')
                                    syntaxes.pop();
                            } break;

                            case 'string:1': {
                                curr += char;

                                if(char == '\\')
                                    esc = !esc;
                                else if(esc)
                                    esc = !esc;
                                else if(!esc && char == "'")
                                    syntaxes.pop();
                            } break;

                            case 'closest': {
                                if(detect(char))
                                    continue constructing;
                                else
                                    path[path.length - 1] += char;
                            } break;

                            default: {
                                detect(char);
                            } break;
                        }

                        path.push(LAST_ELEMENT);

                        return path.reduce((elements, v, i, a) => {
                            if(v === LAST_ELEMENT)
                                return elements;
                            else if(v.trim() === '')
                                return [EMPTY_ELEMENT_SUBSTITUTE];
                            else if(i === 0)
                                return $.all(v);

                            let c = parseInt(v.trim() || '1');

                            if(Number.isNaN(c)) {
                                return elements.map(el => el.closest(v)).filter(defined);
                            } else {
                                for(;c-->0;)
                                    elements = elements.map(el => el.parentElement).filter(defined);

                                return elements;
                            }
                        }, []).isolate().forEach(el => {
                            if(parseBool(el.dataset?.[UNWANTED_BANNER_AD_SELECTOR]))
                                return;

                            $remark('Blocking...', el);

                            el.dataset[UNWANTED_BANNER_AD_SELECTOR] = true;
                        });
                });

                AddCustomCSSBlock('Remove Banner Ads', `[data-${ UNWANTED_BANNER_AD_SELECTOR }="true"i] {display:none!important}`);
            });
        };
        Timers.block_banners = 2_500;

        Unhandlers.block_banners = () => {
            RemoveCustomCSSBlock('Remove Banner Ads');
        };

        __BlockBanners__:
        if(parseBool(Settings.block_banners)) {
            let listener = DelayJob('block_banners');

            $.body.addEventListener('mouseup', listener);

            listener();
        }
    },
});
