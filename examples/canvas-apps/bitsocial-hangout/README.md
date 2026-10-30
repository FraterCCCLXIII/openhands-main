# Bitkin

A Canvas App that looks like Hangout / Team Chat but talks to the
peer-to-peer social network (communities served by nodes over IPFS pubsub).

- A **community** is a channel, a **post** is a thread root, a **reply** is a reply.
- **Connected mode** speaks the node's RPC (JSON-RPC 2.0 over WebSocket, default
  `ws://localhost:9138`; use a node that speaks the same RPC protocol, see Compatibility). No dependencies.
- **Demo mode** (in-memory sample communities) is used whenever no node is reachable. Every flow
  below also works in Demo mode, fully in memory (the "Lounge" community asks a demo challenge, so the
  challenge dialog can be tried; `music.eth` and `devs.eth` can be joined).
- The RPC URL, display name, joined communities and your own votes are kept in localStorage.

## What you can do

| Flow | UI | RPC methods (Connected mode) |
|---|---|---|
| Identity: create, import, export, remove | "Identity" chip in the sidebar | none (local) |
| Post with title, markdown body, optional link | composer | `publishComment` |
| Reply to a post or to a reply | thread view, "Reply" | `publishComment` (with `parentCid`, `postCid`) |
| Answer a challenge (text or captcha image) | dialog | `publishChallengeAnswers` |
| Vote up / down, toggle off | arrows on each message | `publishVote` |
| Edit or delete your own post/reply | Edit / Delete on your messages | `publishCommentEdit` |
| Create a community, start it, optional name address | "Create" | `createSubplebbit`, `startSubplebbit`, `editSubplebbit` |
| List your communities, edit title/description, start | "Yours" | `subplebbitsSubscribe` (the node's local communities), `editSubplebbit`, `startSubplebbit` |
| Join by address (name.eth or peer id), leave | "Join", "Leave" | `subplebbitUpdateSubscribe` (reachability check), `unsubscribe` |
| Activate a seeded topic community (AI, News, Tech, Science, Business, Design), one or all | "Seeded communities" in the sidebar | `createSubplebbit`, `editSubplebbit` (title, description, `roles`, `settings.challenges: []`), `startSubplebbit` |
| New space: a room of your own, Public or Private | "New space" | `createSubplebbit`, `editSubplebbit` (`roles`, `rules`, `settings.challenges`), `startSubplebbit` |
| Invite people: copy address and message, add author addresses (Private), Start a call | "Invite people" in the space header | `editSubplebbit` (`settings.challenges`, merged with the existing list) |
| Manage space: rename, rules, Public/Private, lock, attendees, roles | "Manage space" in the space header | `editSubplebbit` (`title`, `description`, `rules`, `roles`, `settings.challenges`) |
| Remove a post, ban an author for 1 hour to 30 days | "Remove" / "Ban…" on a message, "Ban…" on an attendee | `publishCommentModeration` (signed in the browser) |
| Read | sidebar, threads | `subplebbitsSubscribe`, `subplebbitUpdateSubscribe`, `getSubplebbitPage`, `getCommentPage`, `getComment`, `unsubscribe` |

## Seeded communities and spaces

**Activate.** Each topic seed that is not yet on your node shows a "Seeded" badge and an Activate button
(and "Activate all", behind a confirmation, which stops at the first error). Activating needs a connected
node and an identity: the community is created on your node, edited (title, description, you as `owner`,
`settings.challenges: []` so anyone can post; a new community otherwise gets the node's default spam
challenges, which turn away ordinary peer-id authors), started, and from then on it is a normal "Yours"
community. It starts empty: the sample posts exist only in the demo. In Demo mode the same flow runs in
memory and says "Demo".

**What "Private" means.** Anyone who has a community's address can read everything in it; the node has no
switch to hide content. Private only means **invite-only to post**: the space carries a `whitelist`
challenge whose `addresses` option lists the author addresses allowed to post, and every other author is
rejected with "This room is invite-only." You (the owner) are on the list automatically, and the owner,
admins and moderators skip the challenge through its `exclude: [{role: [...]}]`. Public means no
challenges: anyone can post. The UI says "Anyone with the address can read; only invited people can post."

**Invitations.** "Invite people" gives the space address and a ready message ("Open Bitkin, choose Join,
paste this address"). The invitee joins to read, then sends the host their author address (shown under
their identity); the host pastes it into the invite list (peer id like `12D3KooW…` or a name like
`alice.eth`; duplicates and bad entries are rejected). The list is merged with the existing one, never
replaced. "Start a call" opens the Meet extension (`/extensions/meet/meet?room=<name>`) through the host's
`navigate`, and needs Meet installed.

**Room and attendee control** (only on a community hosted by your node: the owner; a moderator elsewhere
gets a read-only panel plus Remove / Ban):
- Lock / Unlock adds or removes a `fail` challenge that is excluded for owner, admins and moderators. While
  locked, everyone else is turned away ("This room is locked right now."); the invite list and roles are kept.
- Roles (`owner`, `admin`, `moderator`): `roles` in `editSubplebbit` **replaces the whole map**, so Bitkin
  always sends the full merged map and never touches the owner's entry.
- Remove: `publishCommentModeration` with `{removed: true, reason?}`. Ban: `{author: {banExpiresAt}, reason?}`
  (seconds since epoch), optionally together with the removal; a banned author gets "Author is banned".
  The publication is signed in this browser (`signedPropertyNames`: author, subplebbitAddress,
  protocolVersion, timestamp, commentModeration, commentCid, read from the reference signer).
- Everything asks for a confirmation first. Editing settings and roles needs the community to be hosted by
  the connected node (an `admin` of someone else's room can only moderate).

All of this was exercised against a real node (see the tests and "Verified" below). It all works in Demo mode too.

## Identity and signing

Everything published is signed in this browser, then handed to the node as a ready-made signed
publication (`{comment}`, `{vote}` or `{commentEdit}`). The private key never leaves this browser's
localStorage (`bitsocial-hangout:identity:v1`) and is never sent to the node; the identity dialog says so.
Signing uses WebCrypto Ed25519 (current Chrome/Edge, Safari, Firefox). Where it is missing the app shows
a clear notice, and reading and Demo mode keep working.

The signature follows the reference implementation: pick the signed properties, drop null/empty values, encode as
CBOR (sorted keys), Ed25519-sign, then send `signature: {signature, publicKey, type: "ed25519",
signedPropertyNames}` with base64 (unpadded) values. The author address is the base58btc peer id of the
public key. Import accepts the base64 private key or an account JSON containing `signer.privateKey`.

## Verified vs not verified

Verified:
- The signing, CBOR encoding and address derivation are checked **byte for byte against the real
  reference implementation**: the test fixtures were generated
  by running its `signComment`, `signVote` and `signCommentEdit`, and its `verifyCommentPubsubMessage`,
  `verifyVote` and `verifyCommentEdit` accepted them. Ed25519 is deterministic, so the signatures
  here must equal them exactly (8 cases: post, reply, vote -1/0/1, edit with `deleted`, edit with content).
- RPC method names and parameter shapes were read from the reference implementation's RPC server
  (`publishComment`, `publishVote`, `publishCommentEdit`, `publishChallengeAnswers`, `createSubplebbit`,
  `startSubplebbit`, `editSubplebbit`, `subplebbitUpdateSubscribe`, `subplebbitsSubscribe`, `unsubscribe`)
  and the RPC client; the tests drive a fake socket and assert the exact method names, params and the
  presence of the signature.
- The protocol supports voting (`vote` 1, 0, -1) and author edits/deletes (`commentEdit` with `content`
  or `deleted: true`), so those are implemented.

- Seeded activation, New space (Public and Private), inviting, lock and unlock, role changes, removing a post
  and banning an author were driven through this UI against a real node (plebbit-js 0.0.11, an RPC server on a
  local kubo): a non-listed author was rejected ("This room is invite-only."), a listed author accepted,
  a locked room rejected the listed author and still accepted the owner, a moderator not on the list could
  post, a banned author was rejected ("Author is banned") and a removed post left the node's page.

Not verified (the items below were not run against a live node):
- That a real node accepts these publications end to end, and the real challenge payloads (the
  `challenge` event is read as `{challenges: [{challenge, type}]}`; `image/*` challenges are shown as a
  base64 image, other types as text).
- Setting a name address on a new community (`editSubplebbit` with `address`): the node needs a
  matching DNS TXT record, and whether it accepts the change on a running community is untested.
  If it fails the community keeps its peer-id address and the error is shown.
- Joining checks reachability by waiting for the first `update` event (15 s). Slow or offline
  communities are reported as unreachable.
- Any `error` event during a publish is treated as a failure, even though the node can retry some.
- A community's own title/description are only loaded for the selected community.
- Deleting a hosted community (`deleteSubplebbit`) is not implemented. Purging a comment and per-author flairs are not exposed.
- Hiding a community's content is not possible on this network, so Private spaces are readable by anyone with the address.
- Edits to the title of a post are not possible in the protocol (only content, flairs, spoiler, nsfw).

## Compatibility

The node RPC spoken here is the Plebbit RPC (plebbit-js 0.0.11, as used by Bitsocial nodes and clients such as seedit); the RPC method names (`publishComment`, `createSubplebbit`, ...) are that protocol's.

Install from Customize, then Apps, using this folder's path. Tests: `npm install && npm test`.
