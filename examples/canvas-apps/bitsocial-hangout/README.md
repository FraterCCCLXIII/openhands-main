# Bitsocial

A Canvas App that looks like Hangout / Team Chat but talks to the
[Bitsocial](https://bitsocial.net) protocol (peer-to-peer social over IPFS pubsub, formerly Plebbit).

- A **community** is a channel, a **post** is a thread root, a **reply** is a reply.
- **Connected mode** speaks the Plebbit RPC (JSON-RPC 2.0 over WebSocket, default
  `ws://localhost:9138`, the same one Bitsocial Node Manager and seedit use). No dependencies.
- **Demo mode** (in-memory sample communities) is used whenever no node is reachable. Every flow
  below also works in Demo mode, fully in memory (a "Plebs" community asks a demo challenge, so the
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
| Read | sidebar, threads | `subplebbitsSubscribe`, `subplebbitUpdateSubscribe`, `getSubplebbitPage`, `getCommentPage`, `getComment`, `unsubscribe` |

## Identity and signing

Everything published is signed in this browser, then handed to the node as a ready-made signed
publication (`{comment}`, `{vote}` or `{commentEdit}`). The private key never leaves this browser's
localStorage (`bitsocial-hangout:identity:v1`) and is never sent to the node; the identity dialog says so.
Signing uses WebCrypto Ed25519 (current Chrome/Edge, Safari, Firefox). Where it is missing the app shows
a clear notice, and reading and Demo mode keep working.

The signature follows plebbit-js 0.0.11: pick the signed properties, drop null/empty values, encode as
CBOR (sorted keys), Ed25519-sign, then send `signature: {signature, publicKey, type: "ed25519",
signedPropertyNames}` with base64 (unpadded) values. The author address is the base58btc peer id of the
public key. Import accepts the base64 private key or an account JSON containing `signer.privateKey`.

## Verified vs not verified

Verified:
- The signing, CBOR encoding and address derivation are checked **byte for byte against the real
  plebbit-js 0.0.11 code** (`seedit/node_modules/@plebbit/plebbit-js`): the test fixtures were generated
  by running its `signComment`, `signVote` and `signCommentEdit`, and its `verifyCommentPubsubMessage`,
  `verifyVote` and `verifyCommentEdit` accepted them. Ed25519 is deterministic, so the signatures
  here must equal them exactly (8 cases: post, reply, vote -1/0/1, edit with `deleted`, edit with content).
- RPC method names and parameter shapes were read from plebbit-js `rpc/src/index.ts`
  (`publishComment`, `publishVote`, `publishCommentEdit`, `publishChallengeAnswers`, `createSubplebbit`,
  `startSubplebbit`, `editSubplebbit`, `subplebbitUpdateSubscribe`, `subplebbitsSubscribe`, `unsubscribe`)
  and the RPC client; the tests drive a fake socket and assert the exact method names, params and the
  presence of the signature.
- The protocol supports voting (`vote` 1, 0, -1) and author edits/deletes (`commentEdit` with `content`
  or `deleted: true`), so those are implemented.

Not verified (nothing was run against a live node):
- That a real node accepts these publications end to end, and the real challenge payloads (the
  `challenge` event is read as `{challenges: [{challenge, type}]}`; `image/*` challenges are shown as a
  base64 image, other types as text).
- Setting a name address on a new community (`editSubplebbit` with `address`): the node needs a
  matching DNS TXT record, and whether it accepts the change on a running community is untested.
  If it fails the community keeps its peer-id address and the error is shown.
- Joining checks reachability by waiting for the first `update` event (15 s). Slow or offline
  communities are reported as unreachable.
- Any `error` event during a publish is treated as a failure, even though plebbit-js can retry some.
- A community's own title/description are only loaded for the selected community.
- Deleting a hosted community (`deleteSubplebbit`) and moderation are not implemented.
- Edits to the title of a post are not possible in the protocol (only content, flairs, spoiler, nsfw).

Install from Customize, then Apps, using this folder's path. Tests: `npm install && npm test`.
