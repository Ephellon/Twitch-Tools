/*** /plugins/customization/block-banners.js
 * Customization.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let UNWANTED_BANNER_AD_SELECTOR, LAST_ELEMENT, EMPTY_ELEMENT_SUBSTITUTE;

plugin({
    id: 'block_banners',
    timer: 2_500,
    register: false,          // setup() starts the job itself, when it should

    init() {
        UNWANTED_BANNER_AD_SELECTOR = new nanoid(21, nanoid.LOWERCASE_SAFE).value;
        LAST_ELEMENT = Symbol('last-selector-slot');
        EMPTY_ELEMENT_SUBSTITUTE = { dataset: {} };
    },

    handler: () => {
        /** Syntax (CSS-superset) — Comments are not allowed in the actual syntax. Each line represents a banner query.
         * [class*="turbo"i]                // Find all `[class*="turbo"i]`
         * [class*="subtember"i] < 1        // Find all `[class*="subtember"i]`, then travel up one (1) generation (elements' "parent")
         * [class*="subtember"i] <          // Same as previous (elements' "parent")
         * [style*="asset"i] < button < 3   // Find all `[style*="asset"i]`, travel up to closest `button`, then travel up three more (3) generations (buttons' "great-grand-parent")
         */
        // TTV Tools — Banner Rules
        fetchURL.fromDisk(`https://ephellon.github.io/ttv-tools/ad-banners.css`, { hoursUntilEntryExpires: 24 }).then(r => r.text()).then(bannerSelectors => {
            bannerSelectors = bannerSelectors.split(/[\r\n]+/).filter(s => s.trim().length).map(selector => {
                const syntaxes = [];
                const path = [''];
                let curr = '';
                let esc = false;
                const detect = char => {
                    const { length } = syntaxes;

                    if(char == '(') {
                        curr = char;
                        syntaxes.push('operator');
                    } else if(char == '[') {
                        curr = char;
                        syntaxes.push('attribute');
                    } else if(char == '"') {
                        syntaxes.push('string:2')
                    } else if(char == "'") {
                        syntaxes.push('string:1')
                    } else if(char == '<') {
                        path.push('');
                        syntaxes.push('closest');
                    }

                    return length < syntaxes.length;
                };

                constructing: for(const char of selector)
                    switch(syntaxes.at(-1)) {
                        case 'operator': {
                            curr += char;

                            if(detect(char)) {
                                continue constructing
                            } else if(char == ')') {
                                path[path.length - 1] = curr;

                                curr = '';
                                syntaxes.pop();
                            }
                        } break;

                        case 'attribute': {
                            curr += char;

                            if(detect(char)) {
                                continue constructing
                            } else if(char == ']') {
                                path[path.length - 1] = curr;

                                curr = '';
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
                    } // :constructing | switch syntaxes.at(-1)

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
                        return elements.map(el => el.closest(v)).filter(defined)
                    } else {
                        for(;c-- > 0;)
                            elements = elements.map(el => el.parentElement).filter(defined);

                        return elements;
                    }
                }, []).isolate().forEach(el => {
                    if(parseBool(el.dataset?.[UNWANTED_BANNER_AD_SELECTOR]))
                        return;

                    $remark("Blocking...", el);

                    el.dataset[UNWANTED_BANNER_AD_SELECTOR] = true;
                });
            });

            AddCustomCSSBlock('Remove Banner Ads', `[data-${ UNWANTED_BANNER_AD_SELECTOR }="true"i] {display:none!important}`);
        });
    },

    unhandler: () => {
        RemoveCustomCSSBlock('Remove Banner Ads');
    },

    setup() {
        const listener = DelayJob('block_banners');

        $.body.addEventListener('mouseup', listener);

        listener();
    },
});
