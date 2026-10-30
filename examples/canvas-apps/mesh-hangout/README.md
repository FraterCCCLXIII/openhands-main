# MESH

A Canvas App that clones the Hangout / Team Chat experience on top of a
[MESH protocol](https://github.com/holon-protocol/mesh-protocol) node: Ed25519 identities, a
signed content DAG, composable moderation attestations and deterministic feeds.

| Hangout | MESH |
|---|---|
| Channel list | Feeds and timelines: Following, Global feed, Direct messages, one timeline per entity |
| Messages (markdown) | Content; replies use `reply_to` |
| Members (people and agents, orb avatars) | Entities (`kind: user/bot`, or `profile.agent`) |
| Moderation | Attestations as badges (`spam`, `nsfw`, `misleading`, `harassment`, `verified`, `trusted`, `bot`); spam/nsfw/harassment fold the message |

## Run it

```bash
cd holon-protocol/mesh-protocol/app/server
python main.py --port 12000          # v1.1 node (DMs, global feed, replies)
# or: uvicorn server_v2:app --port 12000   # v2.0 node (attestations, DAG heads)
```

Install from Customize, then Apps, using this folder's path, open **MESH**, then set the
node URL under the gear icon (default `http://localhost:12000`, kept in localStorage). The header
shows **Connected** or **Demo**; if the node is unreachable the app falls back to in-memory
Demo data and says so.

## Flows

Every flow below works in **Demo** (in memory, same client interface) and **Connected** mode. Paths
were read from `app/server/main.py` (v1.1) and `app/server/server_v2.py` (v2.0) and are asserted
with mocked `fetch` in `flows.test.js`; nothing has been run against a live node.

| Flow | Where | v1.1 node | v2.0 node |
|---|---|---|---|
| Create identity | Account (rail footer) | Ed25519 + X25519 keys made with WebCrypto, handle checked with `GET /api/entities/by-handle/{h}`, `POST /api/entities {public_key, encryption_key, handle, profile:{name,bio?,agent}}`, then challenge sign-in | same, but no handle lookup: a taken handle surfaces as the 409 `Handle taken`, the key is kept and the form offers a retry |
| Sign in / out | Account | `POST /api/auth/challenge`, `/verify` (signature = hex Ed25519 over the challenge text), `POST /api/auth/logout`; an expired session is renewed once automatically on a 401 | same (no logout endpoint; sessions live in server memory, so a node restart triggers the automatic re-sign-in) |
| Edit profile | Account | `PUT /api/entities/{id}` with the bare profile dict (replaces it; handle cannot change) | not available: no endpoint |
| Export / import key | Account | JSON bundle `{mesh_hangout_identity, ed25519 JWK, x25519 JWK, handle, name}`; export is hidden behind an acknowledgement and a warning; import also accepts a bare Ed25519 JWK | same |
| Switch / forget identity | Account | removes the key from this browser after an explicit confirmation; the account stays on the node | same |
| Post, reply | composer | `POST /api/content {kind: post/reply, body, reply_to, access}` | `POST /api/content {author, kind:"post", body, media, reply_to}` |
| Media | composer "Attach link" | not offered: `media` is accepted but never stored | `media: [url, ...]` (strings), rendered as links |
| Quote | message actions | plain post whose body is a blockquote of the original plus its id (a client convention, not a protocol feature) | same |
| Like | message actions | `POST /api/links kind=like`, `DELETE /api/links/{id}` | `POST /api/links kind=like`, `DELETE /api/links?target=&kind=` |
| Boost (repost) | message actions | not available: `LinkKind` has no repost | `POST /api/links kind=repost`; the node has no endpoint to list reposts, so the state is remembered locally |
| Delete own post | message actions, with a confirm step | `DELETE /api/content/{id}` | not available |
| Edit a post | omitted | no endpoint | no endpoint |
| Title / tags | omitted | `ContentCreate` has no such fields | none |
| Follow / unfollow, list | member rows, Following tab | `POST /api/links kind=follow`, `DELETE /api/links/{sha256(me:follow:target)[:32]}`, `GET /api/users/{me}/following` | `POST /api/links`, `DELETE /api/links?target=&kind=follow`; no listing endpoint, so the list is kept locally per node and identity |
| Find a member | Members search | `GET /api/entities/by-handle/{h}` or `/api/entities/{id}` | by entity id only |
| Direct messages | rail "+ New", member DM button | `POST /api/messages {recipient_id, content}`, `GET /api/messages/conversations`, `GET /api/messages/{id}` (plaintext on the node) | `POST /api/dm {author, recipient, body}`; the node encrypts to the recipient's `encryption_key`, so a recipient without one is refused with a clear message. Registration publishes our X25519 public key. The node has no endpoint to read DMs back, so only what you send in this session is shown |
| Label (moderation) | message and member "Label", with reason and confidence | not available: v1.1 has no `/api/attestations`; labels from an external moderation service only appear on feed items (`MESH_MODERATION_URL` + issuer allowlist) | `POST /api/attestations {subject, type, claim:{reason}, evidence:null, confidence}`; reads `GET /api/subjects/{s}/labels?viewer=me`. No revoke endpoint |
| Choose trusted labelers | member column "Labelers", Node settings | applied in the browser | applied in the browser: v2.0 reads a `trust` table for `?viewer=` but no endpoint writes it |
| Groups | rail "Groups" | `POST /api/groups {name, description, access}`, `GET /api/groups`, `GET /api/groups/{id}`, `/join`, `/leave`, posts with `access:"group", group_id`, `GET /api/content?group_id=` | not available (no group endpoints) |

Groups are node features of `main.py`; the v1.1 spec only says "Social layer: same as v1.0", so
the protocol itself defines no group, list or channel object. Channels in the UI are feeds.

## Identity and signing

Account creates an Ed25519 key (and an X25519 encryption key, when WebCrypto supports it), registers
it and signs in with the challenge flow. Keys are kept as JWKs in this browser's localStorage; export
them to move devices. Browsers without WebCrypto Ed25519 get read-only browsing plus Demo mode, with
a notice. Neither Python server verifies per-content signatures today (v1.1 `verify_signature` is a
stub and stores an empty `sig`; v2.0 verifies only the auth challenge), so the client signs only the
challenge; `signObject`/`canonicalJson` implement the spec scheme for when nodes enforce it.

Handle rules (2 to 32 of letters, digits, `.`, `-`, `_`), display name (60) and bio (280) limits are
client-side policy; the nodes accept any string.

## Verified and unverified

Verified by tests that run here: request paths, query parameters and bodies for every flow above
(mocked `fetch`, both node versions); the Ed25519 challenge signature, entity id, link/attestation
ids and X25519 encryption key against `app/server/protocol.py` (run with `python3`, including an
`encrypt_for_recipient` / `decrypt_from_sender` round trip with the published key); the Demo flows
end to end through the real DOM.

Not verified: any run against a live v1.1 or v2.0 node, CORS and timing on a real network, the
v1.1 `PUT /api/entities/{id}` body handling in FastAPI beyond reading the source, behaviour of
browsers without WebCrypto X25519 (identity is then created without an encryption key and cannot
receive v2.0 DMs), and private-group invites (the node exposes none).

## Node differences handled

- v1.1 (`protocol_version` 1.1): feed `/api/users/{id}/feed?labels=true`, global `/api/content`,
  replies `/api/content?reply_to=`, DMs `/api/messages`, groups, delete, profile update. Labels
  only appear when the node has `MESH_MODERATION_URL` and an issuer allowlist.
- v2.0 (`protocol_version` 2.0): feed `/api/feed`, `/api/timeline/{id}`, DMs `POST /api/dm`
  (encrypted, send-only), labels and attestations, DAG heads `/api/sync/{actor}/heads`. No global
  feed, replies, group, delete or profile endpoint exists, so replies are derived from fetched items.

Tests: `npm install && npm test`.
