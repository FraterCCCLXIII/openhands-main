import { afterEach, describe, expect, it, vi } from "vitest";

import { listBuiltInConnectors } from "@/src/lib/integrations/built-in-connectors";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("listBuiltInConnectors", () => {
  it("marks OAuth-backed connectors as not configured when env vars are missing", () => {
    vi.stubEnv("NOTION_CLIENT_ID", "");
    vi.stubEnv("NOTION_CLIENT_SECRET", "");
    vi.stubEnv("FIGMA_CLIENT_ID", "");
    vi.stubEnv("FIGMA_CLIENT_SECRET", "");

    const connectors = listBuiltInConnectors();
    const notion = connectors.find((connector) => connector.slug === "notion");
    const figma = connectors.find((connector) => connector.slug === "figma");
    const github = connectors.find((connector) => connector.slug === "github");

    expect(notion?.oauthConfigured).toBe(false);
    expect(figma?.oauthConfigured).toBe(false);
    expect(github?.oauthConfigured).toBe(true);
  });

  it("marks OAuth-backed connectors as configured when the provider env vars exist", () => {
    vi.stubEnv("NOTION_CLIENT_ID", "notion-client-id");
    vi.stubEnv("NOTION_CLIENT_SECRET", "notion-client-secret");

    const connectors = listBuiltInConnectors();
    const notion = connectors.find((connector) => connector.slug === "notion");

    expect(notion?.oauthConfigured).toBe(true);
  });
});
