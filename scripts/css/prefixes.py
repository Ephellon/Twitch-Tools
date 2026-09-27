"""/scripts/css/prefixes.py
Drops vendor-prefixed declarations the build targets (Chrome 88+, Firefox 142+) no longer need: a
prefixed property goes only when the same rule also sets the standard one, and only for properties
both browsers support unprefixed. Prefixed @keyframes go when a standard one of the same name exists.

    python3 scripts/css/prefixes.py src/extras.css src/settings.css
"""

import re
import sys

# Supported unprefixed by Chrome 88 and Firefox 142
STANDARD = re.compile(r'^(opacity|border(-[a-z]+)*-radius|box-shadow|transition(-[a-z-]+)?|transform(-[a-z-]+)?|animation(-[a-z-]+)?'
                      r'|box-sizing|user-select|appearance|filter|backdrop-filter|flex(-[a-z-]+)?|order|align-[a-z-]+|justify-[a-z-]+'
                      r'|column(s|-[a-z-]+)|hyphens|tab-size|text-decoration(-[a-z-]+)?|perspective(-origin)?|backface-visibility)$')

COMMENT = re.compile(r'/\*.*?\*/', re.S)
BLOCK = re.compile(r'\{([^{}]*)\}')


def clean_block(body):
    declared = {match.group(1).lower() for match in re.finditer(r'(?:^|[;\s])([a-z][\w-]*)\s*:', body)}
    removed = 0

    def drop(match):
        nonlocal removed
        prefixed = match.group('prop').lower()
        standard = re.sub(r'^-(webkit|moz|ms|o)-', '', prefixed)

        if standard in declared and STANDARD.match(standard):
            removed += 1
            return ''

        return match.group(0)

    body = re.sub(r'\n?[ \t]*(?P<prop>-(?:webkit|moz|ms|o)-[\w-]+)\s*:[^;{}]*;', drop, body)

    return body, removed


def main(paths):
    for path in paths:
        text = open(path, encoding='utf8').read()
        comments = []

        # Keep comments out of the way
        text = COMMENT.sub(lambda match: comments.append(match.group(0)) or f'\0{ len(comments) - 1 }\0', text)
        total = 0

        def block(match):
            nonlocal total
            body, removed = clean_block(match.group(1))
            total += removed
            return '{' + body + '}'

        text = BLOCK.sub(block, text)

        # @-webkit-keyframes x { … } when @keyframes x exists
        names = set(re.findall(r'@keyframes\s+([\w-]+)', text))
        keyframes = 0

        def prefixed_keyframes(match):
            nonlocal keyframes
            if match.group(1) in names:
                keyframes += 1
                return ''
            return match.group(0)

        text = re.sub(r'\n?@-(?:webkit|moz|o)-keyframes\s+([\w-]+)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}\n?', prefixed_keyframes, text)
        text = re.sub(r'\0(\d+)\0', lambda match: comments[int(match.group(1))], text)

        open(path, 'w', encoding='utf8').write(text)
        print(f'{ path }: { total } prefixed declarations, { keyframes } prefixed @keyframes removed')


if __name__ == '__main__':
    main(sys.argv[1:])
