import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

/** Reports a fixed banner width to the ResizeObserver the banner uses. */
const stubBannerWidth = (width: number) => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ target, contentRect: { width } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
};

describe("AppBanner", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:logo");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("paints a gradient, not a photo, and centres a white logo mask", () => {
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
    const logo = screen.getByTestId("app-banner-logo");
    expect(banner).toContainElement(logo);
    const mask = logo.querySelector("[data-testid='app-banner-logo-mask']");
    expect(mask).toHaveClass("bg-white");
    expect(
      (mask as HTMLElement).style.maskImage ||
        (mask as HTMLElement).style.webkitMaskImage,
    ).toContain("blob:logo");
  });

  it("places the app's icon tile in the lower-left with its accent colour", () => {
    renderBanner(
      <AppBanner
        name="connectome"
        displayName="Connectome"
        manifest={
          {
            icon: "icon.svg",
            icon_appearance: { background: "orange" },
          } as never
        }
      />,
    );
    const banner = screen.getByTestId("app-banner");
    const tile = screen.getByTestId("app-banner-icon-tile");
    expect(banner.firstElementChild).toBe(tile);
    expect(tile).toHaveStyle({ backgroundColor: "#F97316" });
  });

  it("keeps the centred logo at 80px on wide banners and 56px on narrow ones", () => {
    stubBannerWidth(400);
    const { unmount } = renderBanner(
      <AppBanner
        name="meet"
        displayName="Meet"
        manifest={{ icon: "i.svg" } as never}
      />,
    );
    expect(screen.getByTestId("app-banner-logo")).toHaveStyle({
      width: "80px",
    });
    unmount();

    stubBannerWidth(200);
    renderBanner(
      <AppBanner
        name="meet"
        displayName="Meet"
        manifest={{ icon: "i.svg" } as never}
      />,
    );
    expect(screen.getByTestId("app-banner-logo")).toHaveStyle({
      width: "56px",
    });
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
