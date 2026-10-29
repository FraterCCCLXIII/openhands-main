import defaults from "../../config/defaults.json";
import {
  getDisplayAgentServerVersion,
  type AgentServerInfo,
} from "./agent-server-compatibility";

export interface DetectedBackend {
  /** Address to connect to, such as `http://localhost:8000`. */
  host: string;
  port: number;
  /** Agent Server version when the server identified itself, else null. */
  version: string | null;
  /**
   * True when `/server_info` answered like an Agent Server. False means
   * something is listening but the browser could not read its reply (for
   * example, cross-origin access is blocked), so it may or may not be one.
   */
  identified: boolean;
}

// Local stacks run side by side by offsetting the proxy and Agent Server
// ports, so each default is probed along with the few ports after it.
const PORT_SPAN = 6;
const PROBE_TIMEOUT_MS = 1200;

/** Ports a local backend usually listens on, from the shared defaults. */
export function localBackendCandidatePorts(
  currentPort?: number | null,
): number[] {
  const bases = [defaults.ports.proxy, defaults.ports.agentServer];
  const ports = bases.flatMap((base) =>
    Array.from({ length: PORT_SPAN }, (_, offset) => base + offset),
  );
  // The page's own port is the frontend, never a backend.
  return [...new Set(ports)].filter((port) => port !== currentPort);
}

const looksLikeServerInfo = (value: unknown): value is AgentServerInfo =>
  !!value &&
  typeof value === "object" &&
  ("version" in value || "sdk_version" in value);

async function probe(
  port: number,
  fetchFn: typeof fetch,
): Promise<DetectedBackend | null> {
  const host = `http://localhost:${port}`;
  const timeout = () => AbortSignal.timeout(PROBE_TIMEOUT_MS);
  try {
    // /server_info is unprotected, so it answers without an API key.
    const response = await fetchFn(`${host}/server_info`, {
      signal: timeout(),
    });
    // Something answered, but it is not an Agent Server.
    if (!response.ok) return null;
    const info: unknown = await response.json().catch(() => null);
    if (!looksLikeServerInfo(info)) return null;
    return {
      host,
      port,
      version: getDisplayAgentServerVersion(info),
      identified: true,
    };
  } catch {
    // A network error and a cross-origin block look the same. An opaque
    // request settles only when something is listening.
    try {
      await fetchFn(host, { mode: "no-cors", signal: timeout() });
      return { host, port, version: null, identified: false };
    } catch {
      return null;
    }
  }
}

/** Looks for Agent Servers listening on this machine's usual ports. */
export async function detectLocalBackends({
  ports = localBackendCandidatePorts(
    Number.parseInt(window.location.port, 10) || null,
  ),
  fetchFn = fetch,
}: { ports?: number[]; fetchFn?: typeof fetch } = {}): Promise<
  DetectedBackend[]
> {
  const found = await Promise.all(ports.map((port) => probe(port, fetchFn)));
  return found
    .filter((backend): backend is DetectedBackend => backend !== null)
    .sort(
      (a, b) => Number(b.identified) - Number(a.identified) || a.port - b.port,
    );
}
