---
name: custom-codereview-guide
description: Repository-specific guidance for automated PR code review.
triggers:
- /codereview
---

# Integrations Hub Code Review Guidance

When reviewing stacked catalog migration PRs, apply this project context:

- It is acceptable for a downstream PR to pin `@openhands/extensions` to a
  commit on a companion extensions PR when the PR is explicitly part of a
  coordinated stack. Do not require a published npm version or merged main
  commit for the intermediate review state; require only that the dependency
  is pinned to an immutable full commit SHA and that the PR description names
  the dependency PR.
- The MCP/integrations catalog surface is pre-release. Backward compatibility
  with the previous MCP catalog shape is not required unless the diff changes
  persisted user data or an established production API.
- Do not treat historical notes in `AGENTS.md` as evidence that the current
  diff removed compatibility. Require a migration only when this PR modifies
  the relevant storage schema, stored record fields, or runtime readers.
- Generated snapshots checked into `backend/app/` should have both a generation
  script and a CI drift check.
