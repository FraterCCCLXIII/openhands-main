# Team chat layer (Slack replacement) — plan

Status: Buzz/Nostr spike written ([`nostr-buzz-spike.md`](nostr-buzz-spike.md)); transport interface, identity directory and local adapter exist in `src/chat-transport/` (no network). Next: a NIP-29 adapter against a local Buzz relay, once a signing dependency is approved.

## Goal

Give people and agents a shared place to talk about work on a shared repo,
without depending on Slack, and without a second copy of the conversation
history.

## Principles

1. **The OpenHands conversation is the source of truth.** The Agent Server
   event stream stays authoritative. Chat is a projection of it, not a store.
2. **Don't build a chat protocol.** Transport, presence and moderation are
   commodities. Our value is agents working on shared repos.
3. **Hide the protocol behind a small interface** so backends can be swapped.
4. **Every agent has a stable, attributable identity** (one keypair or user per
   agent profile), regardless of transport.

## Model

| Chat concept | OpenHands concept |
|---|---|
| Channel | Shared repo (or repo + branch) |
| Thread | Conversation |
| Message from agent | Agent event (status, diff, PR link) posted into the thread |
| Human reply in thread | User message sent to the agent |
| Approval in chat | Existing confirm flow (`/approve`, `/deny`) |

## Transport interface (sketch)

```ts
interface ChatTransport {
  subscribe(channel: ChannelId, onMessage: (m: ChatMessage) => void): Unsubscribe;
  post(channel: ChannelId, msg: OutgoingMessage): Promise<void>;
  members(channel: ChannelId): Promise<Member[]>;
  identity(): Identity;
}
```

Adapters, in order: local-only (default), Matrix, Buzz / Nostr.

## Options considered

| Option | Fit | Catch |
|---|---|---|
| Buzz (Block, Nostr) | Closest to the goal: channels, threads, DMs, workflows, a cryptographic identity per human and agent. Launched July 2026. | Described as early-stage. API and event schema unverified. Overlaps with OpenHands on code repos. |
| Raw Nostr, NIP-29 groups | Relay-hosted groups with membership and moderation. | UI is ours to build. A group is tied to its relay. |
| Marmot / White Noise (MLS over Nostr) | End-to-end encrypted, audited April 2026. | E2EE conflicts with agents reading history. No agent support found. |
| Matrix, Zulip, Mattermost | Mature, self-hostable. Zulip's topics map well to conversations. | Heavy to run. Own identity models. |
| Slack / Discord bridge | Cheapest. | Not a replacement. OpenHands doesn't own the data. |

## Where to build it

- **Kosmos** (`Kosmos-computer/Kosmos`) already has a channel gateway
  (`server/channels`) with Slack, Discord, Matrix, Mattermost, IRC and Nostr
  (NIP-04 DMs only) adapters, pairing and mention-gating policy, per-chat
  sessions, queued turns, `/approve`, a stubbed Groups app, and an OpenHands
  client in `server/openhands`. Recommended home for the transport and bridge.
- **Canvas** reuses the feed components (`feed-card`, `feed-composer`,
  `feed-card-reply`, `feed-notification-card`) for a channel view and links to
  or embeds it. Canvas does not reimplement the transport.
- **software-agent-sdk** owns any new Agent Server endpoint or event contract.
  Per `AGENTS.md`, do not reimplement those in Canvas.

## Spike (1-2 days)

- [ ] Buzz: license, API / NIP surface, can an agent post as a first-class
      identity, self-hosting cost.
- [ ] Kosmos Matrix adapter: does it handle threads and multi-user rooms?
- [ ] Kosmos `server/openhands/openhandsAgent.ts`: how far does the OpenHands
      link go (turns, events, approvals)?
- [ ] Decide on E2EE: needed, or is attributable self-hosted chat enough?
      (Recommend skipping E2EE for v1.)

## Sequence

1. Spike (above).
2. Wire the Kosmos Groups app to a real backend: Matrix, one room per repo,
   one thread per conversation.
3. Add the OpenHands bridge: agent events into the thread, thread replies back
   as user messages, approvals through the existing flow.
4. Link from Canvas: channel link or embedded view on the conversation feed.
5. Add a Buzz or NIP-29 adapter if the spike supports it.

## Risks

- Matrix is heavy to self-host. Mattermost is the lighter fallback.
- Bridging mirrors state. Decide up front which side wins on edits and deletes.
- Cross-repo dependency: contract changes belong in `software-agent-sdk`.
- E2EE and agents reading history pull in opposite directions.

## Open questions

- Should Canvas depend on Kosmos, or stay independent with a thin adapter?
- Is the channel unit a repo, or repo + branch?
