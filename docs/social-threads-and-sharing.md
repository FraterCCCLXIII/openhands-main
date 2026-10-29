# Sharing and social threads across OpenHands nodes: design

Status: spike done ([`nostr-buzz-spike.md`](nostr-buzz-spike.md)) and phase 2 groundwork
built in `src/chat-transport/` (interface, identity directory, local adapter,
no network). The feed UI is not rewired yet and still reads the local
simulation. Next: a NIP-29 adapter (needs a signing dependency).

This builds on [`team-chat-layer.md`](team-chat-layer.md), which already
decides the principles, the conversation-to-chat model and the transport
options. Read that first. This doc adds what that one leaves open: sharing a
conversation with another person's node, threaded replies and @mentions across
nodes, and profiles.

## Goal

Let people who run OpenHands, each on their own node, share work and talk about
it in threads, with agents as first-class participants, without a central
server that owns the conversations.

A **node** is one person's OpenHands install: their Agent Server, their
conversations and their Canvas.

## What exists today

All of it lives in the browser. None of it is shared.

| Piece | Where | State |
|---|---|---|
| Simulated teammates, factories, per-card chatter | `src/utils/feed-team-demo.ts` | Deterministic from the conversation id |
| Replies and @mentions | `feed-team-thread.tsx`, `feed-thread-reply-box.tsx`, `src/stores/feed-replies-store.ts` | Persisted in localStorage |
| Profiles (`/feed/people/:id`) | `feed-profile.tsx` | Built from the simulated thread and stored replies |
| Contacts and filters | `feed-contacts-sidebar.tsx`, `src/stores/feed-filter-store.ts` | Local |
| Custom project icons | `src/stores/feed-project-icons-store.ts` | Local |

The UI shape (threads as reply trees, mentions, per-person profile pages) is
the part worth keeping. The data underneath needs to change.

## Principles

These repeat `team-chat-layer.md` with one addition.

1. The OpenHands conversation is the source of truth. A shared thread is a
   projection of it, not a second history.
2. Do not build a chat protocol. Hide the transport behind a small interface.
3. Every person and agent has a stable, attributable identity.
4. **Sharing is opt-in and explicit, per conversation.** A node never publishes
   a conversation because it is mentioned in one.

## Identity

- One keypair per person per node, and one per agent profile.
- The public key is the id behind `/feed/people/:id`. Today that route takes a
  simulated teammate id; it would take a key or a handle resolved to one.
- An agent's identity is the profile's key, not the model. "Atlas" is the same
  author on every node that has seen it.
- Nostr and Matrix both give an identity story. Nostr's is native (a keypair).
  Matrix would need an account per agent.

## Transport

Keep the interface from `team-chat-layer.md`:

```ts
interface ChatTransport {
  subscribe(channel: ChannelId, onMessage: (m: ChatMessage) => void): Unsubscribe;
  post(channel: ChannelId, msg: OutgoingMessage): Promise<void>;
  members(channel: ChannelId): Promise<Member[]>;
  identity(): Identity;
}
```

Order of adapters:

1. **Local only** (default). This is today's behaviour, backed by the same
   store, so nothing changes for people who do not opt in.
2. **Nostr, group chats (NIP-29)**, or **Buzz** if its licence and API hold up
   in the spike. Native keypair identity and threads, no central server, a
   relay per group.
3. **Matrix** as the mature fallback if relay hosting is a problem.

End-to-end encryption is out of scope for v1. Agents must read history, which
conflicts with it.

## Sharing flows

### Share a conversation

1. The owner picks **Share** on a feed card and chooses a channel (a repo, per
   `team-chat-layer.md`).
2. The node publishes a **summary event**: title, author identity, repo, status,
   diff stats and a link. It does not publish the event stream.
3. Other nodes in the channel see a card in their feed. Opening it shows the
   summary and the thread. Seeing the full conversation requires the owner to
   grant it, per person.

Redaction runs before anything leaves the node. Conversations contain secrets,
tokens, file contents and private repo names. The summary is built from an
allow-list of fields, never from raw events.

### Thread on a shared conversation

- A reply in the thread is a `ChatMessage` with a `parent` id. This matches the
  reply tree the UI already renders.
- An @mention names an identity. It resolves to a person or an agent profile,
  not to a free-text handle.
- A reply addressed to the owner's agent is delivered to the owner's node as a
  user message, subject to the existing approval flow. A remote person cannot
  make someone else's agent act without that node's consent.

### Follow a person

Following subscribes to a person's shared channels and shows their cards in the
feed, grouped under their profile. A profile page lists their shared messages,
which is the same list the page builds today from local data.

## Who owns what

Per `AGENTS.md`:

| Concern | Repo |
|---|---|
| Feed UI, profile pages, local stores, the transport adapter | `OpenHands/OpenHands` (Canvas) |
| New Agent Server events, endpoints or schemas (share events, signed messages) | `OpenHands/software-agent-sdk` |
| Reusable channel gateway code, if reused | Kosmos (`server/channels`), per `team-chat-layer.md` |

Canvas must not reimplement an Agent Server contract. Anything that needs the
server to sign, verify or persist a share event goes to the SDK first.

## Canvas changes

1. Replace the simulated data in `feed-team-demo.ts` with a `ChatTransport`
   read model. Keep the simulation as the local-only adapter and as test data.
2. Move reply storage behind the transport. `feed-replies-store.ts` becomes a
   cache, not the owner.
3. Resolve profile ids and @mentions through the identity directory.
4. Add **Share** to `feed-card-menu.tsx` and a per-conversation sharing state.
5. Raise `compatibility.minimumAgentServer` in `config/defaults.json` if a new
   Agent Server field is required (see the shared change checklist in
   `AGENTS.md`).

## Phases

1. **Spike** (1–2 days), from `team-chat-layer.md`: Buzz licence and API,
   whether an agent can post as a first-class identity, Kosmos's Matrix
   adapter, and how far its OpenHands link goes.
2. **Local identity and transport interface.** No network. Profiles and
   mentions resolve through identities. Ships behind the same UI.
3. **One real transport**, one channel per repo, summary cards only.
4. **Threads and mention delivery** to the owner's agent through the approval
   flow.
5. **Full-conversation grants** and following.

## Risks

- **Leaking private work.** Mitigated by opt-in sharing, allow-listed summary
  fields and redaction. This is the highest risk and needs its own review.
- **Impersonation.** Mitigated by signed messages and key-based identity.
- **Remote prompt injection.** A shared thread is untrusted input to an agent.
  Replies delivered to an agent must be treated as data, not instructions, and
  go through approval.
- **State divergence.** Decide up front which side wins on edits and deletes
  (open question below).
- **Relay or homeserver cost** for self-hosters.

## Open questions

- Does Canvas depend on Kosmos's gateway, or keep a thin adapter of its own?
- Is a channel a repo, or a repo plus branch?
- On an edit or delete, does the conversation or the chat win?
- Can a person's identity span several nodes, and how are keys backed up?
- Who may follow whom: open, mutual, or per-channel membership?
