// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LegacySharedOAuthCleanup } from "@/src/components/admin/legacy-shared-oauth-cleanup";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("LegacySharedOAuthCleanup", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("inspects and displays legacy shared OAuth credential summaries", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          count: 1,
          legacySharedOAuthCredentials: [
            {
              key: "slack",
              name: "Slack",
              kind: "mcp",
              provider: "mcp",
              credentialKeys: ["accessToken", "refreshToken"],
              credentialCount: 2,
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await act(async () => {
      root.render(<LegacySharedOAuthCleanup />);
    });

    const inspectButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Show legacy shared OAuth credentials"),
    );
    expect(inspectButton).toBeTruthy();

    await act(async () => {
      inspectButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/legacy-shared-oauth-credentials",
      { method: "GET" },
    );
    expect(container.textContent).toContain("Slack");
    expect(container.textContent).toContain("accessToken");
    expect(container.textContent).toContain("refreshToken");
    expect(container.textContent).toContain(
      "Found 1 shared integration with legacy OAuth credentials.",
    );
  });

  it("deletes listed legacy shared OAuth credentials after inspection", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            count: 1,
            legacySharedOAuthCredentials: [
              {
                key: "notion",
                name: "Notion",
                kind: "api",
                provider: "http",
                credentialKeys: ["accessToken"],
                credentialCount: 1,
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            scrubbedCount: 1,
            scrubbedIntegrations: [
              {
                key: "notion",
                name: "Notion",
                kind: "api",
                provider: "http",
                credentialKeys: ["accessToken"],
                credentialCount: 1,
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    await act(async () => {
      root.render(<LegacySharedOAuthCleanup />);
    });

    const inspectButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Show legacy shared OAuth credentials"),
    );
    expect(inspectButton).toBeTruthy();

    await act(async () => {
      inspectButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const deleteButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Delete listed credentials"),
    );
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/legacy-shared-oauth-credentials",
      { method: "DELETE" },
    );
    expect(container.textContent).toContain(
      "Deleted legacy shared OAuth credentials from 1 shared integration.",
    );
    expect(container.textContent).toContain(
      "No legacy shared OAuth credentials are currently stored on shared integrations.",
    );
  });
});
