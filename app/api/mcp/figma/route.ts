import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { handleStatelessMcpRequest } from "@/src/lib/mcp/route-handler";
import { fetchJson, toToolResult } from "@/src/lib/mcp/provider-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const createServer = (token: string) => {
  const server = new McpServer({ name: "figma-built-in", version: "0.2.0" });
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  server.registerTool(
    "get_file",
    {
      description: "Fetch a Figma file and its document tree.",
      inputSchema: {
        fileKey: z.string().min(1),
        depth: z.number().int().positive().optional(),
      },
    },
    async ({ fileKey, depth }) => {
      const url = new URL(`https://api.figma.com/v1/files/${fileKey}`);
      if (depth) {
        url.searchParams.set("depth", String(depth));
      }
      return toToolResult(await fetchJson(url, { headers }, "Figma get_file"));
    },
  );

  server.registerTool(
    "get_nodes",
    {
      description: "Fetch specific nodes from a Figma file.",
      inputSchema: {
        fileKey: z.string().min(1),
        nodeIds: z.array(z.string().min(1)).min(1),
      },
    },
    async ({ fileKey, nodeIds }) => {
      const url = new URL(`https://api.figma.com/v1/files/${fileKey}/nodes`);
      url.searchParams.set("ids", nodeIds.join(","));
      return toToolResult(await fetchJson(url, { headers }, "Figma get_nodes"));
    },
  );

  server.registerTool(
    "get_images",
    {
      description: "Generate image URLs for nodes in a Figma file.",
      inputSchema: {
        fileKey: z.string().min(1),
        nodeIds: z.array(z.string().min(1)).min(1),
        format: z.enum(["jpg", "png", "svg", "pdf"]).optional(),
      },
    },
    async ({ fileKey, nodeIds, format = "png" }) => {
      const url = new URL(`https://api.figma.com/v1/images/${fileKey}`);
      url.searchParams.set("ids", nodeIds.join(","));
      url.searchParams.set("format", format);
      return toToolResult(await fetchJson(url, { headers }, "Figma get_images"));
    },
  );

  return server;
};

export const POST = (request: Request) =>
  handleStatelessMcpRequest(request, createServer);
export const DELETE = POST;
