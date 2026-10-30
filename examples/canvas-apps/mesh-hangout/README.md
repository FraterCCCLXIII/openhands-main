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
pip install fastapi uvicorn aiosqlite pydantic cryptography httpx websockets
uvicorn main:app --host 127.0.0.1 --port 12000      # v1.1 node (DMs, global feed, replies)
# or: uvicorn server_v2:app --host 127.0.0.1 --port 12001   # v2.0 node (attestations, DAG heads)
```

The protocol README's install line (`pip install cryptography aiosqlite`) is incomplete; the node
needs all seven packages above. Prefer `uvicorn main:app` to `python main.py`: the latter binds
`0.0.0.0`, and its `--port` flag overrides the database path. Set `MESH_DB_PATH` for an isolated data file.

Install from Customize, then Apps, using this folder's path, open **MESH**, then open the gear icon,
**untick Demo mode** (it is ticked by default on a fresh browser, and the welcome screen and
"Get started" open in Demo with no hint), set the node URL (default `http://localhost:12000`, kept in
localStorage) and press **Save & reconnect**. The header shows **Connected**, **Disconnected** or **Demo**.
If the node is unreachable at start the app falls back to in-memory Demo data and says so. If a node
that was connected stops answering, the pill changes to Disconnected with a "Cannot reach ..." banner
and a Retry node button; identity and loaded messages stay on screen, and it returns to Connected on
the next successful request or retry. A failed read is told apart by probing `/.well-known/mesh-node`:
"The node answered 503" (readable status), "The node is up but could not load this view" (an error the
browser cannot read), or "Cannot reach <url>" (probe fails).

## What works for two people today

On one shared node, two people on separate browsers can: create an identity, find each other (handle on
v1.1, pasted `ent:` entity id on v2.0), follow, post and reply in Following or Global feed (v1.1), and use
public groups (v1.1). Steps:

1. Same node, for example `uvicorn main:app --host 127.0.0.1 --port 12000` (v1.1).
2. Each person unticks Demo mode, sets the Node URL and presses Save & reconnect.
3. Each creates an identity and shares their handle (v1.1) or `ent:` id (v2.0).
4. Each follows the other, then posts and replies in Following or Global feed.
5. Public group: create it (or type the same name) and press Join.

On v2.0, handle search is not supported (paste the `ent:` id) and you will not see someone's reply until
you follow its author.

## What does not work yet

- **Direct messages.** v1.1: sending works and the node stores it, but reading fails (HTTP 500) for anyone
  whose DM partner has ever posted plain text, so reading effectively never works. v2.0: a DM can be sent
  (encrypted) but the node has no read endpoint, so a DM cannot be received through this extension.
  A DM you send is shown at once, marked Sent.
- **Private groups.** The create dialog offers "Private", but the node has no invite or add-member endpoint
  (`main.py` around lines 1842 to 1850 has admin, kick and ban only), so nobody else can join and the group
  does not appear in other users' rails. The node also returned a non-member the private group's content via
  `GET /api/content?group_id=`: a privacy hole in the node, to be fixed there.

## Flows

Every flow below works in **Demo** (in memory, same client interface) and **Connected** mode. Paths
were read from `app/server/main.py` (v1.1) and `app/server/server_v2.py` (v2.0) and are asserted
with mocked `fetch` in `flows.test.js`, and were also run against live nodes (see Verified and unverified).

| Flow | Where | v1.1 node | v2.0 node |
|---|---|---|---|
| Create identity | Account (rail footer) | Ed25519 + X25519 keys made with WebCrypto, handle checked with `GET /api/entities/by-handle/{h}`, `POST /api/entities {public_key, encryption_key, handle, profile:{name,bio?,agent}}`, then challenge sign-in | same, but no handle lookup: a taken handle surfaces as the 409 `Handle taken`, the key is kept and the form offers a retry |
| Sign in / out | Account | `POST /api/auth/challenge`, `/verify` (signature = hex Ed25519 over the challenge text), `POST /api/auth/logout`; an expired session is renewed once automatically on a 401 | same (no logout endpoint; sessions live in server memory, so a node restart triggers the automatic re-sign-in) |
| Edit profile | Account | `PUT /api/entities/{id}` with the bare profile dict (replaces it; handle cannot change) | the button is shown, but it opens a notice that the node has no endpoint |
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
| Find a member | Members search | `GET /api/entities/by-handle/{h}` or `/api/entities/{id}` | by entity id only (handle search is not supported; paste `ent:...`). A reply is not seen until you follow its author |
| Direct messages | rail "+ New", member DM button | `POST /api/messages {recipient_id, content}`, `GET /api/messages/conversations`, `GET /api/messages/{id}` (plaintext on the node; reading fails on the node today, see Known issue). A sent DM is shown at once, marked Sent | `POST /api/dm {author, recipient, body}`; the node encrypts to the recipient's `encryption_key`, so a recipient without one is refused with a clear message. Registration publishes our X25519 public key. The node has no endpoint to read DMs back, so a DM cannot be received here; only what you send in this session is shown |
| Label (moderation) | message and member "Label", with reason and confidence | not available: v1.1 has no `/api/attestations`; labels from an external moderation service only appear on feed items (`MESH_MODERATION_URL` + issuer allowlist) | `POST /api/attestations {subject, type, claim:{reason}, evidence:null, confidence}`; reads `GET /api/subjects/{s}/labels?viewer=me`. No revoke endpoint |
| Choose trusted labelers | member column "Labelers", Node settings | applied in the browser | applied in the browser: v2.0 reads a `trust` table for `?viewer=` but no endpoint writes it |
| Groups | rail "Groups" (public groups work; private ones cannot be joined by anyone else) | `POST /api/groups {name, description, access}`, `GET /api/groups`, `GET /api/groups/{id}`, `/join`, `/leave`, posts with `access:"group", group_id`, `GET /api/content?group_id=` | not available (no group endpoints) |

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

Tested against live nodes on 2026-10-30: a real v1.1 node (`uvicorn main:app --host 127.0.0.1 --port 12000`
from the mesh-protocol repo, throwaway venv) and a real v2.0 node (`server_v2:app`), driven through the
extension's code with real `fetch` and through the real DOM.

- Worked on v1.1: connect, register, challenge sign-in with a real Ed25519 signature, post, global feed,
  timeline, reply, like/unlike, follow/unfollow and the Following feed, groups (create, list, join, post,
  feed, leave), sending a DM, search by entity id, profile update, delete own post, and sign out (the
  token is revoked: 401 afterwards).
- Worked on v2.0: register, sign-in, post, timeline, follow, reply, like, repost, unlike, unfollow,
  encrypted DM send, an attestation (spam label) read back via `labels()`, DAG heads, a duplicate
  handle returning 409 "Handle taken", and sign out.
- v1.1 attestations: the node answers "This node does not accept attestations" (documented behaviour).
- CORS from origin `http://localhost:8000` was allowed on both nodes (the origin is echoed, credentials
  true, preflight for POST/PUT/DELETE passes, `content-type` allowed). The app sends the token only as
  a `?token=` query parameter, so no Authorization header is needed.

Two people on separate sessions against a real v1.1 node and a real v2.0 node were tested on 2026-10-30
(UI level, built-in browser, separate origins, one machine). That test found the DM and private-group
limits above and the extension problems fixed afterwards (misleading error, stale connection pill, lingering
Demo members, unseen sent DM), now covered by tests with a mocked `fetch`.

Known issue (a bug in the v1.1 node, not in this app): reading DMs fails with HTTP 500
(`GET /api/messages/conversations` and `GET /api/messages/{id}`, `sqlite3.OperationalError: malformed JSON`,
`main.py` around lines 3552 to 3558) for anyone whose DM partner has ever posted plain text, because the DM
queries run `json_extract(body, '$.recipient')` over plain-text post rows. Sending DMs works and is stored.
Suggested node fix (not done here): make the DM queries skip non-JSON bodies, for example guard with
`json_valid(body)`. The app has no workaround. Unhandled 500s carry no CORS headers, so the browser throws
instead of showing the status; the app then probes the node and says "The node is up but could not load this
view (it returned an error) ... known node bug; see Docs", and keeps your sent messages visible with
"Replies cannot be loaded from this node right now".

Still not verified: a node reachable from other machines on a network, opening MESH from the Canvas
navigation (as opposed to a standalone page), an `https` page calling an `http` node (mixed content),
long-running sessions, the DM read path on v2.0 (the node has no read endpoint, so none was run), behaviour
of browsers without WebCrypto X25519 (identity is then created without an encryption key and cannot
receive v2.0 DMs), and private-group invites (the node exposes none).

## Node differences handled

- v1.1 (`protocol_version` 1.1): feed `/api/users/{id}/feed?labels=true`, global `/api/content`,
  replies `/api/content?reply_to=`, DMs `/api/messages`, groups, delete, profile update. Labels
  only appear when the node has `MESH_MODERATION_URL` and an issuer allowlist.
- v2.0 (`protocol_version` 2.0): feed `/api/feed`, `/api/timeline/{id}`, DMs `POST /api/dm`
  (encrypted, send-only), labels and attestations, DAG heads `/api/sync/{actor}/heads`. No global
  feed, replies, group, delete or profile endpoint exists, so replies are derived from fetched items.

Tests: `npm install && npm test`.
