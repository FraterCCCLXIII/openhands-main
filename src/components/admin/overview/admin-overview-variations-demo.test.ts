import { describe, expect, it } from "vitest";

import {
  createAdminOverviewVariationUsers,
  enrichAdminOverviewWithVariationDemo,
} from "@/src/components/admin/overview/admin-overview-variations-demo";
import type { AdminOperationalOverview } from "@/src/types/integrations-hub";

describe("admin-overview-variations-demo", () => {
  it("creates users with varied connection and approval states", () => {
    const { users, duplicateExternalAccounts } =
      createAdminOverviewVariationUsers();

    expect(users.length).toBeGreaterThanOrEqual(5);
    expect(users.some((user) => user.totalConnections === 0)).toBe(true);
    expect(users.some((user) => user.totalConnections >= 4)).toBe(true);
    expect(duplicateExternalAccounts.length).toBeGreaterThan(0);
  });

  it("merges synthetic users into a live overview without duplicating owner ids", () => {
    const liveOverview: AdminOperationalOverview = {
      totalConnections: 1,
      connectedOwners: 1,
      managedConnectors: 2,
      totalAccessRequests: 0,
      pendingAccessRequests: 0,
      notifications: 0,
      duplicateExternalAccounts: [],
      users: [
        {
          ownerId: "dev@localhost",
          totalConnections: 1,
          integrations: ["github"],
          providers: ["github"],
          totalAccessRequests: 0,
          pendingAccessRequests: 0,
          notifications: 0,
          duplicateExternalAccounts: [],
          connections: [],
        },
      ],
    };

    const enriched = enrichAdminOverviewWithVariationDemo(liveOverview);

    expect(enriched.users.length).toBeGreaterThan(liveOverview.users.length);
    expect(enriched.users.some((user) => user.ownerId === "dev@localhost")).toBe(
      true,
    );
    expect(enriched.users.some((user) => user.ownerId === "alice@company.com")).toBe(
      true,
    );
    expect(enriched.duplicateExternalAccounts.length).toBeGreaterThan(0);
  });
});
