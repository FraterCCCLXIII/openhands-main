import { describe, expect, it } from "vitest";

import {
  buildAdminSectionHref,
  getAdminSectionFromPath,
  getAdminSectionPath,
} from "@/src/lib/admin-routes";

describe("admin routes", () => {
  it("maps admin sections to top-level paths", () => {
    expect(getAdminSectionPath("home")).toBe("/admin");
    expect(getAdminSectionPath("profile")).toBe("/profile");
    expect(getAdminSectionPath("integrations")).toBe("/integrations");
    expect(getAdminSectionPath("apiKeys")).toBe("/agent-connection");
  });

  it("detects the active section from top-level paths", () => {
    expect(getAdminSectionFromPath("/admin")).toBe("home");
    expect(getAdminSectionFromPath("/profile")).toBe("profile");
    expect(getAdminSectionFromPath("/integrations")).toBe("integrations");
    expect(getAdminSectionFromPath("/agent-connection")).toBe("apiKeys");
  });

  it("builds hrefs with optional query params", () => {
    expect(buildAdminSectionHref("profile")).toBe("/profile");
    expect(
      buildAdminSectionHref("integrations", {
        showIntegrationWizard: "1",
        builtIn: "notion",
      }),
    ).toBe("/integrations?showIntegrationWizard=1&builtIn=notion");
  });
});
