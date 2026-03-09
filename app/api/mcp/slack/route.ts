import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { handleStatelessMcpRequest } from "@/src/lib/mcp/route-handler";
import { fetchJson, toToolResult } from "@/src/lib/mcp/provider-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const callSlack = async <T>(
  token: string,
  method: string,
  body?: Record<string, unknown>,
) => {
  const response = await fetchJson<{ ok: boolean; error?: string } & T>(
    `https://slack.com/api/${method}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body ?? {}),
    },
    `Slack ${method}`,
  );

  if (!response.ok) {
    throw new Error(`Slack ${method} failed: ${response.error ?? "unknown_error"}`);
  }

  return response;
};

const createServer = (token: string) => {
  const server = new McpServer({ name: "slack-built-in", version: "0.2.0" });

  server.registerTool(
    "list_channels",
    {
      description: "List channels and conversations visible to the Slack token.",
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional(),
      },
    },
    async ({ limit = 25 }) =>
      toToolResult(
        await callSlack<{ channels?: unknown[] }>(token, "conversations.list", {
          limit,
          exclude_archived: true,
          types: "public_channel,private_channel",
        }),
      ),
  );

  server.registerTool(
    "get_channel_history",
    {
      description: "Fetch recent messages from a Slack channel.",
      inputSchema: {
        channel: z.string().min(1),
        limit: z.number().int().min(1).max(200).optional(),
      },
    },
    async ({ channel, limit = 20 }) =>
      toToolResult(
        await callSlack<{ messages?: unknown[] }>(token, "conversations.history", {
          channel,
          limit,
        }),
      ),
  );

  server.registerTool(
    "post_message",
    {
      description: "Post a message to a Slack channel.",
      inputSchema: {
        channel: z.string().min(1),
        text: z.string().min(1),
        threadTs: z.string().optional(),
      },
    },
    async ({ channel, text, threadTs }) =>
      toToolResult(
        await callSlack(token, "chat.postMessage", {
          channel,
          text,
          thread_ts: threadTs,
        }),
      ),
  );

  return server;
};

export const POST = (request: Request) =>
  handleStatelessMcpRequest(request, createServer);
export const DELETE = POST;
