// @vitest-environment jsdom

import { act, useState, type SetStateAction } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectStep } from "@/src/components/integrations/wizard/connect-step";
import type {
  BuiltInConnectorOption,
  IntegrationConnectionStatus,
} from "@/src/types/context-layer";
import type { DiscoverFeedback, WizardDraft } from "@/src/components/integrations/wizard/utils";
import type { AdminSection } from "@/src/lib/admin-routes";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const setInputValue = (element: HTMLInputElement | null, value: string) => {
  if (!element) {
    throw new Error("Expected input element");
  }

  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

const baseBuiltInDraft: WizardDraft = {
  kind: "built_in",
  key: "",
  name: "",
  builtInSlug: "",
  serverUrl: "",
  accessToken: "",
  apiKey: "",
  headerName: "",
  username: "",
  password: "",
};

const notionConnector: BuiltInConnectorOption = {
  slug: "notion",
  name: "Notion",
  description: "Notion docs connector",
  toolCount: 12,
  categories: ["Knowledge base"],
  authModes: ["oauth2"],
  authStrategy: "oauth2",
  oauthConfigured: true,
  credentialLabel: "Connect Notion",
  credentialPlaceholder: "Connect Notion",
  credentialHelp: "Connect your Notion workspace.",
  appUrl: "https://www.notion.so",
};

const elevenLabsConnector: BuiltInConnectorOption = {
  slug: "elevenlabs",
  name: "ElevenLabs",
  description: "Voice generation connector",
  toolCount: 8,
  categories: ["Audio"],
  authModes: ["api_key"],
  authStrategy: "api_key",
  oauthConfigured: true,
  credentialLabel: "ElevenLabs API key",
  credentialPlaceholder: "Paste your ElevenLabs API key",
  credentialHelp: "Personal or workspace ElevenLabs API key.",
  apiKeyHeaderName: "xi-api-key",
};

const genericApiConnector: BuiltInConnectorOption = {
  slug: "generic-api",
  name: "Generic API",
  description: "Connector with a configurable header name",
  toolCount: 5,
  categories: ["Utilities"],
  authModes: ["api_key"],
  authStrategy: "api_key",
  oauthConfigured: true,
  credentialLabel: "Generic API key",
  credentialPlaceholder: "Paste the provider key",
  credentialHelp: "Provide a custom API key for this connector.",
};

const basicConnector: BuiltInConnectorOption = {
  slug: "basic-auth",
  name: "Basic Auth Service",
  description: "Connector that uses username and password",
  toolCount: 2,
  categories: ["Utilities"],
  authModes: ["basic"],
  authStrategy: "basic",
  oauthConfigured: true,
  credentialLabel: "Basic auth",
  credentialPlaceholder: "demo",
  credentialHelp: "Provide a username and password.",
};

const noAuthConnector: BuiltInConnectorOption = {
  slug: "public-feed",
  name: "Public Feed",
  description: "Connector that requires no provider credentials",
  toolCount: 1,
  categories: ["Feeds"],
  authModes: ["none"],
  authStrategy: "none",
  oauthConfigured: true,
  credentialLabel: "No credentials required",
  credentialPlaceholder: "",
  credentialHelp: "No credentials are required.",
};

type RenderOptions = {
  builtInConnectors?: BuiltInConnectorOption[];
  builtInConnectorsError?: string | null;
  builtInConnectorsPending?: boolean;
  connectorSearch?: string;
  draft?: WizardDraft;
  selectedConnector?: BuiltInConnectorOption | null;
  selectedConnection?: IntegrationConnectionStatus | null;
  requiresOAuthConnection?: boolean;
  oauthConnectionEnabled?: boolean;
  discoverFeedback?: DiscoverFeedback | null;
  canDiscover?: boolean;
  discoverPending?: boolean;
  redirectSection?: AdminSection;
  statefulDraft?: boolean;
};

const renderConnectStep = async (options: RenderOptions = {}) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const setDraft = vi.fn();
  const onBack = vi.fn();
  const onConnectorSearchChange = vi.fn();
  const onDiscover = vi.fn();
  const initialDraft = options.draft ?? baseBuiltInDraft;
  const builtInConnectors =
    options.builtInConnectors ??
    [
      notionConnector,
      elevenLabsConnector,
      genericApiConnector,
      basicConnector,
      noAuthConnector,
    ];

  const TestHarness = () => {
    const [draft, setHarnessDraft] = useState(initialDraft);
    const appliedSetDraft = options.statefulDraft
      ? setHarnessDraft
      : ((value: SetStateAction<WizardDraft>) => {
          setDraft(value);
        });

    return (
      <>
        <ConnectStep
          builtInConnectors={builtInConnectors}
          builtInConnectorsError={options.builtInConnectorsError ?? null}
          builtInConnectorsPending={options.builtInConnectorsPending ?? false}
          canDiscover={options.canDiscover ?? true}
          connectorSearch={options.connectorSearch ?? ""}
          discoverFeedback={options.discoverFeedback ?? null}
          discoverPending={options.discoverPending ?? false}
          draft={draft}
          oauthConnectionEnabled={options.oauthConnectionEnabled ?? false}
          redirectSection={options.redirectSection ?? "integrations"}
          requiresOAuthConnection={options.requiresOAuthConnection ?? false}
          selectedConnection={options.selectedConnection ?? null}
          selectedConnector={options.selectedConnector ?? null}
          setDraft={appliedSetDraft}
          onBack={onBack}
          onConnectorSearchChange={onConnectorSearchChange}
          onDiscover={onDiscover}
        />
        {options.statefulDraft ? (
          <pre data-draft-state>{JSON.stringify(draft)}</pre>
        ) : null}
      </>
    );
  };

  await act(async () => {
    root.render(<TestHarness />);
  });

  return {
    container,
    root,
    setDraft,
    onBack,
    onConnectorSearchChange,
    onDiscover,
    cleanup: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

describe("ConnectStep", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "https://example.test/current" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("starts the per-user OAuth flow for built-in connectors", async () => {
    const { container, cleanup } = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        key: "notion-workspace",
        name: "Notion Workspace",
        builtInSlug: "notion",
      },
      selectedConnector: notionConnector,
      requiresOAuthConnection: true,
      oauthConnectionEnabled: true,
      redirectSection: "integrations",
    });

    expect(container.textContent).toContain("Connect your Notion account");
    expect(container.textContent).toContain("Connect your Notion workspace.");

    const connectButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Connect"),
    );
    expect(connectButton).toBeTruthy();

    await act(async () => {
      connectButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(window.location.href).toBe(
      "/api/oauth/notion/start?integrationKey=notion-workspace&redirectTo=%2Fintegrations%3FshowIntegrationWizard%3D1%26builtIn%3Dnotion",
    );

    await cleanup();
  });

  it("renders API-key connector guidance and updates the draft state", async () => {
    const { container, cleanup } = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        key: "elevenlabs",
        name: "ElevenLabs",
        builtInSlug: "elevenlabs",
      },
      selectedConnector: elevenLabsConnector,
      statefulDraft: true,
    });

    expect(container.textContent).toContain("This connector sends your API key in the xi-api-key header.");
    expect(container.textContent).not.toContain("API key header name");

    await act(async () => {
      setInputValue(
        container.querySelector('input[placeholder="Paste your ElevenLabs API key"]'),
        "eleven-secret",
      );
    });

    expect(container.querySelector("[data-draft-state]")?.textContent).toContain(
      '"apiKey":"eleven-secret"',
    );

    await cleanup();
  });

  it("renders manual MCP fields, forwards navigation actions, and shows admin diagnostics", async () => {
    const { container, cleanup, onBack, onDiscover } = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        kind: "mcp",
        key: "figma-mcp",
        name: "Figma MCP",
      },
      discoverFeedback: {
        tone: "error",
        message: "Discovery failed.",
        debugDetails: {
          transport: "streamable_http",
          attempts: ["streamable_http", "sse"],
        },
      },
      statefulDraft: true,
    });

    expect(container.textContent).toContain("The dashboard connects to your MCP server and calls listTools.");
    expect(container.textContent).toContain("Admin diagnostics");
    expect(container.textContent).toContain("streamable_http");

    await act(async () => {
      setInputValue(
        container.querySelector('input[placeholder="https://example.com/mcp"]'),
        "https://figma.example/mcp",
      );
    });

    expect(container.querySelector("[data-draft-state]")?.textContent).toContain(
      '"serverUrl":"https://figma.example/mcp"',
    );

    const buttons = Array.from(container.querySelectorAll("button"));
    const backButton = buttons.find((button) => button.textContent?.includes("Back"));
    const discoverButton = buttons.find((button) => button.textContent?.includes("Discover tools"));

    await act(async () => {
      backButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      discoverButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onDiscover).toHaveBeenCalledTimes(1);

    await cleanup();
  });

  it("shows connected OAuth state, expiry details, and reconnects with the connector slug fallback", async () => {
    const { container, cleanup } = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        builtInSlug: "notion",
      },
      selectedConnector: notionConnector,
      selectedConnection: {
        integrationKey: "notion",
        provider: "notion",
        authStrategy: "oauth2",
        scopes: [],
        metadata: {},
        displayName: "Connected Notion workspace",
        createdAt: "2026-03-09T00:00:00.000Z",
        updatedAt: "2026-03-09T00:00:00.000Z",
        expiresAt: "2026-04-01T12:30:00.000Z",
      },
      requiresOAuthConnection: true,
      oauthConnectionEnabled: true,
      redirectSection: "profile",
    });

    expect(container.textContent).toContain("Connected Notion workspace");
    expect(container.textContent).toContain("Connected");
    expect(container.textContent).toContain("This Notion token is stored per user");
    expect(container.textContent).toContain("Expires ");

    const reconnectButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Reconnect"),
    );
    expect(reconnectButton).toBeTruthy();

    await act(async () => {
      reconnectButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(window.location.href).toBe(
      "/api/oauth/notion/start?integrationKey=notion&redirectTo=%2Fprofile%3FshowIntegrationWizard%3D1%26builtIn%3Dnotion",
    );

    await cleanup();
  });

  it("shows unavailable OAuth guidance, connector load errors, and disabled actions", async () => {
    const { container, cleanup } = await renderConnectStep({
      builtInConnectorsError: "Could not load managed connectors.",
      builtInConnectorsPending: true,
      canDiscover: false,
      connectorSearch: "Notion",
      draft: {
        ...baseBuiltInDraft,
        key: "notion",
        name: "Notion",
        builtInSlug: "notion",
      },
      selectedConnector: notionConnector,
      requiresOAuthConnection: true,
      oauthConnectionEnabled: false,
    });

    expect(container.textContent).toContain("Could not load managed connectors.");
    expect(container.textContent).toContain(
      "Notion is not available on this deployment yet. Visit the admin integrations page to request it.",
    );
    expect(container.textContent).toContain(
      "Notion is not available on this deployment yet. Visit /admin-integrations to request it.",
    );

    const connectorInput = container.querySelector(
      'input[list="built-in-connector-options"]',
    ) as HTMLInputElement | null;
    expect(connectorInput?.getAttribute("placeholder")).toBe(
      "Loading supported connectors...",
    );
    expect(connectorInput?.hasAttribute("disabled")).toBe(true);

    const notAvailableButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Not available"),
    );
    const discoverButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Discover tools"),
    );

    expect(notAvailableButton?.hasAttribute("disabled")).toBe(true);
    expect(discoverButton?.hasAttribute("disabled")).toBe(true);

    await cleanup();
  });

  it("renders configurable API-key header inputs for connectors without a predefined header", async () => {
    const { container, cleanup } = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        key: "generic-api",
        name: "Generic API",
        builtInSlug: "generic-api",
      },
      selectedConnector: genericApiConnector,
      statefulDraft: true,
    });

    expect(container.textContent).toContain("Provide a custom API key for this connector.");
    expect(container.textContent).toContain("API key header name");

    await act(async () => {
      setInputValue(
        container.querySelector('input[placeholder="Paste the provider key"]'),
        "generic-secret",
      );
      setInputValue(
        container.querySelector('input[placeholder="X-API-Key"]'),
        "X-Custom-Header",
      );
    });

    expect(container.querySelector("[data-draft-state]")?.textContent).toContain(
      '"apiKey":"generic-secret"',
    );
    expect(container.querySelector("[data-draft-state]")?.textContent).toContain(
      '"headerName":"X-Custom-Header"',
    );

    await cleanup();
  });

  it("renders basic-auth credential inputs and persists username/password updates", async () => {
    const { container, cleanup } = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        key: "basic-auth",
        name: "Basic Auth Service",
        builtInSlug: "basic-auth",
      },
      selectedConnector: basicConnector,
      statefulDraft: true,
    });

    expect(container.textContent).toContain("Provide a username and password.");

    await act(async () => {
      setInputValue(container.querySelector('input[placeholder="demo"]'), "alice");
      setInputValue(container.querySelector('input[placeholder="secret"]'), "wonderland");
    });

    expect(container.querySelector("[data-draft-state]")?.textContent).toContain(
      '"username":"alice"',
    );
    expect(container.querySelector("[data-draft-state]")?.textContent).toContain(
      '"password":"wonderland"',
    );

    await cleanup();
  });

  it("shows no-auth guidance without additional credential fields", async () => {
    const { container, cleanup } = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        key: "public-feed",
        name: "Public Feed",
        builtInSlug: "public-feed",
      },
      selectedConnector: noAuthConnector,
    });

    expect(container.textContent).toContain(
      "No provider credential is required for Public Feed. Click Discover to load the available tools.",
    );
    expect(container.textContent).not.toContain("Access token");
    expect(container.textContent).not.toContain("API key header name");

    await cleanup();
  });

});
