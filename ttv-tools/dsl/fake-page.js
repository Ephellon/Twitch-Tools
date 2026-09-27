/*** /dsl/fake-page.js - A stand-in page for the HTML host calls, for tests and the playground
 *   ______      _  __ ______   _____             _____  ______             _   _____
 *  |  ____| /\ | |/ /|  ____| |  __ \    /\    / ____||  ____|           | | / ____|
 *  | |__   /  \| ' / | |__    | |__) |  /  \  | |  __ | |__              | || (___
 *  |  __| / /\ \  <  |  __|   |  ___/  / /\ \ | | |_ ||  __|         _   | | \___ \
 *  | |   / ____ \ . \| |____  | |     / ____ \| |__| || |____   _   | |__| | ____) |
 *  |_|  /_/    \_\_|\_\______||_|    /_/    \_\\_____||______| (_)   \____/ |_____/
 */

/** @file A small, dependency-free model of a page, exposing the `&html.*` host calls that
 * `HOST.md` specifies — so the `read:html.*`, `write:html.*` and `parse:html.*` permissions
 * can be exercised before a real host exists.
 *
 * It is **not** a browser. The HTML parser is tolerant but small (elements, attributes,
 * text, comments, void elements, the five common entities), and selectors support tags,
 * `#id`, `.class`, `[attr]`, `[attr=value]` and the descendant combinator. The real host
 * should implement the same call signatures over the live DOM and `DOMParser`.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

(() => {
    /** Elements that never have children or a closing tag. */
    const VOID_ELEMENTS = Object.freeze(new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']));

    /** One lexical piece of HTML: comment | closing tag | opening tag | text. */
    const HTML_TOKEN = /<!--[\s\S]*?-->|<\/([A-Za-z][\w-]*)\s*>|<([A-Za-z][\w-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</g;

    /** One attribute inside an opening tag. */
    const HTML_ATTRIBUTE = /([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

    /** One compound selector: `tag#id.class[attr=value]`. */
    const SELECTOR_PART = /^([A-Za-z][\w-]*|\*)?((?:#[\w-]+|\.[\w-]+|\[[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\]]*))?\])*)$/;

    /** Which permission each `&html.*` call needs. The real host must use the same map. */
    const HTML_PERMISSIONS = Object.freeze({
        'html.text': 'read:html.text',
        'html.attr': 'read:html.attributes',
        'html.count': 'read:html.structure',
        'html.exists': 'read:html.structure',
        'html.setText': 'write:html.text',
        'html.setAttr': 'write:html.attributes',
        'html.parse': 'parse:html.structure',
        'html.parseText': 'parse:html.text',
        'html.parseAttrs': 'parse:html.attributes',
    });

    /** @param {String} text @return {String} */
    let decode = (text) => text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/&amp;/g, '&');

    /** Parses HTML into `{ type: 'element', tag, attrs, children }` / `{ type: 'text', text }`
     * nodes under one root element. Unclosed tags close at their parent's end; a stray
     * closing tag is ignored.
     * @param {String} source
     * @return {Object} the root
     */
    let parseHtml = (source) => {
        let root = { type: 'element', tag: '#root', attrs: {}, children: [] },
            stack = [root];

        for (let match of String(source ?? '').matchAll(HTML_TOKEN)) {
            let [whole, closing, opening, attributes, selfClosing] = match,
                top = stack[stack.length - 1];

            if (whole.startsWith('<!--'))
                continue;

            if (closing) {
                let tag = closing.toLowerCase(),
                    at = stack.map(entry => entry.tag).lastIndexOf(tag);

                if (at > 0)
                    stack.length = at;

                continue;
            }

            if (opening) {
                let element = { type: 'element', tag: opening.toLowerCase(), attrs: {}, children: [] };

                for (let [, name, double, single, bare] of (attributes ?? '').matchAll(HTML_ATTRIBUTE))
                    element.attrs[name.toLowerCase()] = decode(double ?? single ?? bare ?? '');

                top.children.push(element);

                if (!selfClosing && !VOID_ELEMENTS.has(element.tag))
                    stack.push(element);

                continue;
            }

            top.children.push({ type: 'text', text: decode(whole) });
        }

        return root;
    };

    /** @param {Object} node @return {String} all descendant text, in order */
    let textOf = (node) => ('text' === node.type? node.text: node.children.map(textOf).join(''));

    /** A plain, serializable copy: elements become `{ tag, attributes, children }` and text
     * nodes become strings. This is the shape `&html.parse` returns. */
    let serialize = (node) => ('text' === node.type
        ? node.text
        : { tag: node.tag, attributes: Object.assign({}, node.attrs), children: node.children.map(serialize) });

    /** @param {String} text @return {String} */
    let encode = (text) => String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    /** Renders a node back to markup — for showing what a script did to the page.
     * @param {Object} node
     * @return {String}
     */
    let toHtml = (node) => {
        if ('text' === node.type)
            return encode(node.text);

        let inner = node.children.map(toHtml).join('');

        if ('#root' === node.tag)
            return inner;

        let attributes = Object.entries(node.attrs).map(([name, value]) => ` ${ name }="${ encode(value) }"`).join('');

        return (VOID_ELEMENTS.has(node.tag)
            ? `<${ node.tag }${ attributes }>`
            : `<${ node.tag }${ attributes }>${ inner }</${ node.tag }>`);
    };

    /** Compiles one compound selector into a predicate over an element.
     * @param {String} part
     * @return {Function}
     */
    let compilePart = (part) => {
        let match = SELECTOR_PART.exec(part);

        if (!match)
            throw new Error(`Unsupported selector ${ JSON.stringify(part) }`);

        let [, tag, rest] = match,
            tests = [];

        if (tag && '*' !== tag)
            tests.push(element => element.tag === tag.toLowerCase());

        for (let [piece] of rest.matchAll(/#[\w-]+|\.[\w-]+|\[[^\]]+\]/g)) {
            if ('#' === piece[0])
                tests.push(element => element.attrs.id === piece.slice(1));
            else if ('.' === piece[0])
                tests.push(element => (element.attrs.class ?? '').split(/\s+/).includes(piece.slice(1)));
            else {
                let [name, value] = piece.slice(1, -1).split('=');

                value = value?.replace(/^["']|["']$/g, '');
                tests.push(element => (name in element.attrs) && (undefined === value || element.attrs[name] === value));
            }
        }

        return element => tests.every(test => test(element));
    };

    /** Every element under `root` matching `selector`, in document order.
     * @param {Object} root
     * @param {String} selector - compound selectors separated by whitespace (descendant)
     * @return {Array<Object>}
     */
    let query = (root, selector) => {
        let parts = String(selector).trim().split(/\s+/).filter(Boolean).map(compilePart),
            found = [];

        if (!parts.length)
            return found;

        let visit = (node, ancestors) => {
            if ('element' !== node.type)
                return;

            if ('#root' !== node.tag && parts[parts.length - 1](node)) {
                // Walk the remaining parts right to left up the ancestor chain.
                let need = parts.length - 2;

                for (let index = ancestors.length - 1; index >= 0 && need >= 0; --index)
                    if (parts[need](ancestors[index]))
                        --need;

                if (need < 0)
                    found.push(node);
            }

            let chain = ('#root' === node.tag? ancestors: ancestors.concat([node]));

            for (let child of node.children)
                visit(child, chain);
        };

        visit(root, []);

        return found;
    };

    /** Builds a fake page.
     * @param {String} [markup] - the page's HTML
     * @return {{ root: Object, query: Function, bindings: Object, permissions: Object }}
     *   `bindings` and `permissions` drop straight into `createRuntime({ jsBindings,
     *   jsPermissions })`.
     */
    let createFakePage = (markup = '') => {
        let root = parseHtml(markup),
            first = (selector) => (query(root, selector)[0] ?? null);

        let html = {
            /** `read:html.text` — the text of the first match, or `""`. */
            text: (selector) => {
                let element = first(selector);

                return (element? textOf(element): '');
            },

            /** `read:html.attributes` — an attribute of the first match, or `""`. */
            attr: (selector, name) => (first(selector)?.attrs[String(name).toLowerCase()] ?? ''),

            /** `read:html.structure` — how many elements match. */
            count: (selector) => query(root, selector).length,

            /** `read:html.structure` — whether anything matches. */
            exists: (selector) => (query(root, selector).length > 0),

            /** `write:html.text` — replaces the text of every match. Returns how many changed. */
            setText: (selector, text) => {
                let elements = query(root, selector);

                for (let element of elements)
                    element.children = [{ type: 'text', text: String(text ?? '') }];

                return elements.length;
            },

            /** `write:html.attributes` — sets an attribute on every match. Returns how many. */
            setAttr: (selector, name, value) => {
                let elements = query(root, selector);

                for (let element of elements)
                    element.attrs[String(name).toLowerCase()] = String(value ?? '');

                return elements.length;
            },

            /** `parse:html.structure` — markup → a serializable tree (the root's children). */
            parse: (markup) => parseHtml(markup).children.map(serialize),

            /** `parse:html.text` — markup → its text, tags removed. */
            parseText: (markup) => textOf(parseHtml(markup)),

            /** `parse:html.attributes` — markup → the first element's attributes. */
            parseAttrs: (markup) => {
                let element = query(parseHtml(markup), '*')[0];

                return (element? Object.assign({}, element.attrs): {});
            },
        };

        return {
            root,
            query: (selector) => query(root, selector),
            toHtml: () => toHtml(root),
            bindings: { html },
            permissions: HTML_PERMISSIONS,
        };
    };

    globalThis.TTV_DSL.fakePage = { createFakePage, parseHtml, query, textOf, serialize, toHtml, HTML_PERMISSIONS };
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
