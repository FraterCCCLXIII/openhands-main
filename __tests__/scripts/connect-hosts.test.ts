import { describe, expect, it } from "vitest";
import {
  CONNECT_HOSTS_PATH,
  isConnectHostsRequest,
  listConnectOrigins,
} from "../../scripts/connect-hosts.mjs";

describe("connect-hosts", () => {
  it("matches the pairing discovery path", () => {
    expect(
      isConnectHostsRequest({ method: "GET", url: CONNECT_HOSTS_PATH }),
    ).toBe(true);
    expect(isConnectHostsRequest({ method: "POST", url: CONNECT_HOSTS_PATH })).toBe(
      false,
    );
  });

  it("never advertises loopback or USB link-local addresses", () => {
    const origins = listConnectOrigins(8000);
    expect(origins.every((origin) => origin.startsWith("http://"))).toBe(true);
    expect(origins.some((origin) => origin.includes("127.0.0.1"))).toBe(false);
    expect(origins.some((origin) => origin.includes("169.254."))).toBe(false);
  });
});
