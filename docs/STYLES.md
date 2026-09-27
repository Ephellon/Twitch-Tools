# Styles

## Stylesheets

| File | Loaded on | Holds |
|---|---|---|
| `src/tokens.css` | www.twitch.tv, Settings page (first) | TTV Tools design tokens (`--ttv-*`) |
| `src/core.css` | www.twitch.tv | An archived copy of Twitch's core CSS: `tt-*` utility classes and Twitch's own theme variables (`--color-*`) for dark and light. Treated as vendored |
| `src/extras.css` | www.twitch.tv, Settings page | The extension's shared UI: scrollbars, tooltips, alerts/confirms/prompts, notices, spinners, … |
| `src/settings.css` | Settings page | The Settings page |
| `src/plugins/**/<plugin>.css`, `src/lib/<module>.css` | via `extras.css` | Styles that belong to one feature |

## Tokens

`tokens.css` defines every value the extension's styles share. Use a token instead of repeating a literal:

| Group | Tokens |
|---|---|
| Brand | `--ttv-purple`, `-dark`, `-light`, `-soft` |
| Signals | `--ttv-red`, `--ttv-live-red`, `--ttv-gold`, `--ttv-yellow`, `--ttv-green`, `--ttv-teal`, `--ttv-blue`, `--ttv-sky`, `--ttv-pink`, `--ttv-orange`, `--ttv-grey`, … |
| Neutrals | `--ttv-white`, `--ttv-black`, `--ttv-transparent`; the translucent ones carry their opacity in percent (`--ttv-white-20` is `#ffffff33`) |
| Surfaces | `--ttv-surface-dark`, `-dark-raised`, `-dark-hover`, `--ttv-surface-light`, `-light-dim`, `-light-hover` |
| Shapes | `--ttv-radius-xs` (3px), `-sm` (4px), `--ttv-radius` (0.4rem), `-round` (50%), `-pill` |
| Layers | `--ttv-layer-below`, `-above`, `-raised`, `-overlay`, `-top` (z-index) |
| Timings | `--ttv-quick` (0.1s), `--ttv-medium` (0.25s), `--ttv-slow` (0.3s), `--ttv-slower` (0.5s) |
| Fonts | `--ttv-font`, `--ttv-font-display`, `--ttv-font-live`, `--ttv-font-code` |

Twitch's variables (`--color-background-base`, `--color-text-base`, …) follow the page's theme; use them when a style should match Twitch rather than TTV Tools. `settings.css` keeps its short palette names (`--purple`, `--grey`, …), which now point at the tokens.

## Feature styles

A feature's own styles sit beside its plugin: `src/plugins/<group>/<plugin>.css`. Each one takes the place of a marker in `extras.css`:

```css
/* @include plugins/chat/bttv-emotes.css */
```

The build inlines the file at the marker (`scripts/build.mjs`, `includeStyles`), so the cascade order stays exactly where it was.

## Formatting

The style guide applies, with 4-space indentation and one declaration per line. The build targets Chrome 88+ and Firefox 142+, so don't add vendor prefixes those browsers don't need.

## Tools and checks

- `scripts/smoke/styles.cjs` records every element's computed style on the Settings page, with sample alerts, a confirm, a prompt and a tooltip shown, and all panels open. Run it for dark and light on two builds and diff the files; a refactor should show no differences.
- `scripts/css/tokenize.py` swaps literals for tokens, only exact values, and checks that substituting the tokens back gives the original.
- `scripts/css/dedupe.py` removes what `settings.css` repeats from `extras.css`, only where nothing loaded in between could override it.
- `scripts/css/prefixes.py` drops vendor prefixes the targets don't need, only when the rule also sets the standard property.
- `scripts/css/indent.py` re-indents a stylesheet by nesting depth.
