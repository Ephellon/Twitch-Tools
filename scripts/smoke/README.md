# Headless smoke checks

Local checks that load the built extension in Chromium. `playwright-core` is a dev dependency; point `CHROMIUM` at a Chromium or Chrome binary.

```sh
npm run build
CHROMIUM=/path/to/chrome node scripts/smoke/settings.cjs dist/chrome                                    # background + Settings page errors
CHROMIUM=/path/to/chrome node scripts/smoke/settings.cjs dist/chrome scripts/smoke/restore.cjs          # JSON restore end to end
CHROMIUM=/path/to/chrome node scripts/smoke/page.cjs dist/chrome 12000                                  # stubbed twitch.tv page: content-script errors
```

`page.cjs` serves a stub channel page and blocks every other request. Useful environment variables:

- `ENABLE=1` turns on the pilot plugins' settings first.
- `DUMP=1` prints every console line, for diffing two builds.
- `PROBE='<expression>'` evaluates the expression inside the content scripts' isolated world.

The stub doesn't satisfy everything `Initialize()` waits for, so it catches load-time breakage, not feature behaviour.
