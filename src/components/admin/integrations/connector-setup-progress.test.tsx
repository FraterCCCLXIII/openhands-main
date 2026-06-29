// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectorSetupProgress } from "@/src/components/admin/integrations/connector-setup-progress";
import type {
  IntegrationConnectionStatus,
  ManagedConnectorDefinition,
} from "@/src/types/integrations-hub";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

const baseSlackConnector: ManagedConnectorDefinition = {
  slug: "slack",
  name: "Slack",
  description: "Slack hosted MCP connector",
  categories: ["Communication"],
  authModes: ["oauth2"],
  authStrategy: "oauth2",
  provider: "mcp",
  oauthConfigured: true,
  oauthClientStatus: "decryptable",
  credentialLabel: "Connect Slack",
  credentialPlaceholder: "Connect Slack",
  credentialHelp: "Connect Slack with OAuth.",
  serverUrl: "https://mcp.slack.com/mcp",
  oauthConfig: {
    authorizationUrl: "https://slack.com/oauth/v2_user/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.user.access",
    scopes: [],
  },
  tools: [],
  enabled: true,
  createdAt: "2026-03-09T00:00:00.000Z",
  updatedAt: "2026-03-09T00:00:00.000Z",
};

const slackConnection: IntegrationConnectionStatus = {
  integrationKey: "slack",
  provider: "mcp",
  authStrategy: "oauth2",
  scopes: [],
  externalAccountId: "U12345",
  displayName: "Admin Workspace",
  metadata: {},
  createdAt: "2026-03-09T00:00:00.000Z",
  updatedAt: "2026-03-09T00:00:00.000Z",
};

describe("ConnectorSetupProgress", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  const render = (element: React.ReactElement) =>
    act(async () => {
      root.render(element);
    });

  it("gates the Index tools button for an OAuth2 MCP connector without a connection", async () => {
    const onIndex = vi.fn();
    await render(
      <ConnectorSetupProgress
        connector={baseSlackConnector}
        connection={null}
        indexing={false}
        onIndex={onIndex}
      />,
    );

    const indexButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Index Slack tools"]',
    );
    expect(indexButton).toBeTruthy();
    expect(indexButton?.disabled).toBe(true);
    expect(container.textContent).toContain(
      "Connect your own account above first",
    );
  });

  it("enables the Index tools button once the admin has connected their account", async () => {
    const onIndex = vi.fn();
    await render(
      <ConnectorSetupProgress
        connector={baseSlackConnector}
        connection={slackConnection}
        indexing={false}
        onIndex={onIndex}
      />,
    );

    const indexButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Index Slack tools"]',
    );
    expect(indexButton).toBeTruthy();
    expect(indexButton?.disabled).toBe(false);

    await act(async () => {
      indexButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onIndex).toHaveBeenCalledTimes(1);
  });

  it("marks all steps complete and shows the ready banner after indexing tools", async () => {
    await render(
      <ConnectorSetupProgress
        connector={{
          ...baseSlackConnector,
          tools: [
            {
              name: "search_messages",
              description: "Search messages",
              defaultScopes: [],
              accessMode: "enabled",
              config: {},
            },
          ],
        }}
        connection={slackConnection}
        indexing={false}
        onIndex={() => {}}
      />,
    );

    const completedSteps = container.querySelectorAll(
      '[data-setup-step-completed="true"]',
    );
    expect(completedSteps.length).toBe(4);
    expect(container.textContent).toContain("ready for users");
  });

  it("renders a Connect CTA that initiates an authenticated OAuth start", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ redirectUrl: "https://slack.com/oauth/authorize" }), {
          headers: { "content-type": "application/json" },
        }),
      );

    await render(
      <ConnectorSetupProgress
        connector={baseSlackConnector}
        connection={null}
        indexing={false}
        onIndex={() => {}}
      />,
    );

    const connectButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((b) => b.textContent?.includes("Connect Slack"));
    expect(connectButton).toBeTruthy();

    await act(async () => {
      connectButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/api/oauth/slack/start");
    expect(String(url)).toContain("admin-integrations");
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");

    fetchMock.mockRestore();
  });
});
