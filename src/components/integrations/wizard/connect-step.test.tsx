// @vitest-environment jsdom

import { act, useState, type SetStateAction } from "react";
import { createRoot, type Root } from "react-dom/client";
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

const customTokenConnector = {
  slug: "custom-token",
  name: "Custom Token",
  description: "",
  toolCount: 2,
  categories: ["Operations"],
  authModes: ["api_key"],
  authStrategy: "api_key",
  oauthConfigured: true,
} as BuiltInConnectorOption;


type RenderOptions = {
  builtInConnectors?: BuiltInConnectorOption[];
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
          builtInConnectors={options.builtInConnectors ?? [notionConnector, elevenLabsConnector]}
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

  it("renders searchable built-in connector options and forwards search changes", async () => {
    const pendingRender = await renderConnectStep({ builtInConnectorsPending: true });
    const pendingSearchInput = pendingRender.container.querySelector(
      'input[list="built-in-connector-options"]',
    ) as HTMLInputElement | null;

    expect(pendingSearchInput?.placeholder).toBe("Loading supported connectors...");
    expect(pendingSearchInput?.disabled).toBe(true);
    await pendingRender.cleanup();

    const { container, cleanup, onConnectorSearchChange } = await renderConnectStep({
      connectorSearch: "Not",
    });
    const searchInput = container.querySelector(
      'input[list="built-in-connector-options"]',
    ) as HTMLInputElement | null;
    const optionValues = Array.from(
      container.querySelectorAll('#built-in-connector-options option'),
    ).map((option) => (option as HTMLOptionElement).value);

    expect(searchInput?.placeholder).toBe("Choose GitHub, Notion, Slack...");
    expect(optionValues).toEqual(["Notion (notion)", "ElevenLabs (elevenlabs)"]);

    await act(async () => {
      setInputValue(searchInput, "Notion");
    });

    expect(onConnectorSearchChange).toHaveBeenCalledWith("Notion");
    expect(container.textContent).toContain("Click here.");

    await cleanup();
  });

  it("shows OAuth connection status copy and disables unavailable connection actions", async () => {
    const connected = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        key: "notion-workspace",
        name: "Notion Workspace",
        builtInSlug: "notion",
      },
      selectedConnector: { ...notionConnector, description: "" },
      selectedConnection: {
        integrationKey: "notion-workspace",
        provider: "http",
        authStrategy: "oauth2",
        scopes: [],
        displayName: "Acme Workspace",
        expiresAt: "2026-04-08T12:00:00.000Z",
        metadata: {},
        createdAt: "2026-04-07T12:00:00.000Z",
        updatedAt: "2026-04-07T12:00:00.000Z",
      },
      requiresOAuthConnection: true,
      oauthConnectionEnabled: true,
    });

    expect(connected.container.textContent).toContain(
      "This managed connector is registered for the current deployment.",
    );
    expect(connected.container.textContent).toContain("Acme Workspace");
    expect(connected.container.textContent).toContain(
      "This Notion token is stored per user in the database and will be injected automatically for agent calls.",
    );
    expect(connected.container.textContent).toContain(
      "Notion is connected. Click Discover to save this integration with your stored OAuth credentials.",
    );
    expect(connected.container.textContent).toContain("Reconnect");
    expect(connected.container.textContent).toContain("Expires");
    await connected.cleanup();

    const unavailable = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        builtInSlug: "notion",
      },
      selectedConnector: notionConnector,
      requiresOAuthConnection: true,
      oauthConnectionEnabled: false,
    });
    const unavailableButton = Array.from(
      unavailable.container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("Not available"));

    expect(unavailableButton).toBeTruthy();
    expect((unavailableButton as HTMLButtonElement | undefined)?.disabled).toBe(true);
    expect(unavailable.container.textContent).toContain(
      "Notion is not available on this deployment yet. Visit the admin integrations page to request it.",
    );
    expect(unavailable.container.textContent).toContain(
      "Notion is not available on this deployment yet. Visit /admin-integrations to request it.",
    );

    await unavailable.cleanup();
  });

  it("falls back to generic API-key copy and keeps fields disabled for whitespace-only selections", async () => {
    const disabled = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        builtInSlug: "   ",
      },
      selectedConnector: customTokenConnector,
    });
    const disabledApiInput = disabled.container.querySelector(
      'input[placeholder="Paste the provider API key"]',
    ) as HTMLInputElement | null;
    const disabledHeaderInput = disabled.container.querySelector(
      'input[placeholder="X-API-Key"]',
    ) as HTMLInputElement | null;

    expect(disabledApiInput?.disabled).toBe(true);
    expect(disabledHeaderInput?.disabled).toBe(true);
    await disabled.cleanup();

    const enabled = await renderConnectStep({
      draft: {
        ...baseBuiltInDraft,
        builtInSlug: "custom-token",
      },
      selectedConnector: customTokenConnector,
      builtInConnectors: [notionConnector, elevenLabsConnector, customTokenConnector],
      statefulDraft: true,
    });
    const apiInput = enabled.container.querySelector(
      'input[placeholder="Paste the provider API key"]',
    ) as HTMLInputElement | null;
    const headerInput = enabled.container.querySelector(
      'input[placeholder="X-API-Key"]',
    ) as HTMLInputElement | null;

    expect(enabled.container.textContent).toContain("API key");
    expect(enabled.container.textContent).toContain(
      "Provide the provider API key that this managed connector should use upstream.",
    );
    expect(apiInput?.disabled).toBe(false);
    expect(headerInput?.disabled).toBe(false);

    await act(async () => {
      setInputValue(apiInput, "token-123");
      setInputValue(headerInput, "X-Test-Key");
    });

    expect(enabled.container.querySelector("[data-draft-state]")?.textContent).toContain(
      '"apiKey":"token-123"',
    );
    expect(enabled.container.querySelector("[data-draft-state]")?.textContent).toContain(
      '"headerName":"X-Test-Key"',
    );

    await enabled.cleanup();
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
});
