/*** /dsl/highlight.js - Colour spans for an editor, covering every character, never throwing
 *   _    _  _____  _____  _    _  _       _____  _____  _    _  _______            _   _____
 *  | |  | ||_   _|/ ____|| |  | || |     |_   _|/ ____|| |  | ||__   __|          | | / ____|
 *  | |__| |  | | | |  __ | |__| || |       | | | |  __ | |__| |   | |             | || (___
 *  |  __  |  | | | | |_ ||  __  || |       | | | | |_ ||  __  |   | |         _   | | \___ \
 *  | |  | | _| |_| |__| || |  | || |____  _| |_| |__| || |  | |   | |    _   | |__| | ____) |
 *  |_|  |_||_____|\_____||_|  |_||______||_____|\_____||_|  |_|   |_|   (_)   \____/ |_____/
 */

/** @file `TTV_DSL.highlight(source)`: the script cut into `{ type, text, start, end }` spans
 * that cover every character in order, for an editor to colour. It uses the real tokenizer,
 * so it never disagrees with the language about where a token starts — and it never throws:
 * a lexical fault marks the rest of its line `invalid` and scanning resumes on the next.
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

globalThis.TTV_DSL ??= {};

if (typeof require === 'function' && typeof module === 'object') {
    require('./errors.js');
    require('./tokens.js');
    require('./tokenizer.js');
}

(() => {
    const { TokenType, KEYWORDS, PRESENCE_WORDS, THIS_ALIASES } = globalThis.TTV_DSL.tokens;
    const { Tokenizer } = globalThis.TTV_DSL.tokenizer;

    /** Every type a span can have. Fixed: an editor's stylesheet may rely on it. */
    const HIGHLIGHT_TYPES = Object.freeze([
        'keyword', 'verb', 'string', 'template', 'number', 'duration', 'selector', 'sigil',
        'operator', 'comment', 'identifier', 'punctuation', 'whitespace', 'invalid',
    ]);

    /** Token types spelled as words that are keywords. Their symbol twins (`<|`, `|`, `~`)
     * share the type, so the lexeme decides. */
    const KEYWORD_TYPES = new Set(Object.values(KEYWORDS));

    /** Tokens with no characters of their own — structure, not text. */
    const STRUCTURAL = new Set([TokenType.NEWLINE, TokenType.INDENT, TokenType.DEDENT, TokenType.EOF]);

    const OPERATORS = new Set([
        TokenType.ARROW_LOCAL, TokenType.ARROW_PARENT, TokenType.EXACT, TokenType.PERCENT,
        TokenType.FORMAT, TokenType.ARITH, TokenType.PIPE, TokenType.WHERE, TokenType.MINUS,
        TokenType.RANGE_EXCLUSIVE, TokenType.RANGE_INCLUSIVE,
    ]);

    const PUNCTUATION = new Set([
        TokenType.LPAREN, TokenType.RPAREN, TokenType.COMMA, TokenType.COLON, TokenType.SEMICOLON,
        TokenType.DESCRIBE,
    ]);

    /** How many leading characters of a sigilled token are the sigil. */
    const SIGIL_LENGTH = {
        [TokenType.SELECTOR_PROP]: 1,       // #prop
        [TokenType.SELECTOR_CHANNEL]: 1,    // /name
        [TokenType.SELECTOR_USER]: 1,       // @user
        [TokenType.SELECTOR_CONTEXT]: 1,    // .prop
        [TokenType.JS_PATH]: 1,             // &path
        [TokenType.PERMISSION]: 1,          // +read:html.*
    };

    /**
     * Cuts a stretch the tokenizer skipped — whitespace and comments — into spans.
     * @param {String} source
     * @param {Number} from
     * @param {Number} to
     * @param {Array<Object>} spans
     */
    let gap = (source, from, to, spans) => {
        let at = from;

        while (at < to) {
            let rest = source.slice(at, to),
                match = (/^\s+/.exec(rest) ?? /^\/\/[^\n]*/.exec(rest) ?? /^\/\*[\s\S]*?(?:\*\/|$)/.exec(rest)),
                type = (match? (/^\s/.test(match[0])? 'whitespace': 'comment'): 'invalid'),
                text = (match? match[0]: rest[0]);

            push(spans, type, source, at, at + text.length);
            at += text.length;
        }
    };

    /** Appends a span, merging it into the previous one when the type repeats. */
    let push = (spans, type, source, start, end) => {
        if (end <= start)
            return;

        let last = spans[spans.length - 1];

        if (last && last.type === type && last.end === start) {
            last.end = end;
            last.text = source.slice(last.start, end);

            return;
        }

        spans.push({ type, text: source.slice(start, end), start, end });
    };

    /** The span type for a plain (non-template, non-sigil) token. */
    let typeOf = (token, verbs, lineStart) => {
        if (KEYWORD_TYPES.has(token.type) && /^[a-z]/.test(token.lexeme ?? ''))
            return 'keyword';

        switch (token.type) {
            case TokenType.STRING:
                return 'string';

            case TokenType.NUMBER:
            case TokenType.ORDINAL:
                return 'number';

            case TokenType.DURATION:
                return 'duration';

            case TokenType.WILDCARD:
                return 'keyword';

            case TokenType.COUNTER:
            case TokenType.SELECTOR_SELF:
                return 'sigil';

            case TokenType.SELECTOR_REALM:
            case TokenType.SELECTOR_BADGE:
                return 'selector';

            case TokenType.IDENT:
                if (token.value in PRESENCE_WORDS || THIS_ALIASES.has(token.value))
                    return 'keyword';

                // An ALL-CAPS word is a verb where it starts a line, and anywhere when the
                // script `define`s it; elsewhere it is a host constant, read like a name.
                if (token.isUpper && (lineStart || verbs.has(token.value)))
                    return 'verb';

                return 'identifier';

            default:
                break;
        }

        if (OPERATORS.has(token.type))
            return 'operator';

        if (PUNCTUATION.has(token.type))
            return 'punctuation';

        return 'invalid';
    };

    /**
     * Spans for one stretch of source that should scan on its own.
     * @param {String} source - the whole script
     * @param {Number} from
     * @param {Number} to
     * @param {Set<String>} verbs - ALL-CAPS names the script defines
     * @param {Array<Object>} spans
     * @param {Boolean} [lineStart = true] - false inside `${ }`, which starts mid-line
     */
    let scan = (source, from, to, verbs, spans, lineStart = true) => {
        let text = source.slice(from, to),
            tokens = tokenizeLeniently(text),
            fault = (tokens instanceof Error? tokens: null);

        if (fault) {
            let at = from + Math.max(0, Math.min(fault.loc?.start ?? 0, text.length)),
                lineEnd = source.indexOf('\n', at),
                stop = Math.min(to, (lineEnd < 0? to: lineEnd));

            // What scanned before the fault is still good.
            if (at > from)
                scan(source, from, at, verbs, spans, lineStart);

            let bad = Math.min(to, Math.max(stop, at + 1));

            push(spans, 'invalid', source, at, bad);

            if (bad < to)
                scan(source, bad, to, verbs, spans, true);

            return;
        }

        let at = from;

        for (let token of tokens) {
            if (STRUCTURAL.has(token.type)) {
                if (TokenType.NEWLINE === token.type)
                    lineStart = true;

                continue;
            }

            let start = from + token.loc.start,
                end = from + token.loc.end;

            gap(source, at, start, spans);

            if (TokenType.TEMPLATE === token.type)
                template(source, start, end, token, verbs, spans);
            else if (token.type in SIGIL_LENGTH) {
                push(spans, 'sigil', source, start, start + SIGIL_LENGTH[token.type]);
                push(spans, 'selector', source, start + SIGIL_LENGTH[token.type], end);
            } else
                push(spans, typeOf(token, verbs, lineStart), source, start, end);

            lineStart = false;
            at = end;
        }

        gap(source, at, to, spans);
    };

    /** How many missing `)` a half-typed script may be lent before giving up. */
    const MAX_BORROWED_PARENS = 8;

    /**
     * Tokenizes a stretch, tolerating the one fault that has no place to point at: brackets
     * still open at the end of the text (`await (`, `calc(1 + `) — routine mid-edit. Those
     * are closed virtually and anything past the real text is dropped, so every real
     * character keeps its proper colour.
     * @param {String} text
     * @return {Array<Object>|Error} the tokens, or the fault that stopped them
     */
    let tokenizeLeniently = (text) => {
        let suffix = '';

        for (let attempt = 0; attempt <= MAX_BORROWED_PARENS; ++attempt) {
            try {
                return new Tokenizer(text + suffix, { fragment: true }).tokenize()
                    .filter(token => token.loc.start < text.length || STRUCTURAL.has(token.type))
                    .map(token => (token.loc.end > text.length? Object.assign({}, token, { loc: Object.assign({}, token.loc, { end: text.length }) }): token));
            } catch (error) {
                if (!/^Unclosed "\("/.test(error?.message ?? '') || (error.loc?.start ?? 0) < text.length)
                    return error;

                suffix += ')';
            }
        }

        return new Error('too many open brackets');
    };

    /** A template: its text as `template`, each `${ }` as punctuation around code. */
    let template = (source, start, end, token, verbs, spans) => {
        let at = start,
            offset = start - token.loc.start;

        for (let { source: inner, offset: open } of token.value.expressions) {
            let codeStart = offset + open,
                codeEnd = codeStart + inner.length;

            push(spans, 'template', source, at, codeStart - 2);
            push(spans, 'punctuation', source, codeStart - 2, codeStart);
            scan(source, codeStart, codeEnd, verbs, spans, false);
            push(spans, 'punctuation', source, codeEnd, codeEnd + 1);
            at = codeEnd + 1;
        }

        push(spans, 'template', source, at, end);
    };

    /**
     * Cuts a script into colour spans.
     * @param {String} source
     * @return {Array<{ type: String, text: String, start: Number, end: Number }>} contiguous,
     *   in order, covering every character; `start`/`end` are 0-based offsets, `end` exclusive
     */
    let highlight = (source) => {
        let text = String(source ?? ''),
            spans = [],
            verbs = new Set([...text.matchAll(/\bdefine\s+([A-Z][A-Z0-9_]*)/g)].map(match => match[1]));

        try {
            scan(text, 0, text.length, verbs, spans);
        } catch {
            // A bug here must never reach an editor as an exception: fall back to one plain
            // span, still covering everything.
            spans = (text.length? [{ type: 'invalid', text, start: 0, end: text.length }]: []);
        }

        return spans;
    };

    globalThis.TTV_DSL.highlighter = { highlight, HIGHLIGHT_TYPES };
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
