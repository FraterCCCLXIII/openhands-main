import { describe, expect, it } from "vitest";

import {
  buildDefaultMcpTransportOrder,
  getMcpTransportOrder,
  parseMcpTransportOrder,
} from "@/src/lib/mcp-transport-policy";

describe("parseMcpTransportOrder", () => {
  it("keeps only valid transport targets", () => {
    expect(
      parseMcpTransportOrder([
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

describe("buildDefaultMcpTransportOrder", () => {
  it("defaults to streamable HTTP at the configured server URL", () => {
    expect(buildDefaultMcpTransportOrder("https://mcp.acme.test/mcp")).toEqual([
      {
        transport: "streamable_http",
        url: "https://mcp.acme.test/mcp",
      },
    ]);
  });
});

describe("getMcpTransportOrder", () => {
  it("uses the first config that explicitly defines transport order", () => {
    expect(
      getMcpTransportOrder(
        "https://mcp.acme.test/mcp",
        {
          mcpTransportOrder: [
            {
              transport: "sse",
              url: "https://mcp.acme.test/sse",
            },
          ],
        },
        {
          mcpTransportOrder: [
            {
              transport: "streamable_http",
              url: "https://mcp.acme.test/alternate-mcp",
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

  it("falls back to the default transport order when the explicit config is empty", () => {
    expect(
      getMcpTransportOrder(
        "https://mcp.acme.test/mcp",
        {
          mcpTransportOrder: [],
        },
      ),
    ).toEqual([
      {
        transport: "streamable_http",
        url: "https://mcp.acme.test/mcp",
      },
    ]);
  });

  it("uses the default transport order when no config defines one", () => {
    expect(
      getMcpTransportOrder("https://mcp.acme.test/mcp", {
        serverUrl: "https://mcp.acme.test/mcp",
      }),
    ).toEqual([
      {
        transport: "streamable_http",
        url: "https://mcp.acme.test/mcp",
      },
    ]);
  });
});
