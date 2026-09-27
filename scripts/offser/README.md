# Offser digest pipeline

Regenerates `docs/FEATURES.md`, `docs/sections/*.md` and `docs/triage/offser-bug-candidates.md` by sending the source, in chunks, to an Offser model. Run from the repo root; `OFFSER_TOKEN` must be set. Work files go to `.offser/` (git-ignored; override with `OFFSER_WORK`).

```sh
python3 scripts/offser/chunk.py                     # split sources into ≤800-line chunks at section boundaries
python3 scripts/offser/submit.py gemma4:31b-cloud   # queue every chunk (resumable; records .offser/submitted.json)
python3 scripts/offser/fetch.py ttv-p1b- 110 30000  # poll until all replies land in .offser/out2/
python3 scripts/offser/settings_parse.py            # Settings page → .offser/settings.json
python3 scripts/offser/aggregate.py                 # write the docs
```

A reused slug continues that Offser conversation, so change the slug prefix in `submit.py` before re-running a batch.
