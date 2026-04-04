# Adding integrations skill

This repository-specific skill helps agents add new integrations to the OpenHands Context Layer codebase.

## When to use it

Use this skill when a task involves:

- adding a new provider
- choosing between MCP and HTTP/OpenAPI
- wiring OAuth, API-key, bearer-token, or basic-auth defaults
- validating that a new connector actually works end to end

## Files

- [`SKILL.md`](./SKILL.md) — agent-facing implementation and validation workflow

## What it covers

- how to gather provider information before coding
- which existing integration pattern to copy
- which source files usually need changes
- when runtime or OAuth plumbing changes are actually justified
- how to validate discovery, install flow, and real tool invocation

## Best reference PRs

The skill points agents to the strongest recent examples in this repo:

- [#32 Add ElevenLabs managed connector support](https://github.com/OpenHands/context-layer/pull/32)
- [#33 Use Slack's official hosted MCP connector defaults](https://github.com/OpenHands/context-layer/pull/33)
- [#46 Add Ordinal MCP as a supported provider](https://github.com/OpenHands/context-layer/pull/46)
- [#64 Add Webflow managed MCP integration](https://github.com/OpenHands/context-layer/pull/64)
- [#74 Fix Webflow MCP OAuth registration flow](https://github.com/OpenHands/context-layer/pull/74)

If you are a human contributor, start with [`SKILL.md`](./SKILL.md); it is written to be useful to both agents and maintainers.