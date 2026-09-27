"""/scripts/css/tokenize.py
Rewrites literal values in the extension's stylesheets as `var(--ttv-…)` tokens from src/tokens.css.

Only exact matches are replaced (colors compared by value, so `#fff` and `#ffffff` are the same), which
keeps every computed value identical. The script checks itself: substituting the tokens back must give
the original declarations.

    python3 scripts/css/tokenize.py src/extras.css src/settings.css
"""

import re
import sys

TOKENS_FILE = 'src/tokens.css'

# Properties whose whole value (or duration parts) map to shape, layer, timing and font tokens
PROPERTY_TOKENS = {
    'border-radius': 'radius',
    'z-index': 'layer',
    'font-family': 'font',
}

COMMENT = re.compile(r'/\*.*?\*/', re.S)
HEX = re.compile(r'(?<![\w-])#([0-9a-fA-F]{3,8})\b')
DURATION = re.compile(r'(?<![\w.-])(\d*\.?\d+)s\b')


def expand(hex_value):
    """#rgb / #rgba / #rrggbb / #rrggbbaa → #rrggbbaa (lowercase), or None."""
    digits = hex_value.lower().lstrip('#')

    if len(digits) in (3, 4):
        digits = ''.join(char * 2 for char in digits)
    if len(digits) == 6:
        digits += 'ff'

    return '#' + digits if len(digits) == 8 else None


def read_tokens():
    """Token name → value, from src/tokens.css."""
    text = COMMENT.sub('', open(TOKENS_FILE, encoding='utf8').read())

    return dict(re.findall(r'(--ttv-[\w-]+)\s*:\s*([^;]+);', text))


def tables(tokens):
    colors, values, durations = {}, {}, {}

    for name, value in tokens.items():
        value = value.strip()
        color = expand(value) if re.fullmatch(r'#[0-9a-fA-F]{3,8}', value) else None

        if color:
            colors.setdefault(color, name)
        elif re.fullmatch(r'\d*\.?\d+s', value):
            durations.setdefault(float(value[:-1]), name)
        else:
            values.setdefault(value, name)

    return colors, values, durations


def rewrite_value(prop, value, colors, values, durations):
    """One declaration's value, with literals swapped for tokens."""
    core = re.sub(r'\s*!important$', '', value.strip())
    kind = PROPERTY_TOKENS.get(prop)

    # Whole-value tokens: radius, layer, font
    if kind:
        name = values.get(core)

        if name and name.startswith(f'--ttv-{kind}'):
            return value.replace(core, f'var({ name })', 1)

    # Leave quoted strings and url() alone
    parts = re.split(r'("[^"]*"|\'[^\']*\'|url\([^)]*\))', value)

    for index in range(0, len(parts), 2):
        part = HEX.sub(lambda match: f'var({ colors[expand(match.group(0))] })' if expand(match.group(0)) in colors else match.group(0), parts[index])

        if prop.startswith('transition') or prop.startswith('animation'):
            part = DURATION.sub(lambda match: f'var({ durations[float(match.group(1))] })' if float(match.group(1)) in durations and float(match.group(1)) > 0 else match.group(0), part)

        parts[index] = part

    return ''.join(parts)


def rewrite(text, colors, values, durations):
    """Rewrites every declaration outside comments; custom-property definitions included.
    A selector's `a:hover` never matches: a declaration's value can't run into a `{`."""
    out, position = [], 0

    for comment in list(COMMENT.finditer(text)) + [None]:
        end = comment.start() if comment else len(text)
        chunk = text[position:end]

        chunk = re.sub(
            r'(?P<prop>(?<![\w-])[-\w]+)(?P<colon>\s*:\s*)(?P<value>[^;{}]+?)(?P<end>\s*[;}])',
            lambda match: match.group('prop') + match.group('colon')
                + rewrite_value(match.group('prop').lower(), match.group('value'), colors, values, durations)
                + match.group('end'),
            chunk,
        )

        out.append(chunk)

        if comment:
            out.append(comment.group(0))
            position = comment.end()

    return ''.join(out)


def resolve(text, tokens):
    """Substitutes tokens back, and normalizes colors, for the self-check."""
    text = re.sub(r'var\((--ttv-[\w-]+)\)', lambda match: tokens[match.group(1)].strip(), text)

    text = re.sub(r'(?<![\w.])\.(\d)', r'0.\1', text)        # `.3s` is `0.3s`

    return HEX.sub(lambda match: expand(match.group(0)) or match.group(0), text)


def main(files):
    tokens = read_tokens()
    colors, values, durations = tables(tokens)

    for path in files:
        original = open(path, encoding='utf8').read().replace('\t', '    ')
        rewritten = rewrite(original, colors, values, durations)

        if resolve(rewritten, tokens) != resolve(original, tokens):
            sys.exit(f'{ path }: self-check failed; not written')

        open(path, 'w', encoding='utf8').write(rewritten)
        print(f"{ path }: { rewritten.count('var(--ttv-') } tokens")


if __name__ == '__main__':
    main(sys.argv[1:])
