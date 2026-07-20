import { afterEach, describe, expect, it, vi } from "vitest";

const importPaths = async () => import("./paths");

describe("Integrations Hub public paths", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("keeps root deployment paths unchanged by default", async () => {
    const { apiPath, uiPath } = await importPaths();

    expect(apiPath("/api/integrations")).toBe("/api/integrations");
    expect(uiPath("/integrations")).toBe("/integrations");
  });

  it("applies the configured UI and API prefixes without double-prefixing", async () => {
    vi.stubEnv("NEXT_PUBLIC_INTHUB_UI_BASE_PATH", "/integrations-hub/");
    vi.stubEnv("NEXT_PUBLIC_INTHUB_API_BASE_PATH", "/api/integrations-hub/");
    const { apiPath, uiPath } = await importPaths();

    expect(apiPath("/api/integrations")).toBe(
      "/api/integrations-hub/integrations",
    );
    expect(apiPath("https://example.com/api/integrations")).toBe(
      "https://example.com/api/integrations",
    );
    expect(uiPath("/integrations")).toBe("/integrations-hub/integrations");
    expect(uiPath("/integrations-hub/profile")).toBe(
      "/integrations-hub/profile",
    );
  });
});
