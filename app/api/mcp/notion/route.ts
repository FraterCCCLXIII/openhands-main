import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { handleStatelessMcpRequest } from "@/src/lib/mcp/route-handler";
import { fetchJson, toToolResult } from "@/src/lib/mcp/provider-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const createServer = (token: string) => {
  const server = new McpServer({ name: "notion-built-in", version: "0.2.0" });
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };

  server.registerTool(
    "search",
    {
      description: "Search Notion pages and databases.",
      inputSchema: {
        query: z.string().optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ query = "", pageSize = 10 }) =>
      toToolResult(
        await fetchJson(
          "https://api.notion.com/v1/search",
          {
            method: "POST",
            headers,
            body: JSON.stringify({ query, page_size: pageSize }),
          },
          "Notion search",
        ),
      ),
  );

  server.registerTool(
    "get_page",
    {
      description: "Fetch a Notion page by page ID.",
      inputSchema: {
        pageId: z.string().min(1),
      },
    },
    async ({ pageId }) =>
      toToolResult(
        await fetchJson(`https://api.notion.com/v1/pages/${pageId}`, { headers }, "Notion get_page"),
      ),
  );

  server.registerTool(
    "create_page",
    {
      description: "Create a new Notion page under a parent page.",
      inputSchema: {
        parentPageId: z.string().min(1),
        title: z.string().min(1),
        content: z.string().optional(),
      },
    },
    async ({ parentPageId, title, content = "" }) => {
      const body = {
        parent: { type: "page_id", page_id: parentPageId },
        properties: {
          title: {
            title: [{ type: "text", text: { content: title } }],
          },
        },
        children: content
          ? [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ type: "text", text: { content } }],
                },
              },
            ]
          : [],
      };

      return toToolResult(
        await fetchJson(
          "https://api.notion.com/v1/pages",
          {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          },
          "Notion create_page",
        ),
      );
    },
  );

  server.registerTool(
    "append_text",
    {
      description: "Append a text block to an existing Notion page.",
      inputSchema: {
        pageId: z.string().min(1),
        content: z.string().min(1),
      },
    },
    async ({ pageId, content }) =>
      toToolResult(
        await fetchJson(
          `https://api.notion.com/v1/blocks/${pageId}/children`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              children: [
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ type: "text", text: { content } }],
                  },
                },
              ],
            }),
          },
          "Notion append_text",
        ),
      ),
  );

  return server;
};

export const POST = (request: Request) =>
  handleStatelessMcpRequest(request, createServer);
export const DELETE = POST;
