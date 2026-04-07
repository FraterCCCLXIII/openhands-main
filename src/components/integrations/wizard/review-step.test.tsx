// @vitest-environment jsdom

import { act, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReviewStep } from "@/src/components/integrations/wizard/review-step";
import type { DiscoveryResponse } from "@/src/components/integrations/wizard/utils";
import type { ToolSpec } from "@/src/types/context-layer";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const archiveTool: ToolSpec = {
  name: "archiveDatabase",
  description: "Archive a database",
  enabled: true,
  accessMode: "approval_required",
  fineGrainedPermissions: true,
  defaultScopes: ["databases:write"],
  executionMode: "provider",
  config: {},
};

const searchTool: ToolSpec = {
  name: "searchPages",
  description: "Search pages",
  enabled: true,
  accessMode: "enabled",
  fineGrainedPermissions: true,
  defaultScopes: ["pages:read"],
  executionMode: "provider",
  config: {},
};

const emptyTool: ToolSpec = {
  name: "emptyTool",
  enabled: false,
  fineGrainedPermissions: true,
  defaultScopes: [],
  executionMode: "provider",
  config: {},
};

const discovery: DiscoveryResponse = {
  provider: "mcp",
  authStrategy: "bearer",
  config: {
    serverUrl: "https://example.com/mcp",
  },
  credentials: {
    accessToken: "secret-token",
  },
  tools: {
    archiveDatabase: archiveTool,
    searchPages: searchTool,
    emptyTool,
  },
};

const mountedRoots: Array<{ container: HTMLDivElement; unmount: () => void }> = [];

type RenderOptions = Partial<ComponentProps<typeof ReviewStep>>;

const renderReviewStep = async (overrides: RenderOptions = {}) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let nextSelectionState: Record<string, boolean> | null = null;

  const onBack = vi.fn();
  const onCreate = vi.fn();
  const onToolSearchChange = vi.fn();
  const onSetAccessModeForTools = vi.fn();
  const onSetToolMode = vi.fn();
  const onSetSelectedStateForTools = vi.fn();
  const onToggleToolExpanded = vi.fn();
  const onSetSelectedTools = vi.fn(
    (
      updater:
        | Record<string, boolean>
        | ((current: Record<string, boolean>) => Record<string, boolean>),
    ) => {
      nextSelectionState =
        typeof updater === "function"
          ? updater(overrides.selectedTools ?? { archiveDatabase: true })
          : updater;
    },
  );

  const props: ComponentProps<typeof ReviewStep> = {
    createPending: false,
    discovery,
    draftKey: "demo-key",
    draftName: "Demo integration",
    filteredReviewedTools: [
      ["archiveDatabase", archiveTool],
      ["searchPages", searchTool],
      ["emptyTool", emptyTool],
    ],
    toolModes: {
      archiveDatabase: "approval_required",
      searchPages: "enabled",
      emptyTool: "disabled",
    },
    toolSearch: "",
    hasMatchingTools: true,
    kind: "mcp",
    matchingToolNames: ["archiveDatabase", "searchPages", "emptyTool"],
    reviewedTools: [
      ["archiveDatabase", archiveTool],
      ["searchPages", searchTool],
      ["emptyTool", emptyTool],
    ],
    selectedToolCount: 1,
    selectedToolNames: ["archiveDatabase"],
    selectedTools: { archiveDatabase: true },
    selectedMatchingCount: 1,
    allMatchingSelected: false,
    expandedTools: { emptyTool: true },
    onBack,
    onCreate,
    onToolSearchChange,
    onSetAccessModeForTools,
    onSetToolMode,
    onSetSelectedTools,
    onSetSelectedStateForTools,
    onToggleToolExpanded,
    ...overrides,
  };

  await act(async () => {
    root.render(<ReviewStep {...props} />);
  });

  mountedRoots.push({
    container,
    unmount: () => root.unmount(),
  });

  return {
    container,
    onBack,
    onCreate,
    onToolSearchChange,
    onSetAccessModeForTools,
    onSetToolMode,
    onSetSelectedStateForTools,
    onToggleToolExpanded,
    onSetSelectedTools,
    getNextSelectionState: () => nextSelectionState,
  };
};

afterEach(async () => {
  while (mountedRoots.length > 0) {
    const next = mountedRoots.pop();
    if (!next) {
      break;
    }

    await act(async () => {
      next.unmount();
    });
    next.container.remove();
  }
});

describe("ReviewStep", () => {
  it("shows the empty discovery state and disables saving when no tools were found", async () => {
    const { container, onBack } = await renderReviewStep({
      createPending: true,
      draftName: "Empty integration",
      kind: "managed",
      reviewedTools: [],
      filteredReviewedTools: [],
      matchingToolNames: [],
      selectedToolCount: 0,
      selectedToolNames: [],
      selectedTools: {},
      selectedMatchingCount: 0,
      hasMatchingTools: false,
      allMatchingSelected: false,
      expandedTools: {},
    });

    expect(container.textContent).toContain("Managed connector");
    expect(container.textContent).toContain(
      "No tools were discovered for this connector.",
    );

    const createButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Saving…"),
    );
    expect(createButton?.hasAttribute("disabled")).toBe(true);

    const backButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Back"),
    );
    expect(backButton).toBeTruthy();

    await act(async () => {
      backButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows a search-specific empty state when no reviewed tools match", async () => {
    const { container } = await renderReviewStep({
      filteredReviewedTools: [],
      toolSearch: "missing",
      hasMatchingTools: false,
      matchingToolNames: [],
      selectedToolCount: 0,
      selectedToolNames: [],
      selectedTools: {},
      selectedMatchingCount: 0,
      allMatchingSelected: false,
      expandedTools: {},
    });

    expect(container.textContent).toContain("0 matching");
    expect(container.textContent).toContain("0 selected in view");
    expect(container.textContent).toContain(
      "No tools match this search. Try a different term.",
    );

    const selectAllButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Select all matches"),
    );
    const deselectButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Deselect matches"),
    );

    expect(selectAllButton?.hasAttribute("disabled")).toBe(true);
    expect(deselectButton?.hasAttribute("disabled")).toBe(true);
  });

  it("supports bulk actions, inline selection, detail toggles, and slider updates", async () => {
    const {
      container,
      onBack,
      onCreate,
      onSetAccessModeForTools,
      onSetSelectedStateForTools,
      onSetToolMode,
      onToggleToolExpanded,
      getNextSelectionState,
    } = await renderReviewStep({
      draftName: "GitHub",
      toolSearch: "page",
      filteredReviewedTools: [
        ["searchPages", searchTool],
        ["emptyTool", emptyTool],
      ],
      matchingToolNames: ["searchPages", "emptyTool"],
      selectedToolCount: 1,
      selectedToolNames: ["searchPages"],
      selectedTools: { searchPages: true },
      selectedMatchingCount: 1,
      allMatchingSelected: false,
      expandedTools: { emptyTool: true },
    });

    expect(container.textContent).toContain("2 matching");
    expect(container.textContent).toContain("1 selected");
    expect(container.textContent).toContain("Search pages");
    expect(container.textContent).toContain("No description provided.");
    expect(container.textContent).toContain("Default scopes: none");

    const clickButton = async (label: string) => {
      const button = Array.from(container.querySelectorAll("button")).find(
        (candidate) => candidate.textContent?.includes(label),
      );
      expect(button, `Missing button: ${label}`).toBeTruthy();

      await act(async () => {
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    };

    await clickButton("Select all matches");
    await clickButton("Deselect matches");
    await clickButton("Enable selected");
    await clickButton("Case-by-case selected");
    await clickButton("Disable selected");
    await clickButton("Hide details");
    await clickButton("Back");
    await clickButton("Create integration");

    expect(onSetSelectedStateForTools).toHaveBeenNthCalledWith(
      1,
      ["searchPages", "emptyTool"],
      true,
    );
    expect(onSetSelectedStateForTools).toHaveBeenNthCalledWith(
      2,
      ["searchPages", "emptyTool"],
      false,
    );
    expect(onSetAccessModeForTools).toHaveBeenNthCalledWith(
      1,
      ["searchPages"],
      "enabled",
    );
    expect(onSetAccessModeForTools).toHaveBeenNthCalledWith(
      2,
      ["searchPages"],
      "approval_required",
    );
    expect(onSetAccessModeForTools).toHaveBeenNthCalledWith(
      3,
      ["searchPages"],
      "disabled",
    );
    expect(onToggleToolExpanded).toHaveBeenCalledWith("emptyTool");
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledTimes(1);

    const checkbox = container.querySelector(
      'input[aria-label="Select searchPages"]',
    ) as HTMLInputElement | null;
    expect(checkbox).toBeTruthy();

    await act(async () => {
      checkbox?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      checkbox?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(getNextSelectionState()).toEqual({ searchPages: false });

    const enabledButton = container.querySelector(
      'button[aria-label="Enabled access for searchPages"]',
    ) as HTMLButtonElement | null;
    expect(enabledButton).toBeTruthy();

    await act(async () => {
      enabledButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSetToolMode).toHaveBeenCalledWith("searchPages", "enabled");
  });
});
