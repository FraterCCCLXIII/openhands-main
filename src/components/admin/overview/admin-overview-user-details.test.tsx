// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AdminOverviewUserDetails } from "@/src/components/admin/overview/admin-overview-user-details";
import { HUB_PAGE_COPY } from "@/src/constants/hub-pages";
import type { AdminOperationalOverviewUserSummary } from "@/src/types/integrations-hub";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

const createUser = (
  overrides: Partial<AdminOperationalOverviewUserSummary> = {},
): AdminOperationalOverviewUserSummary => ({
  ownerId: "alice@company.com",
  totalConnections: 1,
  integrations: ["github"],
  providers: ["github"],
  totalAccessRequests: 2,
  pendingAccessRequests: 1,
  notifications: 3,
  duplicateExternalAccounts: [
    {
      provider: "github",
      externalAccountId: "shared-id",
      ownerIds: ["alice@company.com", "bob@company.com"],
      ownerCount: 2,
      displayNames: ["Alice", "Bob"],
    },
  ],
  connections: [
    {
      ownerId: "alice@company.com",
      integrationKey: "github",
      provider: "github",
      authStrategy: "oauth2",
      scopes: ["repo"],
      externalAccountId: "shared-id",
      displayName: "Alice GitHub",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
    },
  ],
  ...overrides,
});

describe("AdminOverviewUserDetails", () => {
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

  it("renders metrics, connections, and duplicate groups for a populated user", async () => {
    await act(async () => {
      root.render(<AdminOverviewUserDetails user={createUser()} />);
    });

    expect(container.textContent).toContain(
      HUB_PAGE_COPY.adminOverview.savedIdentitiesTitle(1),
    );
    expect(container.textContent).toContain("Alice GitHub");
    expect(container.textContent).toContain("shared-id");
    expect(container.querySelector('[data-testid="admin-overview-connection-row"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="admin-overview-duplicate-group-row"]')).toBeTruthy();
    expect(container.textContent).toContain("bob@company.com");
  });

  it("renders empty states when the user has no connections or duplicate groups", async () => {
    await act(async () => {
      root.render(
        <AdminOverviewUserDetails
          user={createUser({
            totalConnections: 0,
            integrations: [],
            providers: [],
            connections: [],
            duplicateExternalAccounts: [],
            pendingAccessRequests: 4,
            notifications: 2,
          })}
        />,
      );
    });

    expect(container.textContent).toContain(
      HUB_PAGE_COPY.adminOverview.noConnectionsForUser,
    );
    expect(container.textContent).toContain(
      HUB_PAGE_COPY.adminOverview.duplicateAccountsEmpty,
    );
    expect(container.textContent).toContain(
      HUB_PAGE_COPY.adminOverview.noIntegrations,
    );
  });
});
