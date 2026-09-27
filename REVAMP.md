# TTV Tools — Revamp Plan

Living plan for the multi-week revamp. One phase at a time; each phase ends in small, reviewable commits on `claude/trusting-gauss-7hxa5n` (or a branch per phase).

## Where things stand (2026-09-27, v5.35.3.3)

| Area | State |
|---|---|
| `tools.js` | 18.4k lines. Every feature is `Handlers.x` / `Unhandlers.x` / `Timers.x` + a labeled `__X__: if(Settings.x) RegisterJob('x')` block, all inside one `Initialize()` closure sharing closure-scoped globals. ~99 handlers. |
| `chat.js` | 4.4k lines, same pattern (~59 handlers). |
| `core.js` | 2.7k lines: `Settings`, `Jobs`/`Timers`/`Handlers`/`Unhandlers`/`Limbo`, `RegisterJob`, shared helpers. |
| `settings.html/js/css` | 2.7k + 3k + 2.2k lines, hand-written per option. |
| CSS | `core.css` 10k lines, `extras.css` 1.9k — no tokens/variables layer. |
| `dsl/` | TTV DSL v2 — spec, grammar, 208 passing tests, **not loaded by the extension yet**. |
| `ext/` | Vendored libs (polyfill, localforage, sortable, resemble, tracking + minified face/eye/mouth). |
| Repo hygiene | `ttv-tools.zip` (1.5 MB) and screenshots committed at root; no CI, no lint/format config. |
| Known issues | Listed in `CHANGELOG.md` → "To-Do & Known Issues". |

## Phases

### 0. Baseline & tooling ✅
- `.editorconfig`; ESLint flat config (`eslint.config.mjs`) with `@stylistic` rules matching the hand style. Cross-file globals are derived from `manifest.json` + `settings.html`, so no hand-kept list. Legacy findings are warnings; `npm run format -- <file>` applies the style to one file.
- `scripts/build.mjs`: `ttv-tools/` → `dist/chrome/` + `dist/firefox/` (Firefox manifest rewritten), `--zip` writes `dist/ttv-tools.zip` + `dist/ttv-tools-firefox.zip` with a built-in zip writer (no platform `zip` needed, forward-slash paths).
- `.github/workflows/ci.yml`: DSL tests, lint, build, `web-ext lint` on every push/PR; attaches both zips when a release is published. `ttv-tools.zip` removed from git.
- `pre-revamp` tag on `a51f2a8`.
- Commands: `npm test`, `npm run lint`, `npm run build [-- --zip]`, `npm run lint:firefox`.

### 1. Inventory (Offser-heavy)
- Offser digests each `/*** Section` of `tools.js`/`chat.js` into a **feature catalog**: id, settings keys, timers, selectors, shared globals read/written, cross-feature calls, frame(s) it runs in.
- Output: `docs/FEATURES.md` + `docs/ARCHITECTURE.md` (frames → scripts, Settings flow, background messaging, storage keys).
- This catalog is the dependency map that drives Phases 3–4.

### 2. Bug triage & fixes
- Merge sources: CHANGELOG known issues, GitHub issues, Offser per-section bug scans (verified by me before touching code).
- Seeded by Phase 0:
  - ESLint: `no-dupe-keys` (tools.js 11574 `user2`, time-zone table), `no-unsafe-optional-chaining` (tools.js 11282, 11897), `getter-return` (tools.js 4447), `no-unassigned-vars` (`FIRST_IN_LINE_WARNING_TEXT_UPDATE`), `no-fallthrough` (core.js 704, tools.js 1175), `no-unreachable` ×12, and ~139 `no-undef` (e.g. `tab` in background.js, `streamer`/`video`/`action` in tools.js, `RestartJob`/`TTV_IRC` visibility).
  - core.js 2497: `let browser` shadows the global, so the `browser` namespace is never detected.
  - Old release zips used Windows `\` paths and shipped a local `-test.js`.
- Fix only bugs that are isolated now; defer ones entangled with shared state to Phase 4 when the feature is moved.

### 3. Core extraction + plugin contract
- Split shared helpers (balloon, card, context menu, search, video quality/volume/view mode, SI parsing…) out of `tools.js` into `lib/*.js`.
- Define the plugin contract, e.g.:
  ```js
  TTV.plugin({
      id: 'auto_accept_mature',
      frames: ['main'],
      settings: { auto_accept_mature: { type: 'bool', default: true, label: '…', group: 'Automation' } },
      timer: 5000,
      handler() { … },
      unhandler() { … },
      init(ctx) { … },          // replaces the labeled __X__ block
  });
  ```
- Loader keeps `RegisterJob`/`Limbo` semantics so behavior is unchanged.

### 4. Plugin migration (one feature per commit)
- Move sections into `plugins/<group>/<id>.js`, apply the formatter as each file moves.
- Order: self-contained first (Auto-Join, Stay Live, Stop Raiding, Kill Extensions…) → chat features → Points/Rewards → Auto DVR / Recovery → First in Line / Up Next last.
- `tools.js`/`chat.js` shrink to bootstrap; delete when empty.

### 5. Settings UI from plugin metadata
- Generate option rows from each plugin's `settings` block instead of hand-written HTML; keeps the JSON export/restore from #58 working.

### 6. Styling
- CSS custom-property token layer (colors, spacing, radii, fonts) shared by `core.css`, `extras.css`, `settings.css`.
- Per-plugin CSS where styles are feature-specific; dedupe the rest.

### 7. User plugins via TTV DSL
- Load `dsl/` in the extension, add a script editor/manager in Settings, wire host calls to the plugin API.

### 8. Documentation & release
- JSDoc for remaining files, README + wiki refresh, CONTRIBUTING (how to write a plugin), CHANGELOG, version bump.

## Offser usage

| Job | Model |
|---|---|
| Section digests / feature catalog | `gemma` |
| Bug scans per section | `gpt120` (cross-check with `nemou` on hot spots) |
| Mechanical rewrites into plugin format | `nemos`, reviewed + tested by Claude before commit |
| JSDoc drafting | `gemma` |

All Offser output is treated as a draft — verified against the code before it lands.

## Decisions

- **Version:** the revamp ships as **v6** (manifest bump happens at release, Phase 8).
- **Plugins:** both — built-in features become plugins (Phases 3–4), user plugins via TTV DSL (Phase 7).
- **Build step:** allowed. Source stays in `ttv-tools/` (still loads unpacked as-is); `scripts/build.mjs` produces `dist/`. esbuild joins in Phase 3 when plugins get real `import`s.
- **Browsers:** Chrome + Firefox — build emits a Chrome MV3 manifest and a Firefox variant (`browser_specific_settings`, background `scripts` fallback); `chrome.*` calls go through one compat shim.
- **Formatting:** match the hand style, applied per file as it moves. Prettier can't print `if(` or trailing `?`/`:` ternaries, so ESLint `@stylistic` does the formatting instead.
