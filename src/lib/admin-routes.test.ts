import { describe, expect, it } from "vitest";

import { getAdminSectionFromPath } from "@/src/lib/admin-routes";

describe("getAdminSectionFromPath", () => {
  it("recognizes dashboard routes with static-export trailing slashes", () => {
    expect(getAdminSectionFromPath("/profile/")).toBe("profile");
    expect(getAdminSectionFromPath("/agent-connection/")).toBe("apiKeys");
    expect(getAdminSectionFromPath("/permission-profiles/")).toBe("apiKeys");
    expect(getAdminSectionFromPath("/case-by-case-approvals/")).toBe(
      "caseByCaseApprovals",
    );
  });

  it("ignores query strings and hash fragments when resolving sections", () => {
    expect(getAdminSectionFromPath("/profile/?showIntegrationWizard=1")).toBe(
      "profile",
    );
    expect(getAdminSectionFromPath("/integrations/#connectors")).toBe(
      "integrations",
    );
  });
});
