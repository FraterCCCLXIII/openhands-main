// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IntegrationDetailModal } from "@/src/components/integrations/integration-detail-modal";
import {
  getIntegrationEnableRowTestId,
  getIntegrationEnableToggleTestId,
} from "@/src/components/integrations/integration-enable-row";
import type { FilteredIntegrationToolEntry } from "@/src/components/dashboard/utils";
import type { IntegrationSpec, ToolSpec } from "@/src/types/integrations-hub";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

const createPullRequestTool: ToolSpec = {
  name: "create_pull_request",
  description: "Open a pull request",
  enabled: true,
  accessMode: "enabled",
  fineGrainedPermissions: true,
  defaultScopes: ["repo"],
  executionMode: "provider",
  config: {},
};

const baseIntegration: IntegrationSpec = {
  key: "github",
  name: "GitHub",
  provider: "mock",
  kind: "api",
  authStrategy: "bearer",
  enabled: false,
  fineGrainedPermissions: true,
  tools: {
    create_pull_request: createPullRequestTool,
  },
  config: {},
  credentials: {},
};

const baseEntry: FilteredIntegrationToolEntry = {
  integration: baseIntegration,
  tools: [createPullRequestTool],
  visibleTools: [createPullRequestTool],
};

describe("IntegrationDetailModal integration enable row", () => {
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
    document.body.replaceChildren();
  });

  it("renders the integration enable row below the header", async () => {
    await act(async () => {
      root.render(
        <IntegrationDetailModal
          entry={baseEntry}
          logoUrl={null}
          isActionPending={false}
          expandedTools={{}}
          onClose={vi.fn()}
          onDelete={vi.fn()}
          onToggleIntegrationEnabled={vi.fn()}
          onToggleToolExpanded={vi.fn()}
          onUpdateToolAccessMode={vi.fn()}
        />,
      );
    });

    const enableRow = document.body.querySelector(
      `[data-testid="${getIntegrationEnableRowTestId("github")}"]`,
    );
    const header = document.body.querySelector(
      '[data-testid="integration-detail-modal-name-github"]',
    );
    const toolsPanel = document.body.querySelector(
      '[data-tool-name="create_pull_request"]',
    );

    expect(enableRow).toBeTruthy();
    expect(header).toBeTruthy();
    expect(toolsPanel).toBeTruthy();
    if (!enableRow || !header || !toolsPanel) {
      throw new Error("Expected modal elements to render");
    }
    expect(
      header.compareDocumentPosition(enableRow) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      enableRow.compareDocumentPosition(toolsPanel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const toggle = document.body.querySelector(
      `[data-testid="${getIntegrationEnableToggleTestId("github")}"]`,
    ) as HTMLInputElement | null;
    expect(toggle?.checked).toBe(false);
  });

  it("calls onToggleIntegrationEnabled when the integration toggle changes", async () => {
    const onToggleIntegrationEnabled = vi.fn();

    await act(async () => {
      root.render(
        <IntegrationDetailModal
          entry={baseEntry}
          logoUrl={null}
          isActionPending={false}
          expandedTools={{}}
          onClose={vi.fn()}
          onDelete={vi.fn()}
          onToggleIntegrationEnabled={onToggleIntegrationEnabled}
          onToggleToolExpanded={vi.fn()}
          onUpdateToolAccessMode={vi.fn()}
        />,
      );
    });

    const toggle = document.body.querySelector(
      `[data-testid="${getIntegrationEnableToggleTestId("github")}"]`,
    ) as HTMLInputElement | null;

    await act(async () => {
      toggle?.click();
    });

    expect(onToggleIntegrationEnabled).toHaveBeenCalledWith(baseIntegration);
  });
});
