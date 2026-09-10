@AGENTS.md

# Session handoff

When explicitly asked to continue previous work, read `HANDOFF.md` if it
exists, and read the applicable instructions in `AGENTS.md`.

Check `git status --short` and `git diff --stat` first, then inspect only the
diffs and files that matter for the task. Prefer targeted inspection over
repeated full-repository scans.

The repository and the current state of the files are the source of truth.
Where they disagree with `HANDOFF.md`, believe the files — the handoff was
written at a moment that has passed.

Preserve existing uncommitted work. Never reset, discard or overwrite it
unless the user explicitly asks.

When explicitly asked to prepare a handoff, replace `HANDOFF.md` with a
concise current version rather than appending to the old one.
