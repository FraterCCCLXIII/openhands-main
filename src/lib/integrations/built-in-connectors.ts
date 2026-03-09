import type {
  AuthStrategy,
  BuiltInConnectorOption,
  FunctionSpec,
} from "@/src/types/context-layer";

interface BuiltInFunctionDefinition {
  name: string;
  description: string;
  defaultScopes: string[];
}

interface BuiltInConnectorDefinition extends Omit<BuiltInConnectorOption, "toolCount"> {
  authStrategy: AuthStrategy;
  serverPath: string;
  functions: BuiltInFunctionDefinition[];
}

const builtInConnectorDefinitions = [
  {
    slug: "github",
    name: "GitHub",
    description:
      "Vercel-hosted MCP wrapper for GitHub profile, repositories, and issues.",
    appUrl: "https://github.com",
    categories: ["Engineering", "Source control"],
    authModes: ["bearer"],
    authStrategy: "bearer",
    credentialLabel: "GitHub token",
    credentialPlaceholder: "ghp_... or github_pat_...",
    credentialHelp:
      "Use a GitHub personal access token with the repository scopes you want these tools to access.",
    serverPath: "/api/mcp/github",
    functions: [
      {
        name: "get_me",
        description: "Get the authenticated GitHub user profile.",
        defaultScopes: ["read"],
      },
      {
        name: "list_repositories",
        description: "List repositories for the authenticated user.",
        defaultScopes: ["read"],
      },
      {
        name: "get_issue",
        description: "Fetch a single GitHub issue or pull request by number.",
        defaultScopes: ["read"],
      },
      {
        name: "create_issue",
        description: "Create a GitHub issue in a repository.",
        defaultScopes: ["write"],
      },
    ],
  },
  {
    slug: "figma",
    name: "Figma",
    description:
      "Vercel-hosted MCP wrapper for Figma files, nodes, and rendered assets.",
    appUrl: "https://www.figma.com/developers/api",
    categories: ["Design", "Frontend"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    credentialLabel: "Connect Figma",
    credentialPlaceholder: "Connect your Figma account",
    credentialHelp:
      "Use the OAuth button below to connect a Figma account and store the access token per user.",
    serverPath: "/api/mcp/figma",
    functions: [
      {
        name: "get_file",
        description: "Fetch a Figma file and its document tree.",
        defaultScopes: ["read"],
      },
      {
        name: "get_nodes",
        description: "Fetch specific nodes from a Figma file.",
        defaultScopes: ["read"],
      },
      {
        name: "get_images",
        description: "Generate rendered image URLs for Figma nodes.",
        defaultScopes: ["read"],
      },
    ],
  },
  {
    slug: "notion",
    name: "Notion",
    description:
      "Vercel-hosted MCP wrapper for Notion search, pages, and writebacks.",
    appUrl: "https://developers.notion.com/reference/intro",
    categories: ["Knowledge base", "Documentation"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    credentialLabel: "Connect Notion",
    credentialPlaceholder: "Connect your Notion workspace",
    credentialHelp:
      "Use the OAuth button below to connect a Notion workspace and store the access token per user.",
    serverPath: "/api/mcp/notion",
    functions: [
      {
        name: "search",
        description: "Search Notion pages and databases.",
        defaultScopes: ["read"],
      },
      {
        name: "get_page",
        description: "Fetch a Notion page by page ID.",
        defaultScopes: ["read"],
      },
      {
        name: "create_page",
        description: "Create a new Notion page under a parent page.",
        defaultScopes: ["write"],
      },
      {
        name: "append_text",
        description: "Append a text block to an existing Notion page.",
        defaultScopes: ["write"],
      },
    ],
  },
  {
    slug: "slack",
    name: "Slack",
    description:
      "Vercel-hosted MCP wrapper for Slack channels, history, and posting messages.",
    appUrl: "https://docs.slack.dev",
    categories: ["Communication", "Operations"],
    authModes: ["bearer"],
    authStrategy: "bearer",
    credentialLabel: "Slack bot token",
    credentialPlaceholder: "xoxb-...",
    credentialHelp:
      "Use a Slack bot token with the channel history and chat:write scopes your workflows require.",
    serverPath: "/api/mcp/slack",
    functions: [
      {
        name: "list_channels",
        description: "List Slack conversations visible to the token.",
        defaultScopes: ["read"],
      },
      {
        name: "get_channel_history",
        description: "Fetch recent Slack messages from a channel.",
        defaultScopes: ["read"],
      },
      {
        name: "post_message",
        description: "Post a message to Slack.",
        defaultScopes: ["write"],
      },
    ],
  },
  {
    slug: "google-docs",
    name: "Google Docs",
    description:
      "Vercel-hosted MCP wrapper for Google Drive search and Google Docs read/write operations.",
    appUrl: "https://developers.google.com/workspace",
    categories: ["Knowledge base", "Documents"],
    authModes: ["bearer"],
    authStrategy: "bearer",
    credentialLabel: "Google access token",
    credentialPlaceholder: "ya29....",
    credentialHelp:
      "Use a Google OAuth access token with both Docs and Drive scopes. Because this is a raw bearer token, you may need to refresh it periodically.",
    serverPath: "/api/mcp/google-docs",
    functions: [
      {
        name: "search_files",
        description: "Search Google Drive for Docs and related files.",
        defaultScopes: ["read"],
      },
      {
        name: "get_document",
        description: "Fetch a Google Docs document by ID.",
        defaultScopes: ["read"],
      },
      {
        name: "create_document",
        description: "Create a new Google Docs document.",
        defaultScopes: ["write"],
      },
      {
        name: "append_text",
        description: "Append text to the end of a Google Docs document.",
        defaultScopes: ["write"],
      },
    ],
  },
] satisfies BuiltInConnectorDefinition[];

export const getBuiltInConnectorDefinition = (slug: string) =>
  builtInConnectorDefinitions.find((connector) => connector.slug === slug) ?? null;

export const listBuiltInConnectors = (): BuiltInConnectorOption[] =>
  builtInConnectorDefinitions.map(({ functions, serverPath: _serverPath, ...connector }) => ({
    ...connector,
    toolCount: functions.length,
  }));

export const buildBuiltInConnectorFunctions = (
  slug: string,
): Record<string, FunctionSpec> => {
  const connector = getBuiltInConnectorDefinition(slug);

  if (!connector) {
    return {};
  }

  return Object.fromEntries(
    connector.functions.map((tool) => [
      tool.name,
      {
        name: tool.name,
        description: tool.description,
        enabled: true,
        accessMode: "enabled",
        fineGrainedPermissions: true,
        defaultScopes: tool.defaultScopes,
        executionMode: "provider",
        config: {
          toolName: tool.name,
        },
      },
    ]),
  );
};
