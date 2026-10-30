import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { AppBanner } from "./app-banner";
import { ToggleSwitch } from "#/ui/toggle-switch";

vi.mock("#/hooks/query/use-canvas-extension-icon", () => ({
  useCanvasExtensionIcon: () => ({
    data: new Blob(["<svg/>"], { type: "image/svg+xml" }),
  }),
}));

const renderBanner = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );

const toggleLabel = "Enable";

describe("AppBanner", () => {
  it("paints a gradient, not a photo, and masks the logo in white", () => {
    URL.createObjectURL = vi.fn(() => "blob:logo");
    URL.revokeObjectURL = vi.fn();
    renderBanner(
      <AppBanner
        name="meet"
        displayName="Meet"
        manifest={{ icon: "icon.svg" } as never}
      />,
    );
    const banner = screen.getByTestId("app-banner");
    expect(banner.style.background).toContain("linear-gradient");
    expect(banner.style.background).not.toContain("url(");
    const mask = screen.getByTestId("app-banner-logo-mask");
    expect(mask.style.maskImage || mask.style.webkitMaskImage).toContain(
      "blob:logo",
    );
    expect(mask).toHaveClass("bg-white");
  });

  it("keeps a toggle placed in the banner working", async () => {
    const onToggle = vi.fn();
    renderBanner(
      <AppBanner name="meet" displayName="Meet">
        <ToggleSwitch enabled={false} label={toggleLabel} onToggle={onToggle} />
      </AppBanner>,
    );
    await userEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
