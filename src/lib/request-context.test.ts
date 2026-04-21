import { describe, expect, it } from "vitest";

import {
  getRequestHost,
  getRequestOrigin,
  isAllowedWhenAuthDisabled,
  isLoopbackHost,
} from "@/src/lib/request-context";

const env = (values: Record<string, string>) =>
  values as unknown as NodeJS.ProcessEnv;

describe("request-context", () => {
  it("recognizes loopback hosts", () => {
    expect(isLoopbackHost("localhost:3000")).toBe(true);
    expect(isLoopbackHost("127.0.0.1:3000")).toBe(true);
    expect(isLoopbackHost("[::1]:3000")).toBe(true);
    expect(isLoopbackHost("agent.localhost")).toBe(true);
    expect(isLoopbackHost("example.com")).toBe(false);
  });

  it("prefers the forwarded host when deriving request context", () => {
    const requestHeaders = new Headers({
      host: "localhost:3000",
      "x-forwarded-host": "work-1.example.dev",
    });

    expect(getRequestHost(requestHeaders)).toBe("work-1.example.dev");
  });

  it("blocks non-loopback requests when auth is disabled", () => {
    const externalHeaders = new Headers({ host: "work-1.example.dev" });
    const localHeaders = new Headers({ host: "localhost:3000" });

    expect(isAllowedWhenAuthDisabled(externalHeaders, env({ DISABLE_AUTH: "true" }))).toBe(false);
    expect(isAllowedWhenAuthDisabled(localHeaders, env({ DISABLE_AUTH: "true" }))).toBe(true);
    expect(isAllowedWhenAuthDisabled(externalHeaders, env({ DISABLE_AUTH: "false" }))).toBe(true);
  });

  it("does not trust forwarded hosts when gating DISABLE_AUTH access", () => {
    const spoofedHeaders = new Headers({
      host: "context-layer.example.com",
      "x-forwarded-host": "localhost:3000",
    });

    expect(isAllowedWhenAuthDisabled(spoofedHeaders, env({ DISABLE_AUTH: "true" }))).toBe(
      false,
    );
  });

  it("derives the current origin from request headers", () => {
    const localHeaders = new Headers({ host: "localhost:12000" });
    expect(getRequestOrigin(localHeaders)).toBe("http://localhost:12000");

    const proxiedHeaders = new Headers({
      host: "localhost:12000",
      "x-forwarded-host": "context-layer.example.com",
      "x-forwarded-proto": "https",
    });
    expect(getRequestOrigin(proxiedHeaders)).toBe(
      "https://context-layer.example.com",
    );
  });
});
