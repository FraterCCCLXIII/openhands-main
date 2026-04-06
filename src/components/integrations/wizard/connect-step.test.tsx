// @vitest-environment jsdom

import { act, useState, type SetStateAction } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectStep } from "@/src/components/integrations/wizard/connect-step";
import type {
  ManagedConnectorOption,
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

const baseManagedDraft: WizardDraft = {
  kind: "managed",
  key: "",
  name: "",
  managedConnectorSlug: "",
  serverUrl: "",
  accessToken: "",
  apiKey: "",
  headerName: "",
  username: "",
  password: "",
};

const notionConnector: ManagedConnectorOption = {
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

const elevenLabsConnector: ManagedConnectorOption = {
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

type RenderOptions = {
  draft?: WizardDraft;
  selectedConnector?: ManagedConnectorOption | null;
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
  const initialDraft = options.draft ?? baseManagedDraft;

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
          managedConnectors={[notionConnector, elevenLabsConnector]}
          managedConnectorsPending={false}
          canDiscover={options.canDiscover ?? true}
          connectorSearch=""
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

  it("starts the per-user OAuth flow for managed connectors", async () => {
    const { container, cleanup } = await renderConnectStep({
      draft: {
        ...baseManagedDraft,
        key: "notion-workspace",
        name: "Notion Workspace",
        managedConnectorSlug: "notion",
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
      "/api/oauth/notion/start?integrationKey=notion-workspace&redirectTo=%2Fintegrations%3FshowIntegrationWizard%3D1%26managedConnector%3Dnotion",
    );

    await cleanup();
  });

  it("renders API-key connector guidance and updates the draft state", async () => {
    const { container, cleanup } = await renderConnectStep({
      draft: {
        ...baseManagedDraft,
        key: "elevenlabs",
        name: "ElevenLabs",
        managedConnectorSlug: "elevenlabs",
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
        ...baseManagedDraft,
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
