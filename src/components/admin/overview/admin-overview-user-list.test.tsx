// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AdminOverviewUserList } from "@/src/components/admin/overview/admin-overview-user-list";
import { createAdminOverviewVariationUsers } from "@/src/components/admin/overview/admin-overview-variations-demo";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

describe("AdminOverviewUserList", () => {
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

  it("keeps the user identity header outside the modal scroll region", async () => {
    const { users, duplicateExternalAccounts } = createAdminOverviewVariationUsers();
    const alice = users.find((user) => user.ownerId === "alice@company.com");
    expect(alice).toBeTruthy();

    await act(async () => {
      root.render(
        <AdminOverviewUserList
          users={users}
          duplicateGroups={duplicateExternalAccounts}
        />,
      );
    });

    const row = container.querySelector<HTMLButtonElement>(
      '[data-testid="admin-overview-user-row"] button',
    );
    expect(row?.textContent).toContain("alice@company.com");

    await act(async () => {
      row?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const modal = document.querySelector(
      '[data-testid="admin-overview-user-modal-alice@company.com"]',
    );
    expect(modal).toBeTruthy();

    const header = modal?.querySelector("header");
    const heading = header?.querySelector("h2");
    expect(heading?.textContent).toBe("alice@company.com");
    expect(header?.className).toContain("shrink-0");

    const scrollRegion = modal?.querySelector(".overflow-y-auto");
    expect(scrollRegion).toBeTruthy();
    expect(scrollRegion?.contains(header ?? null)).toBe(false);
    expect(
      scrollRegion?.querySelector('[data-testid="admin-overview-user-details"]'),
    ).toBeTruthy();
  });

  it("lists deployment duplicate groups and opens owner details from a group", async () => {
    const { users, duplicateExternalAccounts } = createAdminOverviewVariationUsers();

    await act(async () => {
      root.render(
        <AdminOverviewUserList
          users={users}
          duplicateGroups={duplicateExternalAccounts}
        />,
      );
    });

    expect(container.querySelector('[data-testid="admin-overview-duplicates-card"]')).toBeTruthy();
    expect(container.textContent).toContain("github");
    expect(container.textContent).toContain("openhands-dev");

    const duplicateRow = container.querySelector<HTMLButtonElement>(
      '[data-testid="admin-overview-duplicate-group-row"] button',
    );
    await act(async () => {
      duplicateRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const groupModal = document.querySelector(
      '[data-testid="admin-overview-duplicate-group-modal"]',
    );
    expect(groupModal).toBeTruthy();

    const aliceOwner = Array.from(
      groupModal?.querySelectorAll("button") ?? [],
    ).find((button) => button.textContent?.includes("alice@company.com"));
    expect(aliceOwner).toBeTruthy();

    await act(async () => {
      aliceOwner?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(
      document.querySelector('[data-testid="admin-overview-duplicate-group-modal"]'),
    ).toBeFalsy();
    expect(
      document.querySelector('[data-testid="admin-overview-user-modal-alice@company.com"]'),
    ).toBeTruthy();
  });
});
