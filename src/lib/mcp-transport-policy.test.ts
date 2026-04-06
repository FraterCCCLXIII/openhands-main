import { describe, expect, it } from "vitest";

import {
  getMcpTransportFallbacks,
  parseMcpTransportFallbacks,
} from "@/src/lib/mcp-transport-policy";

describe("parseMcpTransportFallbacks", () => {
  it("keeps only valid fallback transport entries", () => {
    expect(
      parseMcpTransportFallbacks([
        {
          transport: "sse",
          url: " https://mcp.acme.test/sse ",
        },
        {
          transport: "invalid",
          url: "https://mcp.acme.test/ignored",
        },
        {
          transport: "streamable_http",
          url: "",
        },
        {
          transport: "sse",
          url: "not-a-url",
        },
      ]),
    ).toEqual([
      {
        transport: "sse",
        url: "https://mcp.acme.test/sse",
      },
    ]);
  });
});

describe("getMcpTransportFallbacks", () => {
  it("uses the first config that explicitly defines MCP fallback metadata", () => {
    expect(
      getMcpTransportFallbacks(
        {
          mcpTransportFallbacks: [],
        },
        {
          mcpTransportFallbacks: [
            {
              transport: "sse",
              url: "https://mcp.acme.test/sse",
            },
          ],
        },
      ),
    ).toEqual([]);
  });

  it("falls back to later configs when earlier ones omit MCP fallback metadata", () => {
    expect(
      getMcpTransportFallbacks(
        {
          serverUrl: "https://mcp.acme.test/mcp",
        },
        {
          mcpTransportFallbacks: [
            {
              transport: "sse",
              url: "https://mcp.acme.test/sse",
            },
          ],
        },
      ),
    ).toEqual([
      {
        transport: "sse",
        url: "https://mcp.acme.test/sse",
      },
    ]);
  });
});
