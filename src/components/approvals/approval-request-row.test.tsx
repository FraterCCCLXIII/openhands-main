// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApprovalRequestRow } from "@/src/components/approvals/approval-request-row";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";
import type { AccessRequest } from "@/src/types/integrations-hub";

enableReactActEnvironment();

const pendingRequest: AccessRequest = {
  id: "req-pending",
  agentId: "voice-agent",
  agentClass: "assistant",
  integrationKey: "slack",
  toolName: "post_message",
  scopes: ["chat:write"],
  requestedMinutes: 240,
  channels: ["in_app"],
  notificationTargets: { in_app: "owner@example.com" },
  createdAt: "2026-06-24T10:52:43.000Z",
  status: "pending",
};

describe("ApprovalRequestRow", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const renderRow = async (overrides?: {
    isSelected?: boolean;
    showSelectionColumn?: boolean;
    onToggleSelected?: (requestId: string, selected: boolean) => void;
    onApprove?: (requestId: string) => void;
    onDeny?: (requestId: string) => void;
  }) => {
    const onToggleSelected = overrides?.onToggleSelected ?? vi.fn<(requestId: string, selected: boolean) => void>();
    const onApprove = overrides?.onApprove ?? vi.fn<(requestId: string) => void>();
    const onDeny = overrides?.onDeny ?? vi.fn<(requestId: string) => void>();

    await act(async () => {
      root.render(
        <table>
          <tbody>
            <ApprovalRequestRow
              request={pendingRequest}
              isSelected={overrides?.isSelected ?? false}
              showSelectionColumn={overrides?.showSelectionColumn ?? true}
              showDecisionColumns={false}
              showActionsColumn
              showConversationColumn={false}
              requestActionPending={false}
              onToggleSelected={onToggleSelected}
              onApprove={onApprove}
              onDeny={onDeny}
            />
          </tbody>
        </table>,
      );
    });

    return { onToggleSelected, onApprove, onDeny };
  };

  it("toggles selection when a pending row is clicked", async () => {
    const { onToggleSelected } = await renderRow();

    const row = container.querySelector(
      '[data-testid="approval-request-row-req-pending"]',
    ) as HTMLTableRowElement | null;

    expect(row).toBeTruthy();

    await act(async () => {
      row?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onToggleSelected).toHaveBeenCalledWith("req-pending", true);
  });

  it("toggles selection through the checkbox control", async () => {
    const { onToggleSelected } = await renderRow();

    const checkbox = container.querySelector(
      'input[aria-label="Select request req-pending"]',
    ) as HTMLInputElement | null;

    await act(async () => {
      checkbox?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      checkbox?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(onToggleSelected).toHaveBeenCalledTimes(1);
    expect(onToggleSelected).toHaveBeenCalledWith("req-pending", true);
  });

  it("does not toggle selection when approve or deny is clicked", async () => {
    const { onToggleSelected, onApprove, onDeny } = await renderRow();

    const approveButton = container.querySelector(
      '[data-testid="approval-request-approve-req-pending"]',
    ) as HTMLButtonElement | null;
    const denyButton = container.querySelector(
      '[data-testid="approval-request-deny-req-pending"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      approveButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      denyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onToggleSelected).not.toHaveBeenCalled();
    expect(onApprove).toHaveBeenCalledWith("req-pending");
    expect(onDeny).toHaveBeenCalledWith("req-pending");
  });

  it("renders the integration logo in the tool column after the selection checkbox", async () => {
    await renderRow();

    const toolCell = container.querySelector(
      '[data-testid="approval-request-tool-req-pending"]',
    );
    const logoMarker = container.querySelector(
      '[data-testid="approval-request-logo-req-pending"]',
    );

    expect(toolCell).toBeTruthy();
    expect(logoMarker).toBeTruthy();
    expect(
      toolCell?.previousElementSibling?.querySelector('input[type="checkbox"]'),
    ).toBeTruthy();
    expect(toolCell?.querySelector('[title="slack"]')).toBeTruthy();
  });

  it("adds left inset to the tool column when the selection column is hidden", async () => {
    await renderRow({ showSelectionColumn: false });

    const toolCell = container.querySelector(
      '[data-testid="approval-request-tool-req-pending"]',
    );

    expect(toolCell?.className).toContain("pl-4");
    expect(toolCell?.className).toContain("pr-2");
    expect(toolCell?.previousElementSibling).toBeNull();
  });

  it("uses a labeled grid layout for active approvals on mobile", async () => {
    await renderRow();

    const row = container.querySelector(
      '[data-testid="approval-request-row-req-pending"]',
    );
    const toolCell = container.querySelector(
      '[data-testid="approval-request-tool-req-pending"]',
    );
    const approveButton = container.querySelector(
      '[data-testid="approval-request-approve-req-pending"]',
    );

    expect(row?.className).toContain("grid-cols-[auto_minmax(0,1fr)_auto]");
    expect(row?.className).toContain("md:table-row");
    expect(toolCell?.className).toContain("col-span-full");
    expect(toolCell?.className).toContain("row-start-2");
    expect(toolCell?.querySelectorAll("wbr")).toHaveLength(2);
    expect(toolCell?.querySelector("p")?.getAttribute("aria-label")).toBe(
      "slack.post_message",
    );
    expect(toolCell?.textContent).toContain("post message");
    expect(approveButton).toBeTruthy();
    expect(container.textContent).toContain("Invocation identity");
    expect(container.textContent).toContain("Requested");
    expect(container.textContent).toContain("Duration");
    expect(container.textContent).toContain("Scopes");
  });
});
