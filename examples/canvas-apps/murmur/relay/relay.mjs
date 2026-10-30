/* Murmur relay: a tiny libp2p node that introduces peers to each other. It carries no chat
 * history and has no account system. Adapted from the circuit-relay server in
 * FraterCCCLXIII/holons-p2p (test/utils/relay.js, MIT, (c) Protocol Labs / Haja Networks).
 *
 * It does two jobs: (1) circuit relay v2, so browsers behind NAT can be reached; (2) it joins
 * every pubsub topic it sees so announcements ("here I am") reach all peers. Run:
 *   npm run relay            # listens on ws://0.0.0.0:12345
 *   PORT=9000 npm run relay
 */
import { createLibp2p } from "libp2p";
import { generateKeyPair, privateKeyFromProtobuf, privateKeyToProtobuf } from "@libp2p/crypto/keys";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { identify } from "@libp2p/identify";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { DISCOVERY_TOPIC } from "../src/topic.js";

const port = Number(process.env.PORT || 12345);

export async function startRelay({ port = 12345, host = "0.0.0.0", quiet = false, keyFile } = {}) {
  let privateKey;
  if (keyFile) {
    if (existsSync(keyFile)) privateKey = privateKeyFromProtobuf(Buffer.from(readFileSync(keyFile, "utf8").trim(), "hex"));
    else { privateKey = await generateKeyPair("Ed25519"); writeFileSync(keyFile, Buffer.from(privateKeyToProtobuf(privateKey)).toString("hex"), { mode: 0o600 }); }
  }
  const server = await createLibp2p({
    ...(privateKey ? { privateKey } : {}),
    addresses: { listen: [`/ip4/${host}/tcp/${port}/ws`] },
    transports: [webSockets({ filter: filters.all })],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    connectionGater: { denyDialMultiaddr: () => false },
    peerDiscovery: [pubsubPeerDiscovery({ interval: 8000, topics: [DISCOVERY_TOPIC] })],
    services: {
      identify: identify({ runOnLimitedConnection: true }),
      pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, emitSelf: false, runOnLimitedConnection: true }),
      relay: circuitRelayServer({
        reservations: { maxReservations: 500, defaultDurationLimit: 24 * 3600 * 1000, defaultDataLimit: BigInt(1024 * 1024 * 1024) },
      }),
    },
  });
  // Forward every topic any peer subscribes to, so gossip crosses the relay.
  const follow = (topic) => { if (!server.services.pubsub.getTopics().includes(topic)) server.services.pubsub.subscribe(topic); };
  server.services.pubsub.addEventListener("subscription-change", (e) => e.detail.subscriptions.forEach((s) => s.subscribe && follow(s.topic)));
  server.services.pubsub.subscribe(DISCOVERY_TOPIC);
  if (!quiet) {
    server.addEventListener("peer:connect", (e) => console.log("peer:connect   ", e.detail.toString()));
    server.addEventListener("peer:disconnect", (e) => console.log("peer:disconnect", e.detail.toString()));
  }
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await startRelay({ port, keyFile: fileURLToPath(new URL("./relay-key.hex", import.meta.url)) });
  console.log("Murmur relay is up. Paste one of these into Murmur > Settings > Relay:\n");
  server.getMultiaddrs().map(String).forEach((a) => console.log("  " + a));
  console.log("\nOnly reachable on this computer/LAN unless you forward the port or put it behind a wss:// proxy.");
}
