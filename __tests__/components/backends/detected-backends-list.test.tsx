import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DetectedBackendsList } from "#/components/features/backends/detected-backends-list";

const detect = vi.hoisted(() => vi.fn());
vi.mock("#/api/detect-local-backends", () => ({
  detectLocalBackends: detect,
}));

const found = (host: string) => ({
  host,
  identified: true,
  version: "1.56.0",
  requiresApiKey: false,
});

const renderList = (props: Parameters<typeof DetectedBackendsList>[0]) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DetectedBackendsList {...props} />
    </QueryClientProvider>,
  );

describe("DetectedBackendsList", () => {
  it("offers only servers that are not already added, and hands back the one picked", async () => {
    detect.mockResolvedValue([
      found("http://127.0.0.1:8000"),
      found("http://127.0.0.1:8001"),
    ]);
    const onPick = vi.fn();
    renderList({ onPick, knownHosts: ["http://127.0.0.1:8000/"] });

    const offered = await screen.findAllByTestId("detected-backend");
    expect(offered).toHaveLength(1);
    await userEvent.click(offered[0]);
    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ host: "http://127.0.0.1:8001" }),
    );
  });

  it("says so when every server found is already added", async () => {
    detect.mockResolvedValue([found("http://127.0.0.1:8000")]);
    renderList({ onPick: vi.fn(), knownHosts: ["http://127.0.0.1:8000"] });
    expect(await screen.findByTestId("detected-backends-none")).toBeVisible();
  });
});
