import { describe, expect, it } from "vitest";
import {
  isUnreachableFromPhone,
  suggestMobileConnectHost,
} from "#/utils/mobile-connect-host";
import {
  buildMobileConnectUrl,
  parseMobileConnectUrl,
} from "#/utils/mobile-connect-payload";

describe("mobile connect payload", () => {
  it("round-trips host, session key, and name through the QR URL", () => {
    const url = buildMobileConnectUrl({
      host: "http://172.20.0.234:8000",
      apiKey: "session-secret",
      name: "Laptop",
    });

    expect(url.startsWith("openhands://connect?")).toBe(true);
    expect(parseMobileConnectUrl(url)).toEqual({
      host: "http://172.20.0.234:8000",
      apiKey: "session-secret",
      name: "Laptop",
    });
  });

  it("rejects localhost-looking garbage and missing keys", () => {
    expect(parseMobileConnectUrl("https://example.com")).toBeNull();
    expect(parseMobileConnectUrl("openhands://connect?v=1&host=ftp://x&key=a")).toBeNull();
    expect(
      parseMobileConnectUrl("openhands://connect?v=1&host=http://x:8000"),
    ).toBeNull();
  });
});

describe("mobile connect host", () => {
  it("treats loopback and USB link-local hosts as unreachable from a phone", () => {
    expect(isUnreachableFromPhone("http://127.0.0.1:8000")).toBe(true);
    expect(isUnreachableFromPhone("http://localhost:3001")).toBe(true);
    expect(isUnreachableFromPhone("http://169.254.148.212:8081")).toBe(true);
    expect(isUnreachableFromPhone("http://172.20.0.234:8000")).toBe(false);
  });

  it("prefers a LAN origin over localhost page or agent-server loopback", () => {
    expect(
      suggestMobileConnectHost({
        backendHost: "http://127.0.0.1:18000",
        pageOrigin: "http://localhost:3001",
        lanOrigins: ["http://172.20.0.234:8000"],
      }),
    ).toBe("http://172.20.0.234:8000");
  });
});
