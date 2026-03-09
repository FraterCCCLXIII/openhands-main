import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { handleStatelessMcpRequest } from "@/src/lib/mcp/route-handler";
import { fetchJson, toToolResult } from "@/src/lib/mcp/provider-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const createServer = (token: string) => {
  const server = new McpServer({ name: "github-built-in", version: "0.2.0" });
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  server.registerTool(
    "get_me",
    {
      description: "Get the authenticated GitHub user profile.",
    },
    async () =>
      toToolResult(
        await fetchJson("https://api.github.com/user", { headers }, "GitHub get_me"),
      ),
  );

  server.registerTool(
    "list_repositories",
    {
      description: "List repositories for the authenticated GitHub user.",
      inputSchema: {
        perPage: z.number().int().min(1).max(100).optional(),
        type: z.enum(["all", "owner", "member"]).optional(),
      },
    },
    async ({ perPage = 20, type = "owner" }) => {
      const url = new URL("https://api.github.com/user/repos");
      url.searchParams.set("per_page", String(perPage));
      url.searchParams.set("type", type);
      url.searchParams.set("sort", "updated");
      return toToolResult(await fetchJson(url, { headers }, "GitHub list_repositories"));
    },
  );

  server.registerTool(
    "get_issue",
    {
      description: "Fetch a GitHub issue or pull request by repository and number.",
      inputSchema: {
        owner: z.string().min(1),
        repo: z.string().min(1),
        issueNumber: z.number().int().positive(),
      },
    },
    async ({ owner, repo, issueNumber }) =>
      toToolResult(
        await fetchJson(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
          { headers },
          "GitHub get_issue",
        ),
      ),
  );

  server.registerTool(
    "create_issue",
    {
      description: "Create a GitHub issue in a repository.",
      inputSchema: {
        owner: z.string().min(1),
        repo: z.string().min(1),
        title: z.string().min(1),
        body: z.string().optional(),
      },
    },
    async ({ owner, repo, title, body }) =>
      toToolResult(
        await fetchJson(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title, body }),
          },
          "GitHub create_issue",
        ),
      ),
  );

  return server;
};

export const POST = (request: Request) =>
  handleStatelessMcpRequest(request, createServer);
export const DELETE = POST;
