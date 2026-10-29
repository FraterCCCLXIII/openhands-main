# Nostr / Buzz spike

Date: 2026-10-29. Research only; nothing was installed, run or connected.

## What Buzz is

[Buzz](https://github.com/block/buzz) is Block's open-source workspace for
people and agents ([launch coverage](https://forklog.com/en/block-launches-buzz-an-open-source-platform-for-teams-and-ai-agents/)).
It is Nostr-based, not a Slack-style product with a separate protocol.

- Apache-2.0, Rust, repo created March 2026, public launch July 2026, pushed
  today (very active; about 36k stars). Early: an external review flags
  security as unproven.
- It is a **Nostr relay** speaking NIP-29 groups and NIP-42 auth natively
  ([NOSTR.md](https://github.com/block/buzz/blob/main/NOSTR.md)). Channels are
  NIP-29 groups (`#h` tag), messages kind 9, threads NIP-10 (`e` reply tags),
  reactions NIP-25, profiles kind 0 with NIP-05, DMs NIP-17 gift wrap
  (NIP-04/44 not implemented), search NIP-50, media via Blossom.
- Agents are members, with their own keys and audit trail
  ([README](https://github.com/block/buzz#readme)); agent presence has its own
  kind. Harnesses exist for Goose, Codex and Claude Code. Self-host needs
  Docker, Postgres, Redis, Rust and Node; a pubkey allowlist is supported.
- Its web client depends on `nostr-tools`, so a browser client is proven.

## Nostr mapping for our model

| Ours | Nostr |
|---|---|
| Channel (repo) | NIP-29 group, `h` tag |
| Thread / reply | NIP-10 `e` tag, `reply` marker; root = shared-conversation summary event |
| Mention | `p` tag naming a pubkey |
| Identity | secp256k1 keypair, npub (NIP-19), optional NIP-05 name |
| Agent | its own keypair per agent profile |
| Auth | NIP-42 |
| Private messages | NIP-17 over NIP-44; skip for v1 |

Browser signing needs BIP-340 Schnorr on secp256k1. **Nothing suitable is in
`node_modules`**: only `@noble/hashes` 2.2.0 (transitive) is present; there is
no `@noble/curves`, `nostr-tools` or `@scure`. Candidates (all MIT, audited
noble family, small): `@noble/curves` (secp256k1/schnorr, tree-shakable, tens
of KB) or `nostr-tools` (bundles it, plus NIP helpers, a bit larger). Adding
either needs a pinned dependency and lockfile change, which this pass did not
do.

## Agent as first-class identity, and delivery

Yes in Buzz and in raw Nostr: an agent profile gets a keypair and posts signed
events like a person. Design for a remote reply reaching an owner's agent:
the owner's node subscribes to its channels, sees a reply or `p`-mention of
its agent's pubkey, and queues it as a *pending inbound message*. The owner
approves (or an allowlist rule does) through the existing confirm flow before
it becomes a user message to the Agent Server. Nothing is injected without
that consent. Signing and verification belong in the node, not the relay.

## Risks

- **Leaking private work**: publish allow-listed summary fields only,
  redacted; never raw events. Opt-in per conversation.
- **Impersonation**: verify event signatures client-side; map pubkey to
  display name locally (petnames), do not trust claimed names or NIP-05 alone.
- **Prompt injection**: remote text is untrusted input to an agent; keep the
  approval gate, mark origin, no auto-execution.
- **Key custody**: keys must live in the OS keychain or the node, never in
  localStorage.
- **Hosting cost and maturity**: a Buzz relay is heavy (Postgres, Redis); the
  project is young and fast-moving, so pin versions.

## Recommendation

Use **Buzz as the first network adapter, speaking plain NIP-29/NIP-10/NIP-42**
(no Buzz-only kinds such as 40002/40003), so any NIP-29 relay works and we
avoid lock-in. Not raw Nostr alone: Buzz already supplies the relay,
membership, agent presence and a self-host path. Keep Matrix as the fallback
only if relay hosting proves unworkable.

## Next step

1. Approve adding one pinned dependency (`@noble/curves`, or `nostr-tools`).
2. Build a NIP-29 adapter behind `ChatTransport` (`src/chat-transport/`),
   read-only first, against a local Buzz relay in dev. Keys in the OS
   keychain via the Electron shell.
3. Then summary-card publish (redacted), then mention delivery with approval.
