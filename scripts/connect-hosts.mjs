import os from "node:os";

export const CONNECT_HOSTS_PATH = "/__oh/connect-hosts";

function isPhoneReachableIpv4(address) {
  return (
    typeof address === "string" &&
    !address.startsWith("127.") &&
    !address.startsWith("169.254.")
  );
}

export function listConnectOrigins(port) {
  const origins = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      const family = entry.family === 4 ? "IPv4" : entry.family;
      if (family !== "IPv4" || entry.internal) {
        continue;
      }
      if (!isPhoneReachableIpv4(entry.address)) {
        continue;
      }
      origins.push(`http://${entry.address}:${port}`);
    }
  }
  return [...new Set(origins)];
}

export function isConnectHostsRequest(req) {
  const path = (req.url ?? "").split("?")[0];
  return (
    (req.method === "GET" || req.method === "HEAD") &&
    path === CONNECT_HOSTS_PATH
  );
}

export function writeConnectHostsResponse(res, port) {
  const body = JSON.stringify({ origins: listConnectOrigins(port) });
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}
