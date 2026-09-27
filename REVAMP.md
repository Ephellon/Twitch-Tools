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

### 1. Inventory ✅
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): what runs where, layers, the feature pattern, settings lifecycle, bootstrap, persistence, messaging.
- [`docs/FEATURES.md`](docs/FEATURES.md): every Settings option → the code that reads it.
- [`docs/sections/`](docs/sections/): per-file digests of all 110 chunks (purpose, triggers, definitions, dependencies, Twitch coupling, storage/messaging), from `gemma4:31b-cloud` plus script-extracted facts.
- [`docs/triage/offser-bug-candidates.md`](docs/triage/offser-bug-candidates.md): 163 unverified bug candidates from 101 chunks — Phase 2 input.
- Pipeline in `scripts/offser/` (reproducible).
- Findings along the way:
  - Settings read in code with no UI: `auto_badge`, `claim_reward`, `game_overview_card`, `phone_number`.
  - `simplify_chat_reverse_emotes` has a control but is never read by name.
  - `tools.js` ~L13811–14154 holds banner-only stubs for features that now live in `chat.js`.

### 2. Bug triage & fixes ✅
- Offser candidates + ESLint verified; ~45 fixes landed. Record: [`docs/triage/TRIAGE.md`](docs/triage/TRIAGE.md).
- GitHub issues triaged; #53, #31 fixed; reload policy (#18/#40/#43) is defer-when-hidden + 2-min respawn cap. Up Next and live-DOM issues carried into Phase 4.
- Seeded by Phase 0:
  - ESLint: `no-dupe-keys` (tools.js 11574 `user2`, time-zone table), `no-unsafe-optional-chaining` (tools.js 11282, 11897), `getter-return` (tools.js 4447), `no-unassigned-vars` (`FIRST_IN_LINE_WARNING_TEXT_UPDATE`), `no-fallthrough` (core.js 704, tools.js 1175), `no-unreachable` ×12, and ~139 `no-undef` (e.g. `tab` in background.js, `streamer`/`video`/`action` in tools.js, `RestartJob`/`TTV_IRC` visibility).
  - core.js 2497: `let browser` shadows the global, so the `browser` namespace is never detected.
  - Old release zips used Windows `\` paths and shipped a local `-test.js`.
- Fix only bugs that are isolated now; defer ones entangled with shared state to Phase 4 when the feature is moved.

### 3. Core extraction + plugin contract ✅
- Source moved to `src/`; load `dist/chrome` (`npm run build` / `npm run watch`).
- Shared helpers moved verbatim from `tools.js` into `src/lib/` ES modules, bundled by esbuild into `lib.js`, and published on `globalThis` for the legacy scripts.
- Plugin format: `TTV.plugin({ id, timer, handler, unhandler, setup, enabled, frames, settings })` in `src/lib/plugins.js`, started by `TTV.start('main', { StopWatch })` in `Initialize()`. See [`docs/PLUGINS.md`](docs/PLUGINS.md).
- Pilot plugins: Auto-Join, Kill Extensions, View Mode (`src/plugins/automation/`).
- Checks: registry unit tests (`src/lib/tests/`), plus a headless Chromium check that compares content-script output on a stubbed twitch.tv page before and after (local only; Twitch itself isn't reachable from CI).

### 4. Plugin migration ✅ (mechanical move)
- Every feature is a plugin: 71 files under `src/plugins/`, in four bundles (`lib.js`, `chat-plugins.js`, `player-plugins.js`, `clips-plugins.js`). Each one runs where its code used to be (`await TTV.run(id, PLUGIN_CONTEXT)`).
- Legacy scripts, 26.7k → 6.5k lines: `tools.js` 18.4k → 5.1k, `chat.js` 4.45k → 1.03k, `player.js` 471 → 222, `clips.js` 316 → 207.
- Tools: `scripts/sections.mjs` (section map), `scripts/promote.mjs` (shared variables), `scripts/migrate.mjs` (move a section; `--live` for chat.js's own scope).
- Checks per batch: esbuild in strict mode, lint (`no-undef` as modules), registry tests, and headless parity against the previous build. Parity covered a stub channel page, pop-out chat, player and clips: same jobs, same errors.
- Strict-mode fixes that came up: `delete channel;` no-ops removed, `private` renamed, Recover Chat's dead fallback fixed.
- Up Next fixes: reordering now resets the queue (`jobs[0].href` was `undefined`); the Stay Live fallback warning shows. Prevent Hosting removed.
- **Still to do:** convert installed plugins to the structured form as features are touched; the remaining Up Next and live-DOM issues (see `docs/triage/TRIAGE.md`).

### 5. Settings UI from plugin metadata
- Generate option rows from each plugin's `settings` block instead of hand-written HTML; keeps the JSON export/restore from #58 working.

### 6. Styling
- **Code style ✅ (side quest):** [docs/STYLEGUIDE.md](docs/STYLEGUIDE.md) is locked in, enforced by the house ESLint rules in `scripts/eslint/style.mjs`, and `npm run format` has been applied everywhere. Owner choices:
  - ternary `?`/`:` lead their lines;
  - declarations are comma-first;
  - `void null` replaces `undefined`;
  - quotes follow their meaning;
  - switch cases use `{ } break;`;
  - JSDoc headers on named and top-level functions (Offser drafts them).
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

- **Reloads:** hidden tabs defer reloads until visible; background respawns are capped at one per tab per 2 min.
- **Stop/Prevent Hosting:** removed in Phase 4 (Twitch dropped hosting in 2022).
- **Tooltip `from: 'down'`:** revisit in Phase 6.
- **Version:** the revamp ships as **v6** (manifest bump happens at release, Phase 8).
- **Plugins:** both — built-in features become plugins (Phases 3–4), user plugins via TTV DSL (Phase 7).
- **Build step:** allowed. Source stays in `ttv-tools/` (still loads unpacked as-is); `scripts/build.mjs` produces `dist/`. esbuild joins in Phase 3 when plugins get real `import`s.
- **Browsers:** Chrome + Firefox — build emits a Chrome MV3 manifest and a Firefox variant (`browser_specific_settings`, background `scripts` fallback); `chrome.*` calls go through one compat shim.
- **Formatting:** match the hand style, applied per file as it moves. Prettier can't print `if(` or trailing `?`/`:` ternaries, so ESLint `@stylistic` does the formatting instead.
