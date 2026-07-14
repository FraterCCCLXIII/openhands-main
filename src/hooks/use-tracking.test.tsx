// @vitest-environment jsdom

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { captureAnalyticsEventMock } = vi.hoisted(() => ({
  captureAnalyticsEventMock: vi.fn(),
}));

vi.mock("@/src/lib/analytics", () => ({
  captureAnalyticsEvent: captureAnalyticsEventMock,
}));

import {
  safeAnalyticsIdentifier,
  useTracking,
} from "@/src/hooks/use-tracking";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

const TrackingProbe = () => {
  const { track } = useTracking();
  useEffect(() => {
    track("integration_tools_discovered", {
      integration_kind: "managed",
      connector_slug: "github",
      auth_strategy: "oauth2",
      tool_count: 12,
    });
  }, [track]);
  return null;
};

describe("useTracking", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    captureAnalyticsEventMock.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("delegates typed product events to the analytics client", async () => {
    await act(async () => root.render(<TrackingProbe />));

    expect(captureAnalyticsEventMock).toHaveBeenCalledWith(
      "integration_tools_discovered",
      {
        integration_kind: "managed",
        connector_slug: "github",
        auth_strategy: "oauth2",
        tool_count: 12,
      },
    );
  });

  it("only accepts low-cardinality identifiers from callback parameters", () => {
    expect(safeAnalyticsIdentifier(" GitHub_2 ")).toBe("github_2");
    expect(safeAnalyticsIdentifier("https://example.com/token?secret=1")).toBeUndefined();
    expect(safeAnalyticsIdentifier("a".repeat(65))).toBeUndefined();
  });
});
