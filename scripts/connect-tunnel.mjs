import { spawn } from "node:child_process";

export const CONNECT_TUNNEL_PATH = "/__oh/connect-tunnel";

const TRYCLOUDFLARE_URL = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

/** @type {{ target: string, url: string, child: import("node:child_process").ChildProcess } | null} */
let activeTunnel = null;
/** @type {Promise<string> | null} */
let starting = null;

export function parseCloudflaredUrl(line) {
  const match = String(line).match(TRYCLOUDFLARE_URL);
  return match?.[0] ?? null;
}

export function getConnectTunnelUrl() {
  return activeTunnel?.url ?? null;
}

export function isConnectTunnelRequest(req) {
  const path = (req.url ?? "").split("?")[0];
  return path === CONNECT_TUNNEL_PATH;
}

function writeJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function stopConnectTunnel() {
  if (!activeTunnel) {
    return;
  }
  const { child } = activeTunnel;
  activeTunnel = null;
  starting = null;
  child.kill("SIGTERM");
}

function spawnCloudflared(targetUrl) {
  const args = [
    "tunnel",
    "--no-autoupdate",
    "--url",
    targetUrl,
  ];
  const fromPath = spawn("cloudflared", args, {
    stdio: ["ignore", "pipe", "pipe"],
  });
  fromPath.once("error", () => {
    // Fallback is started only when the PATH binary cannot be spawned.
  });
  return fromPath;
}

function spawnCloudflaredViaNpx(targetUrl) {
  return spawn(
    "npx",
    ["--yes", "cloudflared@0.7.3", "tunnel", "--no-autoupdate", "--url", targetUrl],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function waitForTunnelUrl(child, timeoutMs = 45_000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const buffer = [];
    const finish = (error, url) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      child.stdout?.off("data", onData);
      child.stderr?.off("data", onData);
      child.off("exit", onExit);
      if (error) {
        reject(error);
        return;
      }
      resolve(url);
    };
    const onData = (chunk) => {
      const text = String(chunk);
      buffer.push(text);
      const url = parseCloudflaredUrl(text);
      if (url) {
        finish(null, url);
      }
    };
    const onExit = (code) => {
      finish(
        new Error(
          `cloudflared exited before publishing a URL (${code ?? "unknown"}). ${buffer.join("").slice(-400)}`,
        ),
      );
    };
    const timer = setTimeout(() => {
      finish(new Error("Timed out waiting for a phone-reachable tunnel URL."));
    }, timeoutMs);
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.once("exit", onExit);
  });
}

export async function startConnectTunnel(targetUrl) {
  if (activeTunnel?.target === targetUrl && activeTunnel.url) {
    return activeTunnel.url;
  }
  if (starting) {
    return starting;
  }
  stopConnectTunnel();
  starting = (async () => {
    let child = spawnCloudflared(targetUrl);
    const firstError = await new Promise((resolve) => {
      const onError = (error) => resolve(error);
      child.once("error", onError);
      setTimeout(() => {
        child.off("error", onError);
        resolve(null);
      }, 50);
    });
    if (firstError) {
      child = spawnCloudflaredViaNpx(targetUrl);
    }
    try {
      const url = await waitForTunnelUrl(child);
      activeTunnel = { target: targetUrl, url, child };
      child.once("exit", () => {
        if (activeTunnel?.child === child) {
          activeTunnel = null;
        }
      });
      return url;
    } catch (error) {
      child.kill("SIGTERM");
      throw error;
    }
  })();
  try {
    return await starting;
  } finally {
    starting = null;
  }
}

export async function resolveConnectTunnelTarget(listenPort) {
  try {
    const response = await fetch("http://127.0.0.1:8000/__oh/connect-hosts", {
      signal: AbortSignal.timeout(250),
    });
    if (response.ok) {
      return "http://127.0.0.1:8000";
    }
  } catch {
    // Ingress is not running; tunnel the server that handled this request.
  }
  return `http://127.0.0.1:${listenPort}`;
}

export async function writeConnectTunnelResponse(req, res, targetUrl) {
  const method = req.method ?? "GET";
  if (method === "GET" || method === "HEAD") {
    writeJson(res, 200, { url: getConnectTunnelUrl() });
    return;
  }
  if (method !== "POST") {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const url = await startConnectTunnel(targetUrl);
    writeJson(res, 200, { url });
  } catch (error) {
    writeJson(res, 503, {
      error:
        error instanceof Error
          ? error.message
          : "Could not create a phone-reachable link.",
    });
  }
}
