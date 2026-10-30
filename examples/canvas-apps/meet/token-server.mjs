/* Mints LiveKit join tokens for Meet. The API secret stays here, never in the extension.
 *
 *   npm i livekit-server-sdk        (once, in this folder)
 *   livekit-server --dev            (another terminal; key "devkey", secret "secret")
 *   node token-server.mjs
 *
 * GET /token?room=standup&identity=ada  ->  { "token": "<jwt>" }
 */
import { createServer } from "node:http";
import { AccessToken } from "livekit-server-sdk";

const PORT = Number(process.env.PORT || 7891);
const KEY = process.env.LIVEKIT_API_KEY || "devkey";
const SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const clean = (v) => String(v || "").replace(/[^\w .-]/g, "").trim().slice(0, 64);

createServer(async (req, res) => {
  const headers = { "access-control-allow-origin": "*", "content-type": "application/json" };
  const url = new URL(req.url, "http://localhost");
  if (req.method === "OPTIONS") { res.writeHead(204, headers).end(); return; }
  const room = clean(url.searchParams.get("room"));
  const identity = clean(url.searchParams.get("identity"));
  if (url.pathname !== "/token" || !room || !identity) { res.writeHead(400, headers).end(JSON.stringify({ error: "room and identity required" })); return; }
  const at = new AccessToken(KEY, SECRET, { identity, ttl: "2h" });
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true });
  res.writeHead(200, headers).end(JSON.stringify({ token: await at.toJwt() }));
}).listen(PORT, "127.0.0.1", () => console.log(`Meet token server on http://127.0.0.1:${PORT}/token`));
