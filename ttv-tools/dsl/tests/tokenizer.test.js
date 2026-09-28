/*** /dsl/tests/tokenizer.test.js - Scanner tests, weighted toward the ambiguous lexemes
 *
 * Every sigil in this language collides with at least one other. `/` starts both a comment
 * and a channel; `:` appears in durations, emotes and nothing else; `<` is either the pipe
 * operator or a badge; `.` is three different tokens; `-` is either unary minus or the sign
 * of an ordinal. These tests pin the branch order that resolves each collision.
 */

;

(() => {
    const { tokenize } = globalThis.TTV_DSL;
    const { TokenType } = globalThis.TTV_DSL.tokens;
    const { DSLSyntaxError } = globalThis.TTV_DSL.errors;

    /** @param {String} source @return {Array<String>} the token types, in order */
    let types = (source) => tokenize(source).map(token => token.type);

    /** @param {String} source @return {Array<*>} the decoded values, `EOF` dropped */
    let values = (source) => tokenize(source).slice(0, -1).map(token => token.value);

    /** @param {String} source @param {Number} [index = 0] @return {Object} */
    let first = (source, index = 0) => tokenize(source)[index];

    describe('tokenizer / comments vs. the channel selector', () => {
        it('reads "//" as a comment, not a channel named "/"', () => {
            assert.deepEqual(types('// goto /shroud\n'), [TokenType.EOF]);
        });

        it('still reads a single "/" as a channel selector', () => {
            assert.deepEqual(types('goto /shroud\n'), [TokenType.GOTO, TokenType.SELECTOR_CHANNEL, TokenType.NEWLINE, TokenType.EOF]);
            assert.equal(first('goto /shroud\n', 1).value, 'shroud');
        });

        it('ends a comment at the newline, not at the end of input', () => {
            assert.deepEqual(types('goto # // trailing\ngoto #\n'), [
                TokenType.GOTO, TokenType.SELECTOR_SELF, TokenType.NEWLINE,
                TokenType.GOTO, TokenType.SELECTOR_SELF, TokenType.NEWLINE,
                TokenType.EOF,
            ]);
        });

        it('does not emit a NEWLINE for a blank or comment-only line', () => {
            assert.deepEqual(types('\n\n// nothing\n\n'), [TokenType.EOF]);
        });
    });

    describe('tokenizer / the four jobs of ":"', () => {
        it('reads mm:ss as a duration in milliseconds', () => {
            assert.equal(first('15:00\n').type, TokenType.DURATION);
            assert.equal(first('15:00\n').value, 900000);
        });

        it('reads hh:mm:ss as a duration in milliseconds', () => {
            assert.equal(first('1:30:00\n').value, 5400000);
        });

        it('points the retired :name: emote spelling at plain text', () => {
            assert.throws(() => tokenize('POST :kappa:\n'), /Emotes are plain text: write 'kappa'/);
        });

        // v1 refused a bare `:` in the tokenizer. v2 cannot: a `when` case label is a bare
        // colon, and the scanner has no idea whether it is inside one. The token is now
        // emitted and the *parser* owns the diagnostic — see parser.test.js, which asserts
        // that the message still names all the readings.
        it('emits a bare ":" as a COLON rather than refusing it', () => {
            assert.deepEqual(types('await :\n'), [TokenType.AWAIT, TokenType.COLON, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('reads a case label as a value followed by COLON', () => {
            assert.deepEqual(types('"help":\n'), [TokenType.STRING, TokenType.COLON, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('keeps the ":" of a permission out of the case-label branch', () => {
            assert.deepEqual(types('using [vip] +eval:calc\n'), [
                TokenType.USING, TokenType.SELECTOR_BADGE, TokenType.PERMISSION,
                TokenType.NEWLINE, TokenType.EOF,
            ]);

            assert.equal(first('using [vip] +eval:calc\n', 2).value, 'eval:calc');
        });

        it('reads an emote as the plain string it is', () => {
            assert.deepEqual(types('await 5:00\nREPLY \'pog\'\n'), [
                TokenType.AWAIT, TokenType.DURATION, TokenType.NEWLINE,
                TokenType.IDENT, TokenType.STRING, TokenType.NEWLINE,
                TokenType.EOF,
            ]);
        });
    });

    describe('tokenizer / "<|" and badge lists', () => {
        it('reads "<|" as the pipe operator', () => {
            assert.equal(first('1st <| .links\n', 1).type, TokenType.PIPE);
        });

        it('reads "[name]" as a one-badge list', () => {
            assert.equal(first('using [moderator]\n', 1).type, TokenType.SELECTOR_BADGE);
            assert.deepEqual(first('using [moderator]\n', 1).value, ['moderator']);
            assert.deepEqual(first('using [sub-gifter]\n', 1).value, ['sub-gifter']);
        });

        it('reads "[a b, c]" as one token carrying every name', () => {
            assert.deepEqual(types('using [vip moderator, sub-gifter]\n'), [TokenType.USING, TokenType.SELECTOR_BADGE, TokenType.NEWLINE, TokenType.EOF]);
            assert.deepEqual(first('using [vip moderator, sub-gifter]\n', 1).value, ['vip', 'moderator', 'sub-gifter']);
        });

        it('refuses an empty, unclosed or malformed badge list', () => {
            assert.throws(() => tokenize('using []\n'), /Empty badge list/);
            assert.throws(() => tokenize('using [vip\n'), /Unclosed "\["/);
            assert.throws(() => tokenize('using [1st]\n'), /is not a badge name/);
        });

        it('points both retired badge spellings at "[name]"', () => {
            assert.throws(() => tokenize('using <moderator>\n'), /Badges are written "\[moderator\]", not "<moderator>"/);
            assert.throws(() => tokenize('using --moderator\n'), /Badges are written "\[moderator\]", not "--moderator"/);
            assert.throws(() => tokenize('POST --1\n'), /no decrement/);
        });

        it('reads several bracketed badges on one line as separate tokens', () => {
            assert.deepEqual(types('using [viewer] [everyone] [all]\n'), [
                TokenType.USING,
                TokenType.SELECTOR_BADGE, TokenType.SELECTOR_BADGE, TokenType.SELECTOR_BADGE,
                TokenType.NEWLINE, TokenType.EOF,
            ]);
        });

        it('rejects a bare "<"', () => {
            assert.throws(() => tokenize('await < 3\n'), DSLSyntaxError);
        });
    });

    describe('tokenizer / ordinals', () => {
        it('converts a positive ordinal to a 0-based index', () => {
            assert.equal(first('1st\n').value, 0);
            assert.equal(first('2nd\n').value, 1);
            assert.equal(first('3rd\n').value, 2);
            assert.equal(first('10th\n').value, 9);
        });

        it('accepts the universal "th" suffix', () => {
            assert.equal(first('1th\n').value, first('1st\n').value);
            assert.equal(first('2th\n').value, first('2nd\n').value);
            assert.equal(first('3th\n').value, first('3rd\n').value);
        });

        it('keeps a negative ordinal negative, so it counts from the end', () => {
            assert.equal(first('-1st\n').value, -1);
            assert.equal(first('-2nd\n').value, -2);
        });

        it('reads a negative ordinal as one token, not minus followed by a number', () => {
            assert.deepEqual(types('-1st\n'), [TokenType.ORDINAL, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('still reads a bare "-" before a plain number as unary minus', () => {
            assert.deepEqual(types('-1\n'), [TokenType.MINUS, TokenType.NUMBER, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('reads a plain number as a number', () => {
            assert.equal(first('42\n').type, TokenType.NUMBER);
            assert.equal(first('42\n').value, 42);
            assert.equal(first('3.5\n').value, 3.5);
        });
    });

    describe('tokenizer / the three jobs of "."', () => {
        it('prefers "..." over ".." over "."', () => {
            assert.equal(first('...\n').type, TokenType.RANGE_INCLUSIVE);
            assert.equal(first('..\n').type, TokenType.RANGE_EXCLUSIVE);
            assert.equal(first('.href\n').type, TokenType.SELECTOR_CONTEXT);
        });

        it('separates a range from its operands even with no spaces', () => {
            assert.deepEqual(types('1..9\n'), [TokenType.NUMBER, TokenType.RANGE_EXCLUSIVE, TokenType.NUMBER, TokenType.NEWLINE, TokenType.EOF]);
            assert.deepEqual(types('1...10\n'), [TokenType.NUMBER, TokenType.RANGE_INCLUSIVE, TokenType.NUMBER, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('rejects a dot with no property name', () => {
            assert.throws(() => tokenize('await . 3\n'), DSLSyntaxError);
        });
    });

    describe('tokenizer / channel and realm selectors', () => {
        it('reads a bare "#" as the current channel', () => {
            assert.equal(first('goto #\n', 1).type, TokenType.SELECTOR_SELF);
        });

        it('reads "#name" as a channel property', () => {
            assert.equal(first('#name\n').type, TokenType.SELECTOR_PROP);
            assert.equal(first('#name\n').value, 'name');
        });

        it('reads "/channel#prop" as two adjacent tokens for the parser to fuse', () => {
            assert.deepEqual(types('/ginger_enby#name\n'), [TokenType.SELECTOR_CHANNEL, TokenType.SELECTOR_PROP, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('reads an all-caps word glued to a path as a realm selector', () => {
            let token = first('using DISCORD/779741119520571456\n', 1);

            assert.equal(token.type, TokenType.SELECTOR_REALM);
            assert.deepEqual(token.value, { realm: 'DISCORD', path: '779741119520571456' });
        });

        it('does not turn an all-caps word followed by a comment into a realm', () => {
            assert.deepEqual(types('USERNAME // a note\n'), [TokenType.IDENT, TokenType.NEWLINE, TokenType.EOF]);
        });
    });

    describe('tokenizer / identifiers and the wildcard', () => {
        it('flags an all-caps word, leaving verb-vs-constant to the parser', () => {
            assert.equal(first('POST `x`\n').isUpper, true);
            assert.equal(first('sender\n').isUpper, false);
        });

        it('reads "*" as the wildcard in every position', () => {
            assert.deepEqual(types('await *\n'), [TokenType.AWAIT, TokenType.WILDCARD, TokenType.NEWLINE, TokenType.EOF]);
            assert.deepEqual(types('using *\n'), [TokenType.USING, TokenType.WILDCARD, TokenType.NEWLINE, TokenType.EOF]);
            assert.deepEqual(types('.message is *\n'), [TokenType.SELECTOR_CONTEXT, TokenType.IS, TokenType.WILDCARD, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('never produces a multiplication operator', () => {
            assert.ok(!('MULTIPLY' in TokenType));
            assert.deepEqual(types('2 * 3\n'), [TokenType.NUMBER, TokenType.WILDCARD, TokenType.NUMBER, TokenType.NEWLINE, TokenType.EOF]);
        });
    });

    describe('tokenizer / strings and templates', () => {
        it('decodes escapes in a double-quoted string', () => {
            assert.equal(first('"a\\"b\\nc"\n').value, 'a"b\nc');
        });

        it('emits one token for a template, carrying quasis and raw expressions', () => {
            let token = first('`hi ${ .sender }!`\n');

            assert.equal(token.type, TokenType.TEMPLATE);
            assert.deepEqual(token.value.quasis, ['hi ', '!']);
            assert.equal(token.value.expressions.length, 1);
            assert.equal(token.value.expressions[0].source, ' .sender ');
        });

        it('records the absolute offset of each interpolation', () => {
            let source = 'REPLY `hi ${ .sender }`\n',
                token = first(source, 1);

            assert.equal(source.slice(token.value.expressions[0].offset, token.value.expressions[0].offset + 8), ' .sender');
        });

        it('treats an empty template as a single empty quasi', () => {
            let token = first('``\n');

            assert.deepEqual(token.value.quasis, ['']);
            assert.deepEqual(token.value.expressions, []);
        });

        it('keeps braces that are not interpolations literal', () => {
            let token = first('`a { plain } brace, 100$ and a }`\n');

            assert.deepEqual(token.value.quasis, ['a { plain } brace, 100$ and a }']);
        });

        it('matches nested "${" and "}" to the right depth', () => {
            let token = first('`x${ any from (`y${ .z }`) }w`\n');

            assert.deepEqual(token.value.quasis, ['x', 'w']);
            assert.equal(token.value.expressions[0].source, ' any from (`y${ .z }`) ');
        });

        it('does not let a "}" inside a nested string close an interpolation early', () => {
            let token = first('`a${ "}" }b`\n');

            assert.deepEqual(token.value.quasis, ['a', 'b']);
            assert.equal(token.value.expressions[0].source, ' "}" ');
        });

        it('rejects an unterminated template', () => {
            assert.throws(() => tokenize('REPLY `never closed\n'), DSLSyntaxError);
        });

        it('rejects an unterminated string', () => {
            assert.throws(() => tokenize('REPLY "never closed\n'), DSLSyntaxError);
        });
    });

    describe('tokenizer / indentation', () => {
        it('emits INDENT and DEDENT around a nested block', () => {
            assert.deepEqual(types('await *\n    POST `x`\n'), [
                TokenType.AWAIT, TokenType.WILDCARD, TokenType.NEWLINE,
                TokenType.INDENT, TokenType.IDENT, TokenType.TEMPLATE, TokenType.NEWLINE,
                TokenType.DEDENT, TokenType.EOF,
            ]);
        });

        it('closes several blocks at once on a multi-level dedent', () => {
            // Three levels open; the `POST \`y\`` line drops two of them in one step, and
            // end-of-input closes the last.
            let stream = types('await *\n    using *\n        await 5:00\n            POST `x`\n    POST `y`\n');

            assert.equal(stream.filter(type => TokenType.INDENT === type).length, 3);
            assert.equal(stream.filter(type => TokenType.DEDENT === type).length, 3);

            let run = stream.indexOf(TokenType.DEDENT);

            assert.equal(stream[run + 1], TokenType.DEDENT, 'the two-level dedent should emit two adjacent DEDENTs');
            assert.equal(stream[run + 2], TokenType.IDENT, 'and then resume with the sibling statement');
        });

        it('rejects leading whitespace that mixes tabs and spaces', () => {
            let error = assert.throws(() => tokenize('await *\n \tPOST `x`\n'), DSLSyntaxError);

            assert.match(error.message, /tabs and spaces/i);
        });

        it('rejects a dedent that lands between two levels', () => {
            assert.throws(() => tokenize('await *\n        POST `x`\n    POST `y`\n'), DSLSyntaxError);
        });

        it('ignores the indentation of blank and comment-only lines', () => {
            assert.deepEqual(types('await *\n\n        // deeply indented comment\n    POST `x`\n'), [
                TokenType.AWAIT, TokenType.WILDCARD, TokenType.NEWLINE,
                TokenType.INDENT, TokenType.IDENT, TokenType.TEMPLATE, TokenType.NEWLINE,
                TokenType.DEDENT, TokenType.EOF,
            ]);
        });
    });

    describe('tokenizer / newlines inside brackets', () => {
        it('keeps emitting NEWLINE inside parentheses, because `any from` needs them', () => {
            assert.deepEqual(types('POST any from (\n    `a`\n    `b`\n)\n'), [
                TokenType.IDENT, TokenType.ANY, TokenType.FROM, TokenType.LPAREN, TokenType.NEWLINE,
                TokenType.TEMPLATE, TokenType.NEWLINE,
                TokenType.TEMPLATE, TokenType.NEWLINE,
                TokenType.RPAREN, TokenType.NEWLINE,
                TokenType.EOF,
            ]);
        });

        it('suppresses INDENT and DEDENT inside parentheses', () => {
            let stream = types('POST any from (\n            `a`\n)\n');

            assert.ok(!stream.includes(TokenType.INDENT));
            assert.ok(!stream.includes(TokenType.DEDENT));
        });

        it('rejects an unclosed parenthesis', () => {
            let error = assert.throws(() => tokenize('POST any from (\n    `a`\n'), DSLSyntaxError);

            assert.match(error.message, /unclosed/i);
        });

        it('rejects an unmatched closing parenthesis', () => {
            assert.throws(() => tokenize('POST `a`)\n'), DSLSyntaxError);
        });
    });

    describe('tokenizer / source locations', () => {
        it('reports 1-based line and column', () => {
            let token = first('await *\n    POST `x`\n', 4);

            assert.equal(token.type, TokenType.IDENT);
            assert.equal(token.loc.line, 2);
            assert.equal(token.loc.column, 5);
        });

        it('renders a code frame that underlines the fault', () => {
            let error = assert.throws(() => tokenize('await *\n    POST @\n'), DSLSyntaxError),
                frame = error.codeFrame();

            assert.match(frame, /> 2 \|/);
            assert.match(frame, /\^/);
        });
    });

    // -- v2 -----------------------------------------------------------------
    //
    // Every lexeme added in v2 shares a prefix with something already in the language. These
    // pin the winner for each collision, so a future edit to the punctuator table or to the
    // branch order fails here rather than three passes downstream.

    describe('tokenizer / v2 prefix collisions', () => {
        it('prefers "=>" over "=", and "->" over "-"', () => {
            assert.deepEqual(types('`a` => b_c\n'), [TokenType.TEMPLATE, TokenType.ARROW_PARENT, TokenType.IDENT, TokenType.NEWLINE, TokenType.EOF]);
            assert.deepEqual(types('`a` -> b_c\n'), [TokenType.TEMPLATE, TokenType.ARROW_LOCAL, TokenType.IDENT, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('still reads "-1st" as a negative ordinal, not as an arrow', () => {
            assert.equal(first('-1st <| .links\n').type, TokenType.ORDINAL);
            assert.equal(first('-1st <| .links\n').value, -1);
        });

        it('reads a lone "=" as the case-sensitivity prefix', () => {
            assert.deepEqual(types('.a is =\'X\'\n'), [
                TokenType.SELECTOR_CONTEXT, TokenType.IS, TokenType.EXACT, TokenType.STRING,
                TokenType.NEWLINE, TokenType.EOF,
            ]);
        });

        it('reads "<|" at the angle branch and a bare "|" as `where`', () => {
            assert.deepEqual(types('.links | .a\n'), [TokenType.SELECTOR_CONTEXT, TokenType.WHERE, TokenType.SELECTOR_CONTEXT, TokenType.NEWLINE, TokenType.EOF]);
            assert.deepEqual(types('1st <| .links\n'), [TokenType.ORDINAL, TokenType.PIPE, TokenType.SELECTOR_CONTEXT, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('gives `of` and `<|` the same token type', () => {
            assert.equal(first('1st of .links\n', 1).type, TokenType.PIPE);
            assert.equal(first('1st <| .links\n', 1).type, TokenType.PIPE);
        });

        it('scans a "%" run greedily, and a bare "%" as an empty run', () => {
            assert.deepEqual(first('`a` %n%s `b`\n', 1).value, ['n', 's']);
            assert.deepEqual(first('`a` %d%s%c `b`\n', 1).value, ['d', 's', 'c']);
            assert.deepEqual(first('`a` % `b`\n', 1).value, []);
        });

        it('does not let a "%" run eat the following expression', () => {
            assert.deepEqual(types('`a` % \'x\'\n'), [TokenType.TEMPLATE, TokenType.PERCENT, TokenType.STRING, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('refuses a "+" that is not a permission, and says why', () => {
            let error = assert.throws(() => tokenize('POST 1 + 2\n'), DSLSyntaxError);

            assert.match(error.message, /no arithmetic/i);
            assert.match(error.message, /using. header/i);
        });

        it('reads "&" as a dotted path, and points the v2 "$:" spelling at it', () => {
            assert.deepEqual(first('&datetime.now()\n').value, ['datetime', 'now']);
            assert.throws(() => tokenize('POST &\n'), DSLSyntaxError);
            assert.throws(() => tokenize('POST $:Date.now()\n'), /written "&datetime\.now\(\)"/);
        });

        it('decodes both Unicode escape spellings, in strings and templates', () => {
            assert.equal(first('"caf\\u00e9"\n').value, 'café');
            assert.equal(first('\'\\u{1F49C}\'\n').value, '💜');
            assert.deepEqual(first('`love \\u{1F49C}`\n').value.quasis, ['love 💜']);
        });

        it('refuses a malformed Unicode escape', () => {
            for (let source of ['"\\u12"\n', '"\\u{}"\n', '"\\u{110000}"\n', '"\\uzzzz"\n'])
                assert.throws(() => tokenize(source), /Malformed Unicode escape/);
        });

        it('reads single quotes exactly as double quotes', () => {
            assert.equal(first('\'a b\'\n').type, TokenType.STRING);
            assert.equal(first('\'a b\'\n').value, 'a b');
            assert.equal(first('"a b"\n').value, 'a b');
        });

        it('reads a comma as its own token, never as whitespace', () => {
            assert.deepEqual(types('any from ( `a` , `b` )\n'), [
                TokenType.ANY, TokenType.FROM, TokenType.LPAREN,
                TokenType.TEMPLATE, TokenType.COMMA, TokenType.TEMPLATE,
                TokenType.RPAREN, TokenType.NEWLINE, TokenType.EOF,
            ]);
        });
    });

    describe('tokenizer / templates and a literal "${"', () => {
        it('treats an unterminated "${" as text', () => {
            let token = first('`cost: ${ dollars`\n');

            assert.equal(token.type, TokenType.TEMPLATE);
            assert.deepEqual(token.value.quasis, ['cost: ${ dollars']);
            assert.equal(token.value.expressions.length, 0);
        });

        it('still interpolates a "${" that closes', () => {
            let token = first('`hi ${ .name }`\n');

            assert.equal(token.value.expressions.length, 1);
            assert.deepEqual(token.value.quasis, ['hi ', '']);
        });

        it('supports the documented escape idiom', () => {
            // The outer pair is a real interpolation of a string that happens to read `${x}`.
            let token = first('`${ "${x}" }`\n');

            assert.equal(token.value.expressions.length, 1);
            assert.equal(token.value.expressions[0].source.trim(), '"${x}"');
        });
    });

    describe('tokenizer / block comments', () => {
        it('drops a block comment that owns its whole line', () => {
            assert.deepEqual(types('/* note */\nPOST `a`\n'), [TokenType.IDENT, TokenType.TEMPLATE, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('drops a block comment that spans several lines', () => {
            assert.deepEqual(types('/* one\n   two\n   three */\nPOST `a`\n'), [TokenType.IDENT, TokenType.TEMPLATE, TokenType.NEWLINE, TokenType.EOF]);
        });

        it('still measures indentation on a line that only starts with a comment', () => {
            assert.deepEqual(types('await *\n    /* here */ POST `a`\n'), [
                TokenType.AWAIT, TokenType.WILDCARD, TokenType.NEWLINE,
                TokenType.INDENT, TokenType.IDENT, TokenType.TEMPLATE, TokenType.NEWLINE,
                TokenType.DEDENT, TokenType.EOF,
            ]);
        });

        it('refuses an unterminated block comment reached mid-line', () => {
            assert.throws(() => tokenize('POST `a` /* forever\n'), DSLSyntaxError);
        });
    });
})();

if (typeof module === 'object' && module?.exports)
    module.exports = globalThis.TTV_DSL;
