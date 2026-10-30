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

Install from Customize, then Apps, using this folder's path, open Meet, and join the same
room from two browser tabs. The token server holds the API secret; the extension never does.

Not built yet: recording (LiveKit Egress), end-to-end encryption, per-participant moderation.
Tests: `npm install && npm test`.
