// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { wizardRenderMock } = vi.hoisted(() => ({
  wizardRenderMock: vi.fn(),
}));

vi.mock("@/src/components/integrations/wizard/wizard", () => ({
  IntegrationWizard: (props: { redirectSection: string }) => {
    wizardRenderMock(props.redirectSection);
    return <div data-testid="integration-wizard">Step-by-step integration setup</div>;
  },
}));

import { IntegrationsSection } from "@/src/components/dashboard/sections/integrations-section";
import type {
  ManagedConnectorOption,
  IntegrationSpec,
} from "@/src/types/context-layer";
import type { FilteredIntegrationToolEntry } from "@/src/components/dashboard/utils";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const setInputValue = (
  element: HTMLInputElement | HTMLSelectElement | null,
  value: string,
) => {
  if (!element) {
    throw new Error("Expected input element");
  }

  const prototype =
    element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

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
  config: { builtInSlug: "github" },
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

const createDefaultProps = () => ({
  addIntegrationSearch: "",
  availableConnectorCount: 3,
  managedConnectorsError: null,
  managedConnectorsPending: false,
  filteredIntegrations: [buildEntry()],
  handleDeleteIntegration: vi.fn(),
  handleDisableUnusedTools: vi.fn(),
  hideDisabledTools: true,
  integrationCount: 1,
  integrationSearch: "github",
  isActionPending: false,
  isBulkDisablePending: false,
  marketplaceConnectors: connectors,
  onCreated: vi.fn(async () => undefined),
  onOpenIntegrationWizard: vi.fn(),
  onStatus: vi.fn(),
  onToggleIntegrationExpanded: vi.fn(),
  onToggleToolExpanded: vi.fn(),
  onToggleIntegrationEnabled: vi.fn(),
  onUpdateToolAccessMode: vi.fn(),
  onUnusedThresholdBlur: vi.fn(),
  onUnusedThresholdUnitChange: vi.fn(),
  onUnusedThresholdValueChange: vi.fn(),
  resolveIntegrationLogoUrl: vi.fn(() => "https://github.com/favicon.ico"),
  setAddIntegrationSearch: vi.fn(),
  setHideDisabledTools: vi.fn(),
  setIntegrationSearch: vi.fn(),
  showIntegrationWizard: false,
  unusedCutoffDateLabel: "4/1/2026",
  unusedToolCandidateCount: 1,
  unusedThresholdUnit: "days" as const,
  unusedThresholdValue: "30",
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
    expect(wizardRenderMock).toHaveBeenCalledWith("integrations");
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
    expect(props.onUnusedThresholdValueChange).toHaveBeenCalledWith("60");
    expect(props.onUnusedThresholdBlur).toHaveBeenCalled();
    expect(props.onUnusedThresholdUnitChange).toHaveBeenCalledWith("weeks");
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

    await act(async () => {
      root.render(
        <IntegrationsSection
          {...props}
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
          unusedToolCandidateCount={2}
        />,
      );
    });

    expect(container.textContent).toContain("No tools registered yet.");
    expect(container.textContent).toContain("No visible tools match the current filters.");
    expect(container.textContent).toContain("2 tools matched");
  });
});
