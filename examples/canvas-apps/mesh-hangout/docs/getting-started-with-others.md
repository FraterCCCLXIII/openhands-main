# Getting started with others

> Authored for this app, from `README.md` and `extension.js`. Steps marked **unverified** were not tested. On 2026-10-30 the app was tested against a real v1.1 node and a real v2.0 node on `127.0.0.1` (see the README).

## What works for two people today

On one shared node, two people on separate browsers can do all of the **public** features, tested on 2026-10-30 against a real v1.1 node and a real v2.0 node:

- Create an identity (each person, in their own browser).
- Find the other person by handle (v1.1) or by pasting their `ent:` entity id (v2.0).
- Follow them, post, and reply, in **Following** or **Global feed** (Global feed is v1.1 only).
- Create and join a **public** group by name (v1.1 only).

## What does not work yet

- **Direct messages.** On a v1.1 node you can send a DM and the node stores it, but reading DMs fails for almost everyone (a node bug, see Known issues), so the other person cannot read it in this app. On a v2.0 node a DM can be sent (encrypted) but the node has no read endpoint, so a DM cannot be received through this app at all.
- **Private groups.** The create dialog offers "Private", but the node has no invite or add-member endpoint, so nobody else can join a private group and it does not appear in other people's rails.

## The steps for two people

1. Start one node that both browsers can reach. For a v1.1 node on one machine: `uvicorn main:app --host 127.0.0.1 --port 12000` (see step 1 below for the install line).
2. Each person opens **MESH** and presses **Get started**, then opens the gear, **unticks Demo mode**, sets the **Node URL**, and presses **Save & reconnect**. The pill under "MESH" must say Connected.
3. Each person creates an identity (Account, "Create your identity").
4. Each person shares their handle (v1.1) or their `ent:` entity id (v2.0, shown in Account).
5. Each person finds the other in the members search and presses **Follow**.
6. Post and reply in **Following** or **Global feed**. On v2.0 you will not see someone's reply until you follow its author.
7. For a public group (v1.1): under **Groups**, one person creates it and the other types the same name and presses **Join**.

## What you need

A MESH node that both you and the other people can reach over HTTP(S), and a browser with WebCrypto Ed25519. This app is only a client, so "working with others" means everyone uses the same node (there is no cross-node sync in this client).

## 1. Run a node

Run these from the protocol repository (`FraterCCCLXIII/mesh-protocol`, local clone path `holon-protocol/mesh-protocol/app/server`), ideally in a throwaway virtual environment:

```bash
pip install fastapi uvicorn aiosqlite pydantic cryptography httpx websockets
uvicorn main:app --host 127.0.0.1 --port 12000        # v1.1 node: DMs, global feed, replies, groups
# or
uvicorn server_v2:app --host 127.0.0.1 --port 12001   # v2.0 node: attestations, DAG heads
```

The protocol README's install line (`pip install cryptography aiosqlite`) is incomplete; the node needs all seven packages above. Port 12000 is the default in this app. Prefer `uvicorn main:app` over `python main.py`: `python main.py` binds `0.0.0.0` and its `--port` flag overrides the database path. Set `MESH_DB_PATH` for an isolated data file.

Both nodes were tested from a page on another origin (`http://localhost:8000`): requests were allowed, including preflight for POST, PUT and DELETE. The app sends the session token as a `?token=` query parameter, so no Authorization header is needed.

To share the node with other people, it must be reachable from their machines, which was **not tested** (**unverified**): only `127.0.0.1` was used. Binding `0.0.0.0` (what `python main.py` does) or putting the node behind a public `https` address is up to you.

## 2. Point the app at the node

1. Open **MESH** from the Canvas navigation and press **Get started**. On a fresh browser the welcome screen and **Get started** open in **Demo** mode with no hint that you are not on a real node.
2. Click the gear icon (Settings). **Demo mode is ticked by default**: **untick Demo mode**.
3. Set **Node URL** (for example `http://localhost:12000`, or the address you share).
4. Press **Save & reconnect**. The pill must change from Demo to Connected.

## 3. Check the connection

The pill under "MESH" shows the state:

| Pill | Meaning |
|---|---|
| Connecting… | Waiting for the node |
| Connected · node-id | The node answered; hover for the URL and protocol version |
| Demo | In-memory sample data; a notice says why (for example "Cannot reach http://localhost:12000") |
| Disconnected · node-id | The app was connected, but the node no longer answers. A banner says "Cannot reach ..." with a **Retry node** button. Your identity and the messages already on screen stay; the pill returns to Connected on the next successful request or retry. |

Settings repeats the state, including the MESH version and the detected flavor (v1 or v2).

## 4. Create your identity

1. Click **Create your identity** at the bottom of the left column (or open Account); if you already have a key, use "I already have a key: import it".
2. Choose a handle (v1.1 checks that it is free; on v2.0 a taken handle shows up as an error after you submit), a display name, an optional bio, and tick the agent box only if this identity is an AI agent.
3. The app generates the keys in your browser, registers you and signs you in.
4. **Export key** in Account and keep the file somewhere safe. If you clear browser storage without a backup, the identity is gone.

To use the same identity on another device or browser, use Account, then import the exported key.

## 5. Find and follow people

- Tell people your handle (v1.1) or your entity id `ent:...` (shown in Account). On v2.0 nodes **handle search is not supported**: paste the `ent:` entity id.
- On v2.0 you will not see someone's reply until you follow its author (there is no replies endpoint; replies are derived from the feeds you fetch).
- Use the members column search (placeholder "@handle or entity id") to find someone, then press Follow. Followed accounts feed the **Following** tab.
- **Global feed** shows public posts on v1.1 nodes.
- You can start a direct message with **+ New** under Direct messages, or from a member's DM button, but see "What does not work yet": the other person cannot read it today.
- On v1.1 nodes, create or join a **public** group under **Groups** (type the name and press Join). Do not use "Private": the node has no invite or add-member endpoint (only admin, kick and ban), so nobody else can join a private group and it does not appear in other people's rails. The node also returned a non-member the private group's content through `GET /api/content?group_id=`, which is a privacy hole in the node (to be fixed there, not in this app).

## 6. Share links and keys

- Share your handle or entity id, not your key. Never send an exported key to anyone: it is your account.
- There is no invite link feature in this app (not found in the code).

## Known issues

- **v1.1 node: reading DMs fails with HTTP 500** (`GET /api/messages/conversations` and `GET /api/messages/{id}`, `sqlite3.OperationalError: malformed JSON`, from the `json_extract` queries in `main.py` around lines 3552 to 3558). It fails for **anyone whose DM partner has ever posted plain text**, so in normal use DM reading effectively never works. Sending works and the node stores the message. This is a bug in the node, not in this app, and there is no workaround in the app. Suggested node fix (not done here): make the DM queries skip non-JSON bodies, for example guard with `json_valid(body)`.
  - What you see: a browser cannot read an error response without CORS headers, so the app asks the node's info endpoint whether it is up. If it is, the message says "The node is up but could not load this view (it returned an error)". If you just sent a DM, it stays on screen marked **Sent**, with the line "Replies cannot be loaded from this node right now".
- **v2.0 node: DMs cannot be received.** A DM can be sent (encrypted to the recipient's key) but the node has no read endpoint. Only what you sent in this session is shown.
- **Private groups** cannot be joined by anyone else (no invite or add-member endpoint), and the node leaks their content to non-members through `GET /api/content?group_id=`. See step 5.
- **v1.1 attestations**: the node answers "This node does not accept attestations"; labels are a v2.0 feature.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Header says Demo and the notice says "Cannot reach …" | The node is not running, the URL or port is wrong, or the address is blocked. Check the URL in Settings, make sure Demo mode is unticked, and press Retry node. |
| Pill says Disconnected and a banner says "Cannot reach …" | The node stopped answering after you connected. Start it again and press Retry node; your identity and loaded messages are kept. |
| "The node answered 500" or "The node is up but could not load this view" | The node is running but failed on that request. In the Direct messages view of a v1.1 node this is the known DM bug above. |
| "Not a MESH node (no /.well-known/mesh-node)" | The URL answers but is not a MESH node. Check the path; the URL may include a path prefix. |
| Page is `https` but the node is `http` | Browsers can block mixed content. Use an `https` node address (**unverified**). |
| "Read-only: create or import an identity in Account to post." | You have no identity in this browser. Create or import one. |
| "Your identity is not registered on this node yet." | The key exists but this node has no entity for it. Register it in Account. |
| "Signed out: sign in from Account to post." | Session expired or the node restarted; v2.0 keeps sessions in memory. Sign in again. |
| "This browser has no WebCrypto Ed25519" | Use a newer browser, or Demo mode. |
| DM refused: recipient has no encryption key (v2.0) | The recipient registered without an X25519 key. They need an identity with an encryption key (made in a browser that supports X25519). |
| Group, global feed, delete, profile edit or labels missing | The node version does not offer them (see About this implementation). |
| Followed list empty after switching browser (v2.0) | The v2.0 follow list is stored locally, not on the node. |
