// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useWizardState } from "@/src/components/integrations/wizard/use-wizard-state";
import {
  INITIAL_DRAFT,
  type DiscoveryResponse,
} from "@/src/components/integrations/wizard/utils";
import type { ManagedConnectorOption } from "@/src/types/context-layer";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const notionConnector: ManagedConnectorOption = {
  slug: "notion",
  name: "Notion",
  description: "Notion workspace",
  toolCount: 3,
  categories: ["Knowledge base"],
  authModes: ["oauth2"],
  authStrategy: "oauth2",
  oauthConfigured: false,
  credentialLabel: "Connect Notion",
  credentialPlaceholder: "Connect Notion",
  credentialHelp: "Connect your Notion account.",
};

const genericApiConnector: ManagedConnectorOption = {
  slug: "generic-api",
  name: "Generic API",
  description: "Manual API key connector",
  toolCount: 4,
  categories: ["Utilities"],
  authModes: ["api_key"],
  authStrategy: "api_key",
  oauthConfigured: true,
  credentialLabel: "API key",
  credentialPlaceholder: "Paste key",
  credentialHelp: "Provide an API key.",
};

const ordinalConnector: ManagedConnectorOption = {
  slug: "ordinal",
  name: "Ordinal",
  description: "Ordinal bearer connector",
  toolCount: 8,
  categories: ["Social"],
  authModes: ["bearer"],
  authStrategy: "bearer",
  oauthConfigured: true,
  credentialLabel: "Ordinal token",
  credentialPlaceholder: "Paste token",
  credentialHelp: "Provide an Ordinal token.",
};

const connectors: ManagedConnectorOption[] = [
  notionConnector,
  genericApiConnector,
  ordinalConnector,
];

const discoveryResult: DiscoveryResponse = {
  provider: "mcp",
  authStrategy: "bearer",
  config: {
    serverUrl: "https://example.com/mcp",
  },
  credentials: {
    accessToken: "secret-token",
  },
  tools: {
    betaTool: {
      name: "betaTool",
      description: "Disabled beta tool",
      enabled: false,
      fineGrainedPermissions: true,
      defaultScopes: ["beta:read"],
      executionMode: "provider",
      config: {},
    },
    alphaTool: {
      name: "alphaTool",
      description: "Alpha tool",
      enabled: true,
      accessMode: "approval_required",
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: {},
    },
  },
};

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

const renderWizardState = async (search = "") => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onStatus = vi.fn();
  let latestState: ReturnType<typeof useWizardState> | null = null;

  const Harness = () => {
    latestState = useWizardState({
      managedConnectors: connectors,
      onStatus,
      searchParams: new URLSearchParams(search),
    });

    return null;
  };

  await act(async () => {
    root.render(<Harness />);
  });

  mountedRoots.push({ container, root });

  return {
    onStatus,
    getState: () => {
      if (!latestState) {
        throw new Error("Wizard state was not initialized.");
      }

      return latestState;
    },
  };
};

afterEach(async () => {
  while (mountedRoots.length > 0) {
    const next = mountedRoots.pop();
    if (!next) {
      break;
    }

    await act(async () => {
      next.root.unmount();
    });
    next.container.remove();
  }
});

describe("useWizardState", () => {
  it("initializes from the managedConnector search param and handles connector search transitions", async () => {
    const { getState, onStatus } = await renderWizardState("managedConnector=notion");

    expect(getState().step).toBe(2);
    expect(getState().draft).toMatchObject({
      kind: "managed",
      managedConnectorSlug: "notion",
      key: "notion",
      name: "notion",
    });
    expect(getState().selectedConnector?.slug).toBe("notion");
    expect(getState().requiresOAuthConnection).toBe(true);
    expect(getState().oauthConnectionEnabled).toBe(false);

    onStatus.mockClear();

    await act(async () => {
      getState().setDraft((current) => ({
        ...current,
        managedConnectorSlug: "generic-api",
        apiKey: "keep-me",
        headerName: "X-Custom-Key",
      }));
    });

    await act(async () => {
      getState().handleConnectorSelect(genericApiConnector);
    });

    expect(getState().draft).toMatchObject({
      managedConnectorSlug: "generic-api",
      key: "generic-api",
      name: "Generic API",
      apiKey: "keep-me",
      headerName: "X-Custom-Key",
    });
    expect(getState().connectorSearch).toBe("Generic API (generic-api)");
    expect(getState().requiresOAuthConnection).toBe(false);
    expect(getState().oauthConnectionEnabled).toBe(true);
    expect(onStatus).toHaveBeenLastCalledWith(null);

    await act(async () => {
      getState().setDraft((current) => ({
        ...current,
        managedConnectorSlug: "ordinal",
        accessToken: "ordinal-secret",
      }));
    });

    await act(async () => {
      getState().handleConnectorSelect(ordinalConnector);
    });

    expect(getState().draft.accessToken).toBe("ordinal-secret");

    await act(async () => {
      getState().setDiscoverFeedback({
        tone: "info",
        message: "Pending discovery",
      });
    });

    await act(async () => {
      getState().handleConnectorSearchChange("missing connector");
    });

    expect(getState().connectorSearch).toBe("missing connector");
    expect(getState().selectedConnector).toBeNull();
    expect(getState().discoverFeedback).toBeNull();
    expect(getState().draft).toMatchObject({
      managedConnectorSlug: "",
      accessToken: "",
      apiKey: "",
      username: "",
      password: "",
      headerName: INITIAL_DRAFT.headerName,
    });
    expect(onStatus).toHaveBeenLastCalledWith(null);

    await act(async () => {
      getState().handleConnectorSearchChange("generic api (GENERIC-API)");
    });

    expect(getState().selectedConnector?.slug).toBe("generic-api");
    expect(getState().connectorSearch).toBe("Generic API (generic-api)");
    expect(getState().draft).toMatchObject({
      managedConnectorSlug: "generic-api",
      key: "generic-api",
      name: "Generic API",
      apiKey: "",
      headerName: INITIAL_DRAFT.headerName,
    });
  });

  it("ignores the legacy builtIn search param", async () => {
    const { getState } = await renderWizardState("builtIn=notion");

    expect(getState().step).toBe(1);
    expect(getState().selectedConnector).toBeNull();
    expect(getState().draft).toEqual(INITIAL_DRAFT);
  });

  it("tracks review filtering, bulk selection, expansion, and reset flows", async () => {
    const { getState, onStatus } = await renderWizardState();

    expect(getState().step).toBe(1);

    await act(async () => {
      getState().selectKind("mcp");
    });

    expect(getState().step).toBe(2);
    expect(getState().draft).toEqual({ ...INITIAL_DRAFT, kind: "mcp" });
    expect(onStatus).toHaveBeenLastCalledWith(null);

    await act(async () => {
      getState().setSelectedTools({ stale: true });
      getState().toggleToolExpanded("stale");
      getState().setToolSearch("stale");
      getState().setDiscoverFeedback({ tone: "info", message: "Loading" });
    });

    await act(async () => {
      getState().applyDiscoveryResult(discoveryResult);
    });

    expect(getState().step).toBe(3);
    expect(getState().reviewedTools.map(([name]) => name)).toEqual([
      "alphaTool",
      "betaTool",
    ]);
    expect(getState().toolModes).toEqual({
      alphaTool: "approval_required",
      betaTool: "disabled",
    });
    expect(getState().selectedTools).toEqual({});
    expect(getState().expandedTools).toEqual({});
    expect(getState().toolSearch).toBe("");

    await act(async () => {
      getState().setToolSearch("alpha");
    });

    expect(getState().filteredReviewedTools.map(([name]) => name)).toEqual([
      "alphaTool",
    ]);
    expect(getState().matchingToolNames).toEqual(["alphaTool"]);
    expect(getState().hasMatchingTools).toBe(true);
    expect(getState().selectedMatchingCount).toBe(0);
    expect(getState().allMatchingSelected).toBe(false);

    const beforeModes = { ...getState().toolModes };
    const beforeSelection = { ...getState().selectedTools };

    await act(async () => {
      getState().setAccessModeForTools([], "enabled");
      getState().setSelectedStateForTools([], true);
    });

    expect(getState().toolModes).toEqual(beforeModes);
    expect(getState().selectedTools).toEqual(beforeSelection);

    await act(async () => {
      getState().setSelectedStateForTools(["alphaTool"], true);
    });

    expect(getState().selectedToolNames).toEqual(["alphaTool"]);
    expect(getState().selectedToolCount).toBe(1);
    expect(getState().selectedMatchingCount).toBe(1);
    expect(getState().allMatchingSelected).toBe(true);

    await act(async () => {
      getState().setAccessModeForTools(["alphaTool"], "enabled");
    });

    expect(getState().toolModes.alphaTool).toBe("enabled");
    expect(getState().selectedTools).toEqual({});

    await act(async () => {
      getState().toggleToolExpanded("betaTool");
    });

    expect(getState().expandedTools.betaTool).toBe(true);

    await act(async () => {
      getState().toggleToolExpanded("betaTool");
    });

    expect(getState().expandedTools.betaTool).toBe(false);

    await act(async () => {
      getState().setToolSearch("does-not-match");
    });

    expect(getState().filteredReviewedTools).toEqual([]);
    expect(getState().hasMatchingTools).toBe(false);
    expect(getState().matchingToolNames).toEqual([]);

    await act(async () => {
      getState().resetAfterCreate();
    });

    expect(getState().step).toBe(1);
    expect(getState().draft).toEqual(INITIAL_DRAFT);
    expect(getState().discovery).toBeNull();
    expect(getState().toolModes).toEqual({});
    expect(getState().selectedTools).toEqual({});
    expect(getState().expandedTools).toEqual({});
    expect(getState().connectorSearch).toBe("");
    expect(getState().toolSearch).toBe("");
    expect(getState().discoverFeedback).toBeNull();
  });
});
