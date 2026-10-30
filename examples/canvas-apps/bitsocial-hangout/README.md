# Bitsocial Hangout

A Canvas App that looks like Hangout / Team Chat but talks to the
[Bitsocial](https://bitsocial.net) protocol (peer-to-peer social over IPFS pubsub, formerly Plebbit).

- A **community** is a channel, a **post** is a thread root, a **reply** is a reply.
- **Connected mode** speaks the Plebbit RPC (JSON-RPC 2.0 over WebSocket, default
  `ws://localhost:9138`, the same one Bitsocial Node Manager and seedit use). No dependencies.
- **Demo mode** (in-memory sample communities) is used whenever no node is reachable.
- The RPC URL is set on the welcome page or under Connection settings and kept in localStorage.

RPC methods used: `subplebbitsSubscribe`, `subplebbitUpdateSubscribe`, `getCommentPage`,
`getSubplebbitPage`, `getComment`, `publishComment`, `publishChallengeAnswers`, `unsubscribe`.

Known limit: Bitsocial comments are signed by the author. This client does not sign, so publishing
through a node is best effort; a node that requires a signature rejects the post and the message is
shown as failed. Reading communities, posts and replies does not need signing.

Install from Customize, then Apps, using this folder's path. Tests: `npm install && npm test`.
