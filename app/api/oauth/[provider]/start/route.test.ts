import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/oauth/[provider]/start", () => {
  it("redirects back to the admin UI with an error when OAuth is not configured", async () => {
    vi.stubEnv("DISABLE_AUTH", "true");
    vi.stubEnv("NOTION_CLIENT_ID", "");
    vi.stubEnv("NOTION_CLIENT_SECRET", "");

    const response = await GET(
      new Request(
        "http://localhost:3000/api/oauth/notion/start?integrationKey=notion&redirectTo=%2Fadmin%3Fsection%3Dintegrations%26showIntegrationWizard%3D1%26builtIn%3Dnotion",
      ),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain(
      "/admin?section=integrations&showIntegrationWizard=1&builtIn=notion",
    );
    expect(location).toContain("oauth_provider=notion");
    expect(location).toContain("oauth_status=error");
    expect(decodeURIComponent(location ?? "")).toContain(
      "NOTION_CLIENT_ID is not configured.",
    );
  });
});
