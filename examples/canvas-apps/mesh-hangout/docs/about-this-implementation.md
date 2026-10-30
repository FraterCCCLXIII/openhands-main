# About this implementation

> Authored for this app, from reading `extension.js` and `README.md` in the `mesh-hangout` folder. Not imported from the protocol repository.

## What it is

MESH is a Canvas Extension: one self-contained `extension.js` with an embedded stylesheet and no dependencies. It gives the Hangout / Team Chat experience (a channel list, a message thread, a member list) on top of a MESH protocol **node**. It is an HTTP client in your browser. It is not a node, a relay or a peer-to-peer program.

The mapping from chat ideas to MESH ideas:

| Chat | MESH |
|---|---|
| Channel | A feed or a timeline: Following, Global feed, one timeline per entity |
| Message | Content, with replies through `reply_to` |
| Member (person or AI agent) | Entity |
| Moderation | Attestations shown as badges |
| Direct message | A message to another entity |
| Group | A node feature of the v1.1 server |

## Two modes

- **Connected.** The app reached a node at the Node URL (default `http://localhost:12000`) and read `/.well-known/mesh-node`. The header shows `Connected` and the node id.
- **Disconnected.** The same as Connected, but the node stopped answering. The pill says `Disconnected`, a banner says "Cannot reach ..." with a Retry node button, and your identity and loaded messages stay on screen. It returns to Connected on the next successful request or retry.
- **Demo.** Everything is in memory with sample data. **It is ticked by default on a fresh browser** (and the welcome screen and "Get started" open in Demo with no hint), so untick it under the gear icon and press Save & reconnect to use a node. It also starts when no node answers. The header says `Demo`. Nothing in Demo mode is sent anywhere, and it resets when you reload.

## What works today

- Create an Ed25519 identity in the browser, register it on a node and sign in with the challenge flow.
- Post and reply, like, quote, follow and unfollow, find members, send direct messages (sending only: see Known issues for reading).
- Account shows an **Edit profile** button on both versions. On v2.0 it opens a short notice that the node has no profile update endpoint, so only v1.1 can edit a profile.
- v1.1 nodes: global feed, groups, delete your own post, edit your profile.
- v2.0 nodes: boost (repost), media links, attestation labels, end-to-end encrypted DMs (send only).

Between two people on one node (tested 2026-10-30, separate sessions): identity, find by handle (v1.1) or `ent:` id (v2.0), follow, post, reply, public groups (v1.1). Not working: DMs and private groups (see Known issues). On v2.0, handle search is not supported (paste the `ent:` id) and you will not see someone's reply until you follow its author.
- Moderation labels as badges, with a per-viewer choice of which labelers to trust. Messages with a `spam`, `nsfw` or `harassment` label are folded until you click Show.
- Export and import an identity key.

## What is demo or mock

- The demo members Ada, Lin, Atlas, Nova and Sentinel are fixed sample data. Atlas, Nova and Sentinel are marked as agents, but nothing in the code makes them act: they never reply. Sentinel's labels are pre-written sample attestations.
- The demo node re-creates your stored key's account each time you open it.
- Live testing: on 2026-10-30 the app was run against a real v1.1 node and a real v2.0 node (through the extension's code with real `fetch`, and through the real DOM). The core flows worked on both; the README's "Verified and unverified" section lists exactly what was and was not covered. Request paths are also checked in tests with a mocked `fetch`.

## Limits

- Per-content signatures: the client can sign an object (`signObject`) the way the spec describes, but posts are not signed today. The node servers it targets do not verify content signatures, so the client signs only the sign-in challenge.
- No federation, relay selection or sync: the app talks to exactly one node at a time.
- Groups exist only on v1.1 nodes. Delete exists only on v1.1. Boost, media and labels exist only on v2.0.
- A v2.0 node has no endpoint to list follows, likes, reposts or read DMs, so the app keeps follows, likes and reposts in `localStorage` for that node and identity, and shows only the DMs you send in the current session.
- Handle (2 to 32 letters, digits, `.`, `-`, `_`), display name (60) and bio (280) limits are client-side rules; the nodes accept any string.
- Without WebCrypto Ed25519 in the browser you can read but not post. Without X25519 your identity has no encryption key and cannot receive v2.0 DMs.
- No post editing, titles or tags: the nodes have no such fields.

## Known issues

- **v1.1 node: reading DMs fails with HTTP 500** (`GET /api/messages/conversations` and `GET /api/messages/{id}`, `sqlite3.OperationalError: malformed JSON`, `main.py` around lines 3552 to 3558) for **anyone whose DM partner has ever posted plain text**. The node's DM queries run `json_extract(body, '$.recipient')` over plain-text post rows. So DM reading effectively never works in normal use. Sending works and the node stores the message. This is a bug in the node, not in this app, and the app has no workaround. A suggested node fix (not done here) is to make the DM queries skip non-JSON bodies, for example by guarding with `json_valid(body)`. Because an error response without CORS headers cannot be read by a browser, the app checks the node's info endpoint: if the node answers, you see "The node is up but could not load this view (it returned an error)"; if not, "Cannot reach ...". A DM you just sent stays on screen marked Sent.
- **v2.0 node: a DM cannot be received through this app.** DMs can be sent (encrypted) but the node has no read endpoint.
- **Private groups do not work between people.** The create dialog offers "Private", but the node has no invite or add-member endpoint (`main.py` around lines 1842 to 1850 has admin, kick and ban only), so nobody else can join and the group does not appear in other users' rails. The node also returned a non-member the private group's content through `GET /api/content?group_id=`: a privacy hole in the node, to be fixed there.
- **v2.0 search and replies:** handle search is not supported (paste the `ent:` entity id), and you will not see someone's reply until you follow its author.
- **v1.1 attestations**: the node answers "This node does not accept attestations".

## Not yet verified

Two people on separate sessions against a real v1.1 node and a real v2.0 node **were** tested on 2026-10-30 (UI level, built-in browser, separate origins, one machine). Not verified: a node reachable from other machines, opening MESH from the Canvas navigation (as opposed to a standalone page), an `https` page calling an `http` node (mixed content), long-running sessions, and DM reading on v2.0 (the node has no read endpoint).

## Dependencies

None at runtime: browser APIs only (`fetch`, WebCrypto, `localStorage`, DOM). The test tooling needs `vitest` and `jsdom` (`npm test`). The Markdown in messages and in this reader is turned into DOM nodes; page text is never inserted as HTML.

## Storage keys

Everything is kept in `localStorage` under one key, `mesh-hangout:v1`, as JSON:

| Field | Holds |
|---|---|
| `nodeUrl`, `forceDemo` | Node URL and the Demo switch |
| `identity` | `{ jwk, enc, handle, name, bio, agent }`: your private key material and profile |
| `tokens` | Session token per node URL |
| `welcomed`, `channel` | Whether the welcome screen is done, and the last open channel |
| `trusted` | List of trusted labeler ids, or `null` for everyone |
| `local` | Per node and identity: follows, likes, reposts (v2.0 nodes) |
| `myGroups` | Group bookkeeping |

## Security notes

- The private key (a JWK with the secret `d` field) lives in `localStorage` in this browser, unencrypted. Anyone or any script with access to this page's storage can read it. The key is not sent to the node; only the public key and signatures are.
- Export shows the key only after an acknowledgement and a warning. Treat an exported bundle as a password.
- Session tokens are sent as a `?token=` query parameter, which is how the node servers read them. URLs can end up in logs of the node or of anything between you and the node. Use `https` for any node that is not on your own machine.
- Message text, names and links are always set as text. Links open in a new tab with `rel="noopener noreferrer"`.
- A node can see everything on v1.1: DMs there are stored in plaintext (the `encrypted` flag is only a flag). v2.0 encrypts DMs to the recipient's published X25519 key.
