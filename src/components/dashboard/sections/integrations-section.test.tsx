// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { wizardRenderMock } = vi.hoisted(() => ({
  wizardRenderMock: vi.fn(),
}));

vi.mock("@/src/components/integrations/wizard/wizard", () => ({
  IntegrationWizard: (props: { existingIntegrationKeys?: Set<string>; redirectSection: string }) => {
    wizardRenderMock(props.redirectSection, props.existingIntegrationKeys);
    return <div data-testid="integration-wizard">Step-by-step integration setup</div>;
  },
}));

import { IntegrationsSection } from "@/src/components/dashboard/sections/integrations-section";
import type {
  ManagedConnectorOption,
  IntegrationSpec,
} from "@/src/types/integrations-hub";
import type { FilteredIntegrationToolEntry } from "@/src/components/dashboard/utils";

import { enableReactActEnvironment, setInputValue } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();


const connectors: ManagedConnectorOption[] = [
  {
    slug: "github",
    name: "GitHub",
    description: "Source control and pull requests.",
    appUrl: "https://github.com",
    toolCount: 12,
    categories: ["Engineering"],
    authModes: ["bearer"],
    authStrategy: "bearer",
    credentialLabel: "Token",
    credentialPlaceholder: "Paste token",
    credentialHelp: "Use a GitHub token.",
  },
];

const baseIntegration: IntegrationSpec = {
  key: "github",
  name: "GitHub",
  provider: "mcp",
  kind: "mcp",
  authStrategy: "bearer",
  enabled: false,
  fineGrainedPermissions: true,
  config: { managedConnectorSlug: "github" },
  credentials: {},
  tools: {
    delete_repo: {
      name: "delete_repo",
      description: "",
      enabled: false,
      accessMode: "disabled",
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: {},
    },
  },
};

const buildEntry = (
  overrides?: Partial<FilteredIntegrationToolEntry>,
): FilteredIntegrationToolEntry => ({
  integration: baseIntegration,
  tools: Object.values(baseIntegration.tools),
  visibleTools: Object.values(baseIntegration.tools),
  ...overrides,
});

const oldInvocationDate = "2020-01-01T00:00:00.000Z";

const trackedIntegration: IntegrationSpec = {
  ...baseIntegration,
  enabled: true,
  tools: {
    delete_repo: {
      ...baseIntegration.tools.delete_repo!,
      enabled: true,
      accessMode: "enabled",
      lastInvokedAt: oldInvocationDate,
    },
  },
};

const createDefaultProps = () => ({
  addIntegrationSearch: "",
  availableConnectorCount: 3,
  connectedConnectorCount: 1,
  integrations: [trackedIntegration],
  managedConnectorsError: null,
  managedConnectorsPending: false,
  filteredIntegrations: [buildEntry()],
  handleDeleteIntegration: vi.fn(),
  handleDisableUnusedTools: vi.fn(),
  hideDisabledTools: true,
  existingIntegrationKeys: new Set(["github"]),

  integrationCount: 1,
  integrationSearch: "github",
  isActionPending: false,
  isAdmin: true,
  isBulkDisablePending: false,
  marketplaceConnectors: connectors,
  onCreated: vi.fn(async () => undefined),
  onOpenIntegrationWizard: vi.fn(),
  onStatus: vi.fn(),
  onToggleIntegrationExpanded: vi.fn(),
  onToggleToolExpanded: vi.fn(),
  onToggleIntegrationEnabled: vi.fn(),
  onUpdateToolAccessMode: vi.fn(),
  resolveIntegrationLogoMetadata: vi.fn(() => ({ logoUrl: null })),
  setAddIntegrationSearch: vi.fn(),
  setHideDisabledTools: vi.fn(),
  setIntegrationSearch: vi.fn(),
  showIntegrationWizard: false,
  expandedTools: { "github:delete_repo": true },
  expandedIntegrations: {},
  visibleToolCount: 1,
});

describe("IntegrationsSection", () => {
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
    wizardRenderMock.mockReset();
    vi.restoreAllMocks();
  });

  it("renders the wizard, marketplace states, and search interactions", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(<IntegrationsSection {...props} showIntegrationWizard managedConnectorsPending />);
    });

    expect(container.textContent).toContain("Step-by-step integration setup");
    expect(wizardRenderMock).toHaveBeenCalledWith(
      "integrations",
      props.existingIntegrationKeys,
    );
    expect(container.textContent).toContain("Loading available integrations...");

    await act(async () => {
      root.render(
        <IntegrationsSection
          {...props}
          showIntegrationWizard={false}
          managedConnectorsPending={false}
          managedConnectorsError="Unable to load connectors"
        />,
      );
    });
    expect(container.textContent).toContain("Unable to load connectors");

    await act(async () => {
      root.render(
        <IntegrationsSection
          {...props}
          managedConnectorsError={null}
          marketplaceConnectors={[]}
        />,
      );
    });
    expect(container.textContent).toContain("No popular integrations match the current search.");

    await act(async () => {
      root.render(<IntegrationsSection {...props} />);
    });

    const addSearchInput = container.querySelector(
      'input[aria-label="Search integrations"]',
    ) as HTMLInputElement | null;
    expect(addSearchInput).toBeTruthy();

    await act(async () => {
      setInputValue(addSearchInput, "git");
    });
    expect(props.setAddIntegrationSearch).toHaveBeenCalledWith("git");

    const marketplaceCard = container.querySelector(
      '[data-managed-connector-slug="github"]',
    ) as HTMLButtonElement | null;
    expect(marketplaceCard).toBeTruthy();

    await act(async () => {
      marketplaceCard?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(props.onOpenIntegrationWizard).toHaveBeenCalledWith("github");
  });

  it("shows five marketplace connectors initially and loads more on demand", async () => {
    const marketplaceConnectors = Array.from({ length: 7 }, (_, index) => ({
      ...connectors[0]!,
      slug: `connector-${index + 1}`,
      name: `Connector ${index + 1}`,
    }));
    const props = createDefaultProps();

    await act(async () => {
      root.render(
        <IntegrationsSection
          {...props}
          availableConnectorCount={marketplaceConnectors.length}
          marketplaceConnectors={marketplaceConnectors}
        />,
      );
    });

    expect(container.textContent).toContain("5 shown");
    expect(container.textContent).toContain("7 available");
    expect(container.querySelector('[data-managed-connector-slug="connector-5"]')).toBeTruthy();
    expect(container.querySelector('[data-managed-connector-slug="connector-6"]')).toBeNull();

    const loadMoreButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Load more integrations"),
    );
    expect(loadMoreButton).toBeTruthy();

    await act(async () => {
      loadMoreButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("7 shown");
    expect(container.querySelector('[data-managed-connector-slug="connector-6"]')).toBeTruthy();
    expect(container.textContent).not.toContain("Load more integrations");
  });

  it("renders the empty installed state when the user has no integrations", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(
        <IntegrationsSection
          {...props}
          integrationCount={0}
          filteredIntegrations={[]}
          visibleToolCount={0}
        />,
      );
    });

    expect(container.textContent).toContain(
      "No integrations activated yet. Use the section above to connect your first one.",
    );
  });

  it("renders expanded integrations, tool fallbacks, and forwards action callbacks", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(<IntegrationsSection {...props} />);
    });

    expect(container.textContent).toContain("1 tool matched");
    expect(container.textContent).toContain("No description provided.");
    expect(container.textContent).toContain("Default scopes: none");
    expect(container.textContent).toContain("github · auth: bearer · 1 visible tool of 1");

    const integrationSearchInput = container.querySelector(
      'input[aria-label="Search integrations and tools"]',
    ) as HTMLInputElement | null;
    const hideDisabledInput = container.querySelector(
      'input[aria-label="Hide disabled tools"]',
    ) as HTMLInputElement | null;
    const enableButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Enable"),
    );
    const deleteButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Delete"),
    );
    const hideToolsButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Hide tools"),
    );
    const hideDetailsButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Hide details"),
    );
    const caseByCaseButton = container.querySelector(
      'button[aria-label="Case-by-case access for delete_repo"]',
    ) as HTMLButtonElement | null;
    const unusedThresholdValueInput = container.querySelector(
      'input[aria-label="Unused threshold value"]',
    ) as HTMLInputElement | null;
    const unusedThresholdUnitInput = container.querySelector(
      'select[aria-label="Unused threshold unit"]',
    ) as HTMLSelectElement | null;
    const disableUnusedButton = container.querySelector(
      'button[aria-label="Disable unused tools"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      setInputValue(integrationSearchInput, "delete");
      hideDisabledInput?.click();
      hideToolsButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      hideDetailsButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      enableButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      caseByCaseButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      unusedThresholdValueInput?.focus();
      setInputValue(unusedThresholdValueInput, "60");
      unusedThresholdValueInput?.blur();
      setInputValue(unusedThresholdUnitInput, "weeks");
      disableUnusedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(props.setIntegrationSearch).toHaveBeenCalledWith("delete");
    expect(props.setHideDisabledTools).toHaveBeenCalledWith(false);
    expect(props.onToggleIntegrationExpanded).toHaveBeenCalledWith("github", true);
    expect(props.onToggleToolExpanded).toHaveBeenCalledWith("github:delete_repo");
    expect(props.onToggleIntegrationEnabled).toHaveBeenCalledWith(baseIntegration);
    expect(props.handleDeleteIntegration).toHaveBeenCalledWith(baseIntegration);
    expect(props.onUpdateToolAccessMode).toHaveBeenCalledWith(
      "github",
      "delete_repo",
      "approval_required",
    );
    // BulkDisablePanel manages threshold state locally; the Disable button
    // calls handleDisableUnusedTools with the current threshold value + unit.
    expect(props.handleDisableUnusedTools).toHaveBeenCalled();
  });

  it("shows integration-level empty and filtered tool states", async () => {
    const props = createDefaultProps();
    const noToolsIntegration: IntegrationSpec = {
      ...baseIntegration,
      key: "empty-tools",
      name: "Empty Tools",
      tools: {},
    };
    const hiddenToolsIntegration: IntegrationSpec = {
      ...baseIntegration,
      key: "hidden-tools",
      name: "Hidden Tools",
      tools: baseIntegration.tools,
    };
    // Provide integrations with tracked tools that have old lastInvokedAt
    // dates so BulkDisablePanel reports "2 tools matched".
    const oldDate = "2020-01-01T00:00:00.000Z";
    const trackedIntegrations: IntegrationSpec[] = [
      {
        ...noToolsIntegration,
        enabled: true,
        tools: {
          stale_tool_a: {
            name: "stale_tool_a",
            description: "",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
            lastInvokedAt: oldDate,
          },
        },
      },
      {
        ...hiddenToolsIntegration,
        enabled: true,
        tools: {
          stale_tool_b: {
            name: "stale_tool_b",
            description: "",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
            lastInvokedAt: oldDate,
          },
        },
      },
    ];

    await act(async () => {
      root.render(
        <IntegrationsSection
          {...props}
          integrations={trackedIntegrations}
          integrationSearch=""
          expandedIntegrations={{ "empty-tools": true, "hidden-tools": true }}
          filteredIntegrations={[
            {
              integration: noToolsIntegration,
              tools: [],
              visibleTools: [],
            },
            {
              integration: hiddenToolsIntegration,
              tools: Object.values(hiddenToolsIntegration.tools),
              visibleTools: [],
            },
          ]}
          visibleToolCount={0}
        />,
      );
    });

    expect(container.textContent).toContain("No tools registered yet.");
    expect(container.textContent).toContain("No visible tools match the current filters.");
    expect(container.textContent).toContain("2 tools matched");
  });
});
