# Murmur

Peer-to-peer social, no server in the middle: like a flock of starlings, everyone follows their neighbours.

A Canvas Extension for chat rooms that live on the people in them. Each room is an
[OrbitDB](https://github.com/orbitdb/orbitdb) `events` log (via the fork
[FraterCCCLXIII/holons-p2p](https://github.com/FraterCCCLXIII/holons-p2p), `@orbitdb/core` 3.0.2, MIT).
The room address is what you share. Messages replicate browser to browser over libp2p (gossipsub +
OrbitDB heads sync). A small **relay** only introduces peers and carries traffic for browsers behind NAT;
it does not store history. This is an MVP: see "Honest status".

## Use it

1. `npm install` (once), then `npm run relay`. It prints addresses like
   `/ip4/127.0.0.1/tcp/12345/ws/p2p/12D3Koo...`. The peer id is stable (kept in `relay/relay-key.hex`).
2. In Murmur, Settings, paste a relay address, Save. Status should read "Connected to relay".
3. New room (or join by name/address). Share shows the address and a QR code.
4. A friend needs (a) the room address and (b) a relay address they can reach: your LAN IP instead of
   127.0.0.1 on the same network (`/ip4/192.168.x.y/tcp/12345/ws/p2p/<id>`), or a public host. Browsers
   only allow plain `ws://` from http pages and localhost; an https page needs `/tls/.../wss`.

Joining by room *name* gives the same address for everyone (name -> deterministic OrbitDB address, open
write access), so "general" is a public meeting point on any relay. Use "New room" for a hard-to-guess name.

The OrbitDB fork documents no public bootstrap relays for this use; none is enabled. (The fork's chat example
points at the public `bootstrap.libp2p.io` nodes; those are IPFS bootstrap nodes, not circuit relays for you.)

## The interface

Two panes like Hangout and Commons. Left: rooms column (Murmur mark and **New room**, a box that filters your
rooms as you type and joins a name or `/orbitdb/...` address on Enter, rooms with avatar tile, last-message
preview and unread dot, your identity and a Settings button). Drag the column edge (or use arrow keys on it) to
resize it; the width is remembered (`grip:murmur`). Right: room header (name, relay status pill, peer count, Share),
messages grouped by author with initials avatars tinted from the author id, day separators, your own messages in the
accent colour, and a composer pinned at the bottom (Enter sends, Shift+Enter adds a line). With no room open a
welcome screen offers Start a room, Join with an address and relay help. Settings holds display name and relays.
Under 720px it becomes a single column with a back button. The page sizes itself to the window below its own top
(like DocTransit; 480px floor), and the columns scroll internally. Theme variables only, so light and dark both work.

## Develop

    npm run build            # esbuild -> extension.js (one self-contained ES module, ~1.6 MB)
    npm test                 # vitest + jsdom (fake transport)
    npm run test:replicate   # Node: relay + two real OrbitDB nodes replicate a room
    node test/browser-smoke.mjs   # relay + two real Chrome contexts running the built bundle

Source is in `src/` (`extension.js` UI, `p2p.js` OrbitDB/libp2p transport, same transport used by the Node test).
Identity and data persist in the browser's IndexedDB (prefix `murmur`); name and relays in
localStorage `canvas-extension-murmur:v1`.

## Honest status

Real: identity, rooms, chat, live replication, peer list, relay status, share + QR. Verified in Node (two nodes)
and in two headless Chrome contexts through a local relay.
Not verified: inside the real Canvas extension host, other browsers, NAT/real internet, wss relays, the WebRTC
direct upgrade (enabled in the browser build, not exercised). Chat is open-write by design; display names are
self-asserted (the OrbitDB identity id next to each message is the real signer). No moderation, no encryption of
room content (anyone with the address can read it), no feed/profile view, no delivery while all peers are offline.

## Next steps

Feed and profiles (a per-user `keyvalue` DB + follow list), private rooms (OrbitDB access controller with
allow-list or encryption via `@orbitdb/simple-encryption`), a pinning peer for offline delivery, a public wss
relay recipe, mDNS/LAN discovery, WebRTC upgrade tests, paging for long histories.

License: MIT notices for OrbitDB / Protocol Labs / Haja Networks in `NOTICE.md`.
