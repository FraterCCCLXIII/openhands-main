// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchJson: vi.fn(),
  disable: vi.fn(),
  group: vi.fn(),
  identify: vi.fn(),
  initialize: vi.fn(),
  reset: vi.fn(),
  authState: {
    user: {
      id: "user-123",
      email: "person@example.com",
      orgId: "org-456",
      role: "member",
    },
    ownerId: "person@example.com",
    isAdmin: false,
  },
}));

vi.mock("@/src/components/auth/auth-context", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/src/lib/fetch-json", () => ({
  fetchJson: mocks.fetchJson,
}));

vi.mock("@/src/lib/analytics", () => ({
  disableAnalytics: mocks.disable,
  groupAnalyticsOrganization: mocks.group,
  identifyAnalyticsUser: mocks.identify,
  initializeAnalytics: mocks.initialize,
  resetAnalytics: mocks.reset,
}));

import { PostHogAnalytics } from "@/src/components/analytics/posthog-analytics";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

describe("PostHogAnalytics", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.initialize.mockReturnValue(true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("initializes and identifies only when a runtime key is configured", async () => {
    mocks.fetchJson.mockResolvedValue({ posthogClientKey: "phc_test" });

    await act(async () => {
      root.render(<PostHogAnalytics />);
      await Promise.resolve();
    });

    expect(mocks.fetchJson).toHaveBeenCalledWith("/api/auth/config");
    expect(mocks.initialize).toHaveBeenCalledWith("phc_test");
    expect(mocks.identify).toHaveBeenCalledWith("user-123", {
      organization_id: "org-456",
      organization_role: "member",
      is_admin: false,
    });
    expect(mocks.group).toHaveBeenCalledWith("org-456");
  });

  it("does not initialize or identify when the runtime key is absent", async () => {
    mocks.fetchJson.mockResolvedValue({ posthogClientKey: null });

    await act(async () => {
      root.render(<PostHogAnalytics />);
      await Promise.resolve();
    });

    expect(mocks.initialize).not.toHaveBeenCalled();
    expect(mocks.identify).not.toHaveBeenCalled();
    expect(mocks.disable).toHaveBeenCalledOnce();
  });
});
