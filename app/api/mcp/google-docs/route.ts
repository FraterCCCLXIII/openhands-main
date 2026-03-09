import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { handleStatelessMcpRequest } from "@/src/lib/mcp/route-handler";
import { fetchJson, toToolResult } from "@/src/lib/mcp/provider-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const createServer = (token: string) => {
  const server = new McpServer({ name: "google-docs-built-in", version: "0.2.0" });
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  server.registerTool(
    "search_files",
    {
      description: "Search Google Drive for documents and related files.",
      inputSchema: {
        query: z.string().optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ query = "mimeType='application/vnd.google-apps.document'", pageSize = 10 }) => {
      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("q", query);
      url.searchParams.set("pageSize", String(pageSize));
      url.searchParams.set(
        "fields",
        "files(id,name,mimeType,webViewLink,modifiedTime),nextPageToken",
      );
      return toToolResult(await fetchJson(url, { headers }, "Google Drive search_files"));
    },
  );

  server.registerTool(
    "get_document",
    {
      description: "Fetch a Google Docs document by ID.",
      inputSchema: {
        documentId: z.string().min(1),
      },
    },
    async ({ documentId }) =>
      toToolResult(
        await fetchJson(
          `https://docs.googleapis.com/v1/documents/${documentId}`,
          { headers },
          "Google Docs get_document",
        ),
      ),
  );

  server.registerTool(
    "create_document",
    {
      description: "Create a new Google Docs document.",
      inputSchema: {
        title: z.string().min(1),
      },
    },
    async ({ title }) =>
      toToolResult(
        await fetchJson(
          "https://docs.googleapis.com/v1/documents",
          {
            method: "POST",
            headers,
            body: JSON.stringify({ title }),
          },
          "Google Docs create_document",
        ),
      ),
  );

  server.registerTool(
    "append_text",
    {
      description: "Append text to the end of a Google Docs document.",
      inputSchema: {
        documentId: z.string().min(1),
        text: z.string().min(1),
      },
    },
    async ({ documentId, text }) => {
      const document = await fetchJson<{ body?: { content?: Array<{ endIndex?: number }> } }>(
        `https://docs.googleapis.com/v1/documents/${documentId}`,
        { headers },
        "Google Docs get_document",
      );
      const lastEndIndex = document.body?.content?.at(-1)?.endIndex ?? 1;
      const insertIndex = Math.max(1, lastEndIndex - 1);

      return toToolResult(
        await fetchJson(
          `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              requests: [
                {
                  insertText: {
                    location: { index: insertIndex },
                    text,
                  },
                },
              ],
            }),
          },
          "Google Docs append_text",
        ),
      );
    },
  );

  return server;
};

export const POST = (request: Request) =>
  handleStatelessMcpRequest(request, createServer);
export const DELETE = POST;
