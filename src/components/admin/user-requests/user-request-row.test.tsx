// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserRequestRow } from "@/src/components/admin/user-requests/user-request-row";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";
import type { IntegrationRequest } from "@/src/types/integrations-hub";

enableReactActEnvironment();

const request = (
  overrides: Partial<IntegrationRequest> = {},
): IntegrationRequest => ({
  id: "req-1",
  source: "catalog",
  slug: "asana",
  name: "Asana",
  requestedBy: "alex@example.com",
  createdAt: "2026-08-26T15:20:00.000Z",
  status: "pending",
  ...overrides,
});

describe("UserRequestRow", () => {
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

  const renderRow = async (entry: IntegrationRequest, handlers = {
    onAdd: vi.fn(),
    onDismiss: vi.fn(),
  }) => {
    await act(async () => {
      root.render(
        <table>
          <tbody>
            <UserRequestRow
              request={entry}
              actionPending={false}
              onAdd={handlers.onAdd}
              onDismiss={handlers.onDismiss}
            />
          </tbody>
        </table>,
      );
    });
    return handlers;
  };

  it("shows a notes hovercard icon only when notes exist", async () => {
    await renderRow(request({ notes: "Need this for planning." }));
    const trigger = container.querySelector('[data-testid="user-request-notes-req-1"]');
    expect(trigger).toBeTruthy();

    await act(async () => {
      trigger
        ?.querySelector("button")
        ?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(document.querySelector('[data-testid="user-request-notes-req-1-content"]')?.textContent).toBe(
      "Need this for planning.",
    );

    await renderRow(request({ notes: "" }));
    expect(container.querySelector('[data-testid="user-request-notes-req-1"]')).toBeNull();
  });

  it("calls add and dismiss actions", async () => {
    const handlers = await renderRow(request());
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="user-request-add-req-1"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      container
        .querySelector<HTMLButtonElement>('[data-testid="user-request-dismiss-req-1"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(handlers.onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: "req-1" }));
    expect(handlers.onDismiss).toHaveBeenCalledWith("req-1");
  });
});
