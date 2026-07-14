// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = vi.hoisted(() => ({
  capture: vi.fn(),
  group: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthogMock }));

describe("analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("stays disabled when the runtime key is empty", async () => {
    const analytics = await import("@/src/lib/analytics");

    expect(analytics.initializeAnalytics("  ")).toBe(false);
    analytics.captureAnalyticsEvent("integration_created", { tool_count: 4 });

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it("initializes explicit-only tracking and delegates identity and events", async () => {
    const analytics = await import("@/src/lib/analytics");

    analytics.captureAnalyticsEvent("integrations_hub_viewed", {
      integration_count: 2,
    });
    expect(analytics.initializeAnalytics("phc_test")).toBe(true);
    analytics.identifyAnalyticsUser("user-123", {
      organization_id: "org-456",
      is_admin: false,
    });
    analytics.groupAnalyticsOrganization("org-456");
    analytics.captureAnalyticsEvent("integration_created", { tool_count: 4 });
    analytics.resetAnalytics();

    expect(posthogMock.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://us.i.posthog.com",
        autocapture: false,
        capture_pageleave: false,
        capture_pageview: false,
        disable_session_recording: true,
        person_profiles: "identified_only",
      }),
    );
    expect(posthogMock.identify).toHaveBeenCalledWith("user-123", {
      organization_id: "org-456",
      is_admin: false,
    });
    expect(posthogMock.group).toHaveBeenCalledWith("organization", "org-456");
    expect(posthogMock.capture).toHaveBeenCalledWith("integration_created", {
      tool_count: 4,
    });
    expect(posthogMock.capture).toHaveBeenCalledWith("integrations_hub_viewed", {
      integration_count: 2,
    });
    expect(posthogMock.reset).toHaveBeenCalledOnce();
  });
});
