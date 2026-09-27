"""/scripts/css/dedupe.py
Removes what settings.css repeats from extras.css (the Settings page loads extras.css first): identical
rules, and declarations a same-selector rule repeats. A repeat is only removed when nothing loaded
between the two copies sets the same property on a selector sharing a class, id or attribute with it,
so the cascade can't change.

    python3 scripts/css/dedupe.py src/extras.css src/settings.css
"""

import re
import sys

COMMENT = re.compile(r'/\*.*?\*/', re.S)
HOOK = re.compile(r'[.#][\w-]+|\[[\w-]+|::?[\w-]+|^[a-z]+|(?<=[\s>+~(,])[a-z]+')


def rules(text):
    """Plain rules as dicts: context (enclosing @-rules), selector, declarations {prop: value}, span."""
    masked = COMMENT.sub(lambda match: ' ' * len(match.group(0)), text)
    out, stack, head_start = [], [], 0

    for position, char in enumerate(masked):
        if char == '{':
            stack.append((masked[head_start:position].strip(), position, head_start))
            head_start = position + 1
        elif char == '}':
            head, opened, started = stack.pop()
            body = masked[opened + 1:position]

            if not head.startswith('@') and '{' not in body:
                declarations = {}

                for declaration in body.split(';'):
                    if ':' in declaration:
                        prop, value = declaration.split(':', 1)
                        declarations[prop.strip().lower()] = ' '.join(value.split())

                # Extend the span over leading whitespace so removal leaves no gap
                start = started

                while start > 0 and text[start - 1] in ' \n':
                    start -= 1

                out.append({
                    'context': ' / '.join(' '.join(h.split()) for h, _, _ in stack),
                    'selector': ' '.join(head.split()),
                    'declarations': declarations,
                    'span': (start, position + 1),
                    'body': (opened + 1, position),
                })

            head_start = position + 1
        elif char == ';' and not stack:
            head_start = position + 1

    return out


def hooks(selector):
    return set(HOOK.findall(selector))


def pseudo(selector):
    """The pseudo-elements a selector's parts end in (`::before`, …); '' for the element itself."""
    return {(re.search(r'::?(before|after|placeholder|marker|selection|backdrop|-webkit-[\w-]+)\s*$', part, re.I) or [''])[0].lstrip(':').lower() for part in selector.split(',')}


def overridden(prop, selector, between):
    """Whether any rule in `between` could set `prop` on the elements (or pseudo-elements) `selector` matches."""
    mine, targets = hooks(selector), pseudo(selector)

    return any(
        prop in rule['declarations']
        and pseudo(rule['selector']) & targets
        and (hooks(rule['selector']) & mine or '*' in rule['selector'])
        for rule in between
    )


def main(first_path, second_path):
    first, second = open(first_path, encoding='utf8').read(), open(second_path, encoding='utf8').read()
    first_rules, second_rules = rules(first), rules(second)
    removals, trims = [], []

    for index, rule in enumerate(second_rules):
        matches = [(at, other) for at, other in enumerate(first_rules) if other['context'] == rule['context'] and other['selector'] == rule['selector']]

        if not matches or '@keyframes' in rule['context']:
            continue

        at, original = matches[-1]
        between = first_rules[at + 1:] + second_rules[:index]
        repeated = [prop for prop, value in rule['declarations'].items()
                    if original['declarations'].get(prop) == value and not overridden(prop, rule['selector'], between)]

        if len(repeated) == len(rule['declarations']):
            removals.append(rule)
        elif repeated:
            trims.append((rule, repeated))

    # Apply from the end so spans stay valid
    edits = [(rule['span'], '') for rule in removals]

    for rule, props in trims:
        start, end = rule['body']
        body = second[start:end]

        for prop in props:
            body = re.sub(r'\n?[ \t]*' + re.escape(prop) + r'\s*:[^;]*;', '', body, count=1, flags=re.I)

        edits.append(((start, end), body))

    for (start, end), replacement in sorted(edits, key=lambda edit: edit[0][0], reverse=True):
        second = second[:start] + replacement + second[end:]

    open(second_path, 'w', encoding='utf8').write(second)
    print(f'{ second_path }: removed { len(removals) } repeated rules, trimmed { sum(len(p) for _, p in trims) } repeated declarations from { len(trims) } rules')


if __name__ == '__main__':
    main(*sys.argv[1:3])
