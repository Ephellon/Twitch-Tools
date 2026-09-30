/*** /plugins/customization/block-banners.js
 * Customization.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let UNWANTED_BANNER_AD_SELECTOR;

// Rules already reported as unusable, so the job (every 2.5s) warns once
const SKIPPED_RULES = new Set;

/**
 * Splits a banner rule on its `<` hops, leaving `<` inside brackets, parentheses or strings alone. Every other character
 * is kept as written (the old parser dropped tags, classes, ids and pseudo-classes, and broke on `:not(…)`).
 * @param {string} rule - One line of the banner list, e.g. `[style*="asset"i] < button < 3`
 * @returns {string[]} The selector, then each hop
 */
function splitHops(rule) {
    const parts = [''];
    let depth = 0, quote = null, escaped = false;

    for(const char of rule) {
        if(quote) {
            if(escaped)
                escaped = false;
            else if(char == '\\')
                escaped = true;
            else if(char == quote)
                quote = null;
        } else if(char == '"' || char == "'") {
            quote = char
        } else if(char == '[' || char == '(') {
            ++depth
        } else if(char == ']' || char == ')') {
            --depth
        } else if(char == '<' && depth == 0) {
            parts.push('');

            continue;
        }

        parts[parts.length - 1] += char;
    }

    return parts;
}

plugin({
    id: 'block_banners',
    timer: 2_500,
    register: false,          // setup() starts the job itself, when it should

    /**
     * Initializes constants and identifiers used for blocking banner ads.
     */
    init() {
        UNWANTED_BANNER_AD_SELECTOR = new nanoid(21, nanoid.LOWERCASE_SAFE).value;
    },

    /**
     * Loads and parses a remote list of banner ad selectors to identify and block unwanted banners.
     */
    handler: () => {
        /** Syntax (CSS-superset) — Comments are not allowed in the actual syntax. Each line represents a banner query.
         * [class*="turbo"i]                // Find all `[class*="turbo"i]`
         * [class*="subtember"i] < 1        // Find all `[class*="subtember"i]`, then travel up one (1) generation (elements' "parent")
         * [class*="subtember"i] <          // Same as previous (elements' "parent")
         * [style*="asset"i] < button < 3   // Find all `[style*="asset"i]`, travel up to closest `button`, then travel up three more (3) generations (buttons' "great-grand-parent")
         */
        // TTV Tools — Banner Rules
        fetchURL.fromDisk(`https://ephellon.github.io/ttv-tools/ad-banners.css`, { hoursUntilEntryExpires: 24 }).then(r => (r.ok ? r.text() : '')).then(bannerSelectors => {
            // Hide marked banners first: a rule that fails below must not keep the others from working
            AddCustomCSSBlock('Remove Banner Ads', `[data-${ UNWANTED_BANNER_AD_SELECTOR }="true"i] {display:none!important}`);

            for(const rule of bannerSelectors.split(/[\r\n]+/).filter(line => line.trim().length))
                try {
                    // A CSS selector, then `<` hops: a number (generations up; none means 1) or a selector (`closest`)
                    const [selector, ...hops] = splitHops(rule);

                    let elements = (selector.trim().length ? $.all(selector) : []);

                    for(const hop of hops) {
                        const generations = parseInt(hop.trim() || '1');

                        if(Number.isNaN(generations))
                            elements = elements.map(element => element.closest(hop.trim())).filter(defined);
                        else
                            for(let count = generations; count-- > 0;)
                                elements = elements.map(element => element.parentElement).filter(defined);
                    }

                    for(const element of elements.isolate()) {
                        if(parseBool(element.dataset?.[UNWANTED_BANNER_AD_SELECTOR]))
                            continue;

                        $remark("Blocking...", element);

                        element.dataset[UNWANTED_BANNER_AD_SELECTOR] = true;
                    }
                } catch(error) {
                    if(!SKIPPED_RULES.has(rule))
                        SKIPPED_RULES.add(rule), $warn(`Banner rule skipped: ${ rule } — ${ error?.message ?? error }`);
                }
        });
    },

    /**
     * Undoes banner blocking by removing the associated custom CSS block.
     */
    unhandler: () => {
        RemoveCustomCSSBlock('Remove Banner Ads');
    },

    /**
     * Sets up a delayed event listener on mouse-up to trigger banner blocking.
     */
    setup() {
        const listener = DelayJob('block_banners');

        $.body.addEventListener('mouseup', listener);

        listener();
    },
});
