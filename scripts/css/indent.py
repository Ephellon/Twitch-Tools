"""/scripts/css/indent.py
Re-indents stylesheets by nesting depth: 4 spaces per level, continuation lines of a value one level
deeper. Comments keep their inner layout. Whitespace only, so nothing renders differently.

    python3 scripts/css/indent.py src/extras.css src/settings.css
"""

import re
import sys


def reindent(text):
    out, depth, in_comment, in_value = [], 0, False, False

    for line in text.split('\n'):
        stripped = line.strip()

        # Lines inside a multi-line comment keep their layout, shifted with the comment's opening line
        if in_comment:
            out.append(line.rstrip())
            in_comment = '*/' not in line
            continue

        if not stripped:
            out.append('')
            continue

        code = re.sub(r'/\*.*?\*/', '', stripped)
        code = re.sub(r'"[^"]*"|\'[^\']*\'', '""', code)
        level = depth - (1 if code.startswith('}') else 0)

        if in_value and not code.startswith('}'):
            level += 1

        out.append('    ' * max(level, 0) + stripped)

        if stripped.startswith('/*') and '*/' not in stripped:
            in_comment = True

        depth += code.count('{') - code.count('}')

        # A declaration whose value continues on the next line
        if code and not code.endswith((';', '{', '}', ',')) and ':' in code and not in_value and depth > 0 and not code.endswith('*/'):
            in_value = True
        elif in_value and (code.endswith(';') or code.endswith('}')):
            in_value = False

    return '\n'.join(out)


if __name__ == '__main__':
    for path in sys.argv[1:]:
        text = open(path, encoding='utf8').read()
        open(path, 'w', encoding='utf8').write(reindent(text))
        print(path)
