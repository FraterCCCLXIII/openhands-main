# Meet

A Canvas App for video meetings on an open stack: WebRTC through a
[LiveKit](https://github.com/livekit/livekit) SFU (Apache 2.0).

- **Lobby**: name, room, LiveKit server and token endpoint (kept in this browser).
- **Meeting**: video grid with speaking highlight, screen-share tiles, mic / camera /
  screen-share controls, and room chat over LiveKit data messages.
- **Dependency**: `livekit-client` 2.15.0, loaded from jsDelivr when you press Join.

## Try it locally

```bash
livekit-server --dev                   # ws://127.0.0.1:7880, key devkey / secret
npm i livekit-server-sdk && node token-server.mjs   # http://127.0.0.1:7891/token
```

`livekit-server --dev` (LiveKit v1.13.11, installed with Homebrew) worked for a local
two-person call. It warns that the dev secret is shorter than 32 characters. That is fine
for a local run; for anything else generate a secret of 32+ characters
(`openssl rand -hex 24`) and give the same key and secret to LiveKit and the token server.
The token server listens on port 7891 by default; set `PORT` to change it
(`PORT=7900 node token-server.mjs`).

Install from Customize, then Apps, using this folder's path, open Meet, and join the same
room from two browser tabs.

## Where the API secret lives

- With a **token endpoint** set, the token server signs tokens and holds the API secret.
  The extension never sees it.
- With the token endpoint **empty**, the browser signs its own token using the API key
  and secret from Settings (defaults `devkey` / `secret`). That is for local testing only.
  The lobby says so when the LiveKit server is not local.

## Invite links

The Share panel builds `https://<page>/?room=<room>`. When the LiveKit server and token
endpoint are not local-only (not `localhost`, `127.x`, `::1`, `.localhost`) the link, QR
code and message also carry:

- `lk`: the LiveKit server URL (`ws://` or `wss://`)
- `tok`: the token endpoint URL (`http://` or `https://`)

An API key or secret is never put in a link. Opening a link pre-fills the lobby (room,
LiveKit server, token endpoint) and shows "Server settings came from the invite link."
Those values are only saved in the browser once you press Join. Other schemes, such as
`javascript:` or `file:`, and URLs with embedded credentials are ignored.

## Browser requirements

- Camera and microphone (`getUserMedia`) need **https or localhost**.
- An https page cannot open a `ws://` server; use `wss://`.
- The lobby shows quiet hints when it detects these cases, or when a remote visitor's
  server field still points at their own computer.

## Hosting a call for remote people

Not tested: only a local call between two browsers on one machine was run. Steps:

1. Run LiveKit behind TLS (so clients use `wss://`) with its ports published
   (signalling 7880 and the WebRTC media ports, see the LiveKit deployment docs).
2. Run the token server (it binds 127.0.0.1 only) behind an https reverse proxy, with a 32+ character key and secret that match LiveKit.
3. Make Canvas / Meet reachable over https from the other people's machines.
4. In the Share panel, set the **Public address** to that Meet address.
5. Enter your wss:// LiveKit server and https token endpoint in the lobby, open Share and
   send the link: it now carries the server settings.

Not built yet: recording (LiveKit Egress), end-to-end encryption, per-participant moderation.
Tests: `npm install && npm test`.
