/*** /scripts/eslint/style.mjs
 * House-style rules from docs/STYLEGUIDE.md that no stock rule covers. Each one fixes what it
 * reports when the fix can't change behaviour; `npm run format` applies them.
 */

import stylistic from '@stylistic/eslint-plugin';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { RegExpParser } from '@eslint-community/regexpp';

const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const SEMICOLON_STATEMENTS = new Set([
    'ExpressionStatement', 'VariableDeclaration', 'ReturnStatement', 'ThrowStatement',
    'BreakStatement', 'ContinueStatement', 'DoWhileStatement', 'DebuggerStatement',
]);

/*
 * lineIndent
 * The leading whitespace of the line `node` starts on.
 */
function lineIndent(sourceCode, node) {
    return sourceCode.lines[node.loc.start.line - 1].match(/^\s*/)[0];
}

/*
 * isSoleIfBranchStatement
 * True when `node` is the only statement of a braced `if`/`else` branch; those omit their semicolon.
 */
function isSoleIfBranchStatement(node) {
    const block = node?.parent;

    return true
        && block?.type == 'BlockStatement'
        && block.body.length == 1
        && block.parent?.type == 'IfStatement'
        && SEMICOLON_STATEMENTS.has(node.type);
}

/*
 * filtered
 * Wraps a stock rule, dropping the reports `skip(descriptor, context)` rejects.
 */
function filtered(base, skip) {
    return {
        meta: base.meta,
        create(context) {
            const proxy = Object.create(context, {
                report: { value: descriptor => skip(descriptor, context) || context.report(descriptor) },
            });

            return base.create(proxy);
        },
    };
}

/*
 * requote
 * Rewrites a string literal's source with the other quote character, keeping its value.
 */
function requote(raw, quote) {
    let inner = raw.slice(1, -1)
        , other = quote == '"' ? "'" : '"'
        , out = '';

    for(let index = 0; index < inner.length; ++index) {
        const char = inner[index];

        if(char == '\\') {
            const next = inner[index + 1];

            out += next == other ? next : char + next;
            ++index;
        } else {
            out += char == quote ? '\\' + char : char
        }
    }

    return quote + out + quote;
}

// Calls, properties and attributes whose strings people read: messages, errors, markup
const USER_FACING_CALLS = new Set([
    '$log', '$warn', '$error', '$notice', '$remark', '$ok', '$debug', 'alert', 'confirm', 'prompt', 'console',
    'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'EvalError', 'URIError',
]);
const USER_FACING_PROPS = new Set([
    'textContent', 'innerText', 'innerHTML', 'outerHTML', 'title', 'placeholder', 'tooltip',
    'message', 'text', 'label', 'description', 'alt',
]);
const USER_FACING_ATTRIBUTES = new Set(['title', 'placeholder', 'aria-label', 'alt', 'tooltip']);

/*
 * calleeName
 * The name a call is known by: `f()` → f, `alert.silent()` → alert, `new Error()` → Error.
 */
function calleeName(callee) {
    while(callee?.type == 'MemberExpression')
        callee = callee.object;

    return callee?.type == 'Identifier' ? callee.name : null;
}

/*
 * isUserFacing
 * Whether a string literal is text for people (double quotes) rather than a symbol the code uses (single quotes).
 */
function isUserFacing(node) {
    let child = node
        , parent = node.parent;

    // Climb through expressions that only pass the string along
    while(false
        || (parent.type == 'BinaryExpression' && parent.operator == '+')
        || (parent.type == 'ConditionalExpression' && parent.test != child)
        || parent.type == 'LogicalExpression'
        || parent.type == 'TemplateLiteral'
    ) {
        child = parent;
        parent = parent.parent;
    }

    switch(parent.type) {
        case 'CallExpression':
        case 'NewExpression': {
            if(!parent.arguments.includes(child))
                return false;

            if(USER_FACING_CALLS.has(calleeName(parent.callee)))
                return true;

            // el.setAttribute('title', "...")
            const [name] = parent.arguments;

            return true
                && parent.callee.property?.name == 'setAttribute'
                && parent.arguments[1] == child
                && USER_FACING_ATTRIBUTES.has(name?.value);
        }

        case 'ThrowStatement': {
            return true;
        }

        case 'AssignmentExpression': {
            return parent.right == child && USER_FACING_PROPS.has(parent.left.property?.name);
        }

        case 'Property': {
            return parent.value == child && USER_FACING_PROPS.has(parent.key.name ?? parent.key.value);
        }

        default: {
            return false;
        }
    } // switch parent.type
}

/*
 * countGroups
 * The number of capturing groups in a regular expression literal, or -1 when it can't be parsed.
 */
function countGroups({ pattern, flags }) {
    try {
        let groups = 0;
        const visit = node => {
            if(node.type == 'CapturingGroup')
                ++groups;

            for(const key of ['alternatives', 'elements', 'element'])
                [].concat(node[key] ?? []).forEach(visit);
        };

        visit(new RegExpParser().parsePattern(pattern, 0, pattern.length, { unicode: flags.includes('u'), unicodeSets: flags.includes('v') }));

        return groups;
    } catch {
        return -1;
    }
}

/*
 * breadcrumbPath
 * The labels, switches and cases enclosing `node` (itself included), outermost first, within its function.
 */
function breadcrumbPath(sourceCode, node) {
    const path = [];

    for(let current = node; current && !FUNCTIONS.has(current.type) && current.type != 'Program'; current = current.parent) {
        let text = null;

        if(current.type == 'LabeledStatement')
            text = ':' + current.label.name;
        else if(current.type == 'SwitchStatement')
            text = 'switch ' + sourceCode.getText(current.discriminant).replace(/\s+/g, ' ').slice(0, 40);
        else if(current.type == 'SwitchCase')
            text = current.test ? sourceCode.getText(current.test).replace(/\s+/g, ' ').slice(0, 40) : 'default';

        if(text)
            path.unshift(text);
    }

    return path.join(' | ');
}

/*
 * blockDepth
 * How many blocks and cases enclose `node` within its function.
 */
function blockDepth(node) {
    let depth = 0;

    for(let current = node.parent; current && !FUNCTIONS.has(current.type) && current.type != 'Program'; current = current.parent)
        if(true
            && (current.type == 'BlockStatement' || current.type == 'SwitchCase')
            && !FUNCTIONS.has(current.parent?.type)
        )
            ++depth;

    return depth;
}

/*
 * insideSwitch
 * Whether `node` sits inside another switch of the same function.
 */
function insideSwitch(node) {
    for(let current = node.parent; current && !FUNCTIONS.has(current.type); current = current.parent)
        if(current.type == 'SwitchStatement')
            return true;

    return false;
}

const rules = {
    // Stock semicolons, except for the sole statement of a braced if/else branch
    'semi': filtered(stylistic.rules.semi, ({ node }) => isSoleIfBranchStatement(node)),

    // Stock prefer-const, except page-scope declarations of classic scripts (other scripts may assign them)
    'prefer-const': filtered(builtinRules.get('prefer-const'), ({ node }, context) => {
        if(context.sourceCode.ast.sourceType != 'script')
            return false;

        let declaration = node;

        while(declaration && declaration.type != 'VariableDeclaration')
            declaration = declaration.parent;

        return declaration?.parent?.type == 'Program';
    }),

    'body-below': {
        meta: { type: 'layout', fixable: 'whitespace', schema: [], messages: { below: 'Put a one-line body on its own line, indented.' } },
        create(context) {
            const { sourceCode } = context;

            const check = (owner, body) => {
                if(!body || body.type == 'BlockStatement' || body.type == 'EmptyStatement')
                    return;

                // `else if` chains stay on the else's line
                if(body.type == 'IfStatement' && owner.alternate == body)
                    return;

                const before = sourceCode.getTokenBefore(body);

                if(before.loc.end.line != body.loc.start.line)
                    return;

                const indent = before.value == 'else'
                    ? sourceCode.lines[before.loc.start.line - 1].match(/^\s*/)[0]
                    : lineIndent(sourceCode, owner);

                context.report({
                    node: body,
                    messageId: 'below',
                    fix: fixer => fixer.replaceTextRange([before.range[1], body.range[0]], `\n${ indent }    `),
                });
            };

            return {
                IfStatement: node => (check(node, node.consequent), check(node, node.alternate)),
                'ForStatement, ForInStatement, ForOfStatement, WhileStatement': node => check(node, node.body),
            };
        },
    },

    'void-null': {
        meta: { type: 'suggestion', fixable: 'code', schema: [], messages: { bare: 'Use `void null` instead of `undefined`.' } },
        create(context) {
            const { sourceCode } = context;

            return {
                Identifier(node) {
                    const { parent } = node;

                    if(node.name != 'undefined')
                        return;

                    // Property names, keys, and declarations aren't the value
                    if(false
                        || (parent.type == 'MemberExpression' && parent.property == node && !parent.computed)
                        || ((parent.type == 'Property' || parent.type == 'MethodDefinition' || parent.type == 'PropertyDefinition') && parent.key == node && !parent.computed)
                        || (parent.type == 'Property' && parent.shorthand)
                    )
                        return;

                    const reference = sourceCode.getScope(node).references.find(ref => ref.identifier == node)
                        , variable = reference?.resolved;

                    // A declaration or assignment target named `undefined` isn't the value
                    if(variable?.defs.length || !reference || reference.isWrite())
                        return;

                    context.report({
                        node,
                        messageId: 'bare',
                        fix(fixer) {
                            if(parent.type == 'UnaryExpression' && parent.operator == 'void')
                                return fixer.replaceText(node, 'null');

                            const wrap = false
                                || (parent.type == 'MemberExpression' && parent.object == node)
                                || (parent.type == 'CallExpression' && parent.callee == node)
                                || (parent.type == 'BinaryExpression' && parent.operator == '**' && parent.left == node);

                            return fixer.replaceText(node, wrap ? '(void null)' : 'void null');
                        },
                    });
                },
            };
        },
    },

    'switch-case-braces': {
        meta: { type: 'layout', fixable: 'code', schema: [], messages: { braces: 'Wrap the case body in braces, with `} break;` on one line.' } },
        create(context) {
            const { sourceCode } = context;

            return {
                SwitchStatement(node) {
                    const fixable = safeToWrap(node);

                    for(const kase of node.cases) {
                        const body = kase.consequent;

                        if(body.length == 0)
                            continue;

                        const last = body.at(-1)
                            , hasBreak = last.type == 'BreakStatement' && body.length > 1
                            , inner = hasBreak ? body.slice(0, -1) : body;

                        if(inner.length == 1 && inner[0].type == 'BlockStatement' && (!hasBreak || inner[0].loc.end.line == last.loc.start.line))
                            continue;

                        context.report({
                            node: kase,
                            messageId: 'braces',
                            fix: !fixable ? null : fixer => {
                                // A block followed by a break on its own line: pull the break up
                                if(inner.length == 1 && inner[0].type == 'BlockStatement')
                                    return fixer.replaceTextRange([inner[0].range[1], last.range[0]], ' ');

                                const colon = sourceCode.getTokenBefore(body[0])
                                    , end = hasBreak ? last.range[0] : last.range[1]
                                    , text = sourceCode.text.slice(colon.range[1], end).trimEnd()
                                    , trailer = hasBreak ? ' ' + sourceCode.getText(last) : '';

                                const indent = lineIndent(sourceCode, kase);

                                if(body[0].loc.start.line == colon.loc.end.line) {
                                    // `case x: return y;` → `case x: { return y; }`
                                    if(!text.includes('\n'))
                                        return fixer.replaceTextRange([colon.range[1], last.range[1]], ` {${ text } }${ trailer }`);

                                    // `default: switch(y) {…}` → the body moves down a level; re-indent it unless a string spans lines
                                    const spans = sourceCode.getTokens(body[0]).some(token => token.type == 'Template' && token.value.includes('\n'))
                                        , moved = spans ? text.trim() : text.trim().replace(/\n/g, '\n    ');

                                    return fixer.replaceTextRange([colon.range[1], last.range[1]], ` {\n${ indent }    ${ moved }\n${ indent }}${ trailer }`);
                                }

                                return fixer.replaceTextRange([colon.range[1], last.range[1]], ` {${ text }\n${ indent }}${ trailer }`);
                            },
                        });
                    }
                },
            };

            // Braces scope a case's declarations; only wrap when nothing else reaches them
            function safeToWrap(node) {
                const scope = sourceCode.getScope(node.cases[0] ?? node);

                if(scope.block != node)
                    return true;

                for(const variable of scope.variables) {
                    const kase = node.cases.find(({ range: [start, end] }) => variable.defs.some(def => def.name.range[0] >= start && def.name.range[1] <= end));

                    if(variable.references.some(({ identifier: { range: [start] } }) => start < kase.range[0] || start > kase.range[1]))
                        return false;
                }

                return true;
            }
        },
    },

    'prefix-update': {
        meta: { type: 'suggestion', fixable: 'code', schema: [], messages: { prefix: 'Use the prefix form (`++i`/`--i`) for a standalone update.' } },
        create(context) {
            const { sourceCode } = context;

            return {
                'ExpressionStatement > UpdateExpression[prefix=false]'(node) {
                    context.report({
                        node,
                        messageId: 'prefix',
                        fix: fixer => fixer.replaceText(node, node.operator + sourceCode.getText(node.argument)),
                    });
                },
            };
        },
    },

    'if-braces': {
        meta: { type: 'layout', fixable: 'code', schema: [], messages: { consistent: 'Brace every branch of this if/else chain, or none.' } },
        create(context) {
            const { sourceCode } = context;

            return {
                IfStatement(node) {
                    // Only the head of a chain
                    if(node.parent.type == 'IfStatement' && node.parent.alternate == node)
                        return;

                    const branches = [];

                    for(let current = node; current; current = current.alternate?.type == 'IfStatement' ? current.alternate : null) {
                        branches.push(current.consequent);

                        if(current.alternate && current.alternate.type != 'IfStatement')
                            branches.push(current.alternate);
                    }

                    const braced = branches.filter(branch => branch.type == 'BlockStatement');

                    if(braced.length == 0 || braced.length == branches.length)
                        return;

                    const indent = lineIndent(sourceCode, node);

                    context.report({
                        node,
                        messageId: 'consistent',
                        *fix(fixer) {
                            for(const branch of branches) {
                                if(branch.type == 'BlockStatement')
                                    continue;

                                const before = sourceCode.getTokenBefore(branch)
                                    , text = sourceCode.getText(branch);

                                yield fixer.replaceTextRange([before.range[1], branch.range[1]], ` {\n${ indent }    ${ text }\n${ indent }}`);
                            }
                        },
                    });
                },
            };
        },
    },

    'if-block-semi': {
        meta: { type: 'layout', fixable: 'code', schema: [], messages: { omit: 'The sole statement of a braced branch omits its semicolon.' } },
        create(context) {
            const { sourceCode } = context;

            return {
                'IfStatement > BlockStatement > *'(node) {
                    if(!isSoleIfBranchStatement(node))
                        return;

                    const last = sourceCode.getLastToken(node);

                    if(last.value != ';')
                        return;

                    // `return` followed by a line starting with ( or [ would join the next line; keep it
                    const next = sourceCode.getTokenAfter(last);

                    if(next?.value != '}')
                        return;

                    context.report({ node, messageId: 'omit', fix: fixer => fixer.remove(last) });
                },
            };
        },
    },

    'quotes': {
        meta: { type: 'layout', fixable: 'code', schema: [], messages: {
            single: 'Symbols the code reasons about use single quotes.',
            double: 'Text people read (messages, errors, markup) uses double quotes.',
        } },
        create(context) {
            const { sourceCode } = context;

            return {
                Literal(node) {
                    if(typeof node.value != 'string' || node.directive)
                        return;

                    const { parent } = node;

                    if(false
                        || parent.type == 'ImportDeclaration'
                        || parent.type == 'ExportNamedDeclaration'
                        || parent.type == 'ExportAllDeclaration'
                        || parent.type == 'ImportExpression'
                        || (parent.type == 'Property' && parent.key == node)
                    )
                        return;

                    const raw = sourceCode.getText(node)
                        , quote = isUserFacing(node) ? '"' : "'"
                        , other = quote == '"' ? "'" : '"';

                    if(raw[0] == quote)
                        return;

                    // Mixing is fine when the text holds the wanted quote but not the other
                    if(node.value.includes(quote) && !node.value.includes(other))
                        return;

                    context.report({
                        node,
                        messageId: quote == '"' ? 'double' : 'single',
                        fix: fixer => fixer.replaceText(node, requote(raw, quote)),
                    });
                },
            };
        },
    },

    'regex-callback-params': {
        meta: { type: 'suggestion', fixable: 'code', schema: [], messages: { params: 'List every positional parameter of a replace callback ({{ names }}).' } },
        create(context) {
            const { sourceCode } = context;

            return {
                CallExpression(node) {
                    const [pattern, callback] = node.arguments;

                    if(false
                        || !['replace', 'replaceAll'].includes(node.callee.property?.name)
                        || !pattern?.regex
                        || !['ArrowFunctionExpression', 'FunctionExpression'].includes(callback?.type)
                        || callback.params.some(param => param.type != 'Identifier')
                    )
                        return;

                    const groups = countGroups(pattern.regex);

                    if(groups < 0)
                        return;

                    const wanted = ['$0', ...Array.from({ length: groups }, (_, index) => `$${ index + 1 }`), '$$', '$_'];

                    if(callback.params.length >= wanted.length)
                        return;

                    const scope = sourceCode.getScope(callback)
                        , used = new Set(scope.variables.filter(variable => variable.references.length).map(variable => variable.name))
                        , outer = new Set(scope.through.map(reference => reference.identifier.name))
                        , names = wanted.map((name, index) => {
                            const param = callback.params[index];

                            return (param && used.has(param.name)) ? param.name : name;
                        });

                    // Renaming must neither collide nor shadow something the body reads from outside
                    const fixable = true
                        && new Set(names).size == names.length
                        && names.every((name, index) => callback.params[index]?.name == name || !outer.has(name));

                    context.report({
                        node: callback,
                        messageId: 'params',
                        data: { names: wanted.join(', ') },
                        fix: !fixable ? null : fixer => {
                            const open = callback.params.length
                                ? sourceCode.getTokenBefore(callback.params[0])
                                : sourceCode.getFirstToken(callback, token => token.value == '(');
                            const close = callback.params.length
                                ? sourceCode.getTokenAfter(callback.params.at(-1))
                                : sourceCode.getTokenAfter(open);
                            const list = names.join(', ');

                            // `x => …` has no parentheses
                            if(open?.value != '(' || close?.value != ')')
                                return callback.params.length == 1 ? fixer.replaceText(callback.params[0], `(${ list })`) : null;

                            return fixer.replaceTextRange([open.range[1], close.range[0]], list);
                        },
                    });
                },
            };
        },
    },

    'breadcrumbs': {
        meta: { type: 'layout', fixable: 'code', schema: [], messages: { crumb: 'Mark this closing brace with its path: `// {{ path }}`.' } },
        create(context) {
            const { sourceCode } = context;

            const check = (node, closer, needed) => {
                if(closer?.value != '}' || !needed)
                    return;

                const path = breadcrumbPath(sourceCode, node)
                    , after = sourceCode.getTokenAfter(closer, { includeComments: true });

                if(!path.length)
                    return;

                // `} break;` keeps the comment after the break
                if(after?.type == 'Keyword' && after.value == 'break' && after.loc.start.line == closer.loc.end.line)
                    closer = sourceCode.getLastToken(sourceCode.getNodeByRangeIndex(after.range[0]));

                // Anything else on the line (a comment, or code the comment would swallow) → leave it
                const following = sourceCode.getTokenAfter(closer, { includeComments: true });

                if(following?.loc.start.line == closer.loc.end.line)
                    return;

                context.report({
                    loc: closer.loc,
                    messageId: 'crumb',
                    data: { path },
                    fix: fixer => fixer.insertTextAfter(closer, ` // ${ path }`),
                });
            };

            const long = node => node.loc.end.line - node.loc.start.line > 60;

            return {
                LabeledStatement(node) {
                    let deep = blockDepth(node) > 3
                        , nested = false;

                    // A switch nested in another switch below this label
                    const visit = (child, switches) => {
                        if(!child || typeof child.type != 'string' || FUNCTIONS.has(child.type) || nested)
                            return;

                        if(child.type == 'SwitchStatement') {
                            if(switches > 0)
                                return nested = true;

                            ++switches;
                        }

                        for(const key of sourceCode.visitorKeys[child.type] ?? [])
                            [].concat(child[key] ?? []).forEach(grand => visit(grand, switches));
                    };

                    visit(node.body, 0);

                    check(node, sourceCode.getLastToken(node.body), deep || nested || long(node));
                },

                SwitchStatement(node) {
                    check(node, sourceCode.getLastToken(node), false
                        || node.cases.length > 3
                        || insideSwitch(node)
                        || blockDepth(node) > 3
                        || long(node)
                    );
                },

                'SwitchCase > BlockStatement'(node) {
                    check(node.parent, sourceCode.getLastToken(node), blockDepth(node) > 3 || long(node));
                },
            };
        },
    },
};

export default { meta: { name: 'ttv-style' }, rules };
