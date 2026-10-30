# MESH Hangout

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

Install from Customize, then Apps, using this folder's path, open **MESH Hangout**, then set the
node URL under the gear icon (default `http://localhost:12000`, kept in localStorage). The header
shows **Connected** or **Demo**; if the node is unreachable the app falls back to in-memory
Demo data and says so.

## Identity and signing

Settings creates an Ed25519 key with WebCrypto, registers it (`POST /api/entities`) and signs in
with the challenge flow (`/api/auth/challenge` then `/api/auth/verify`). The private key is kept as
a JWK in this browser's localStorage; export it to move devices. Browsers without WebCrypto
Ed25519 get read-only browsing plus Demo mode, with a notice. Neither Python server verifies
per-content signatures today (v1.1 `verify_signature` is a stub, content is stored with an empty
`sig`), so the client signs only the auth challenge; `signObject`/`canonicalJson` implement the
spec scheme for when nodes enforce it.

## Node differences handled

- v1.1 (`protocol_version` 1.1): feed `/api/users/{id}/feed?labels=true`, global `/api/content`,
  replies `/api/content?reply_to=`, DMs `/api/messages`. Labels only appear when the node has
  `MESH_MODERATION_URL` and an issuer allowlist.
- v2.0 (`protocol_version` 2.0): feed `/api/feed`, `/api/timeline/{id}`, DMs `POST /api/dm`
  (encrypted, send-only), labels `/api/subjects/{subject}/labels`, attestations
  `POST /api/attestations`, DAG heads `/api/sync/{actor}/heads`. No global feed or replies
  endpoint exists, so replies are derived from fetched items.

Tests: `npm install && npm test`.
