import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "test-utils";
import { CanvasExtensionNavMenu } from "#/components/features/sidebar/canvas-extension-nav-menu";
import { CanvasExtensionIcon } from "#/components/features/canvas-extensions/canvas-extension-icon";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { canvasExtensionIconKey } from "#/utils/feed-icon-keys";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";

const extension = (
  overrides: Partial<InstalledCanvasExtensionInfo> = {},
): InstalledCanvasExtensionInfo => ({
  name: "demo-app",
  version: "0.1.0",
  enabled: true,
  source: "local",
  installed_at: "2026-10-01T00:00:00Z",
  install_path: "/tmp/demo-app",
  ...overrides,
});

describe("canvas extension icon colors", () => {
  beforeEach(() => {
    useFeedIconsStore.setState({ icons: {} });
  });

  it("opens the icon editor from a right-click on an app", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CanvasExtensionNavMenu extensionName="demo-app" label="Demo app">
        <a href="/demo">Demo app</a>
      </CanvasExtensionNavMenu>,
    );

    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByText("Demo app"),
    });
    await user.click(
      await screen.findByTestId("canvas-extension-nav-customize"),
    );

    expect(await screen.findByTestId("feed-icon-modal")).toBeInTheDocument();
  });

  it("uses the app's preferred background, and the person's choice over it", () => {
    const manifestApp = extension({
      manifest: {
        schema_version: 1,
        name: "demo-app",
        version: "0.1.0",
        entrypoint: "extension.js",
        icon_appearance: { background: "#8B5CF6" },
      },
    });
    const { rerender } = renderWithProviders(
      <CanvasExtensionIcon extension={manifestApp} size={20} />,
    );
    expect(screen.getByTestId("styled-icon")).toHaveStyle({
      backgroundColor: "#8B5CF6",
    });

    useFeedIconsStore
      .getState()
      .setIcon(canvasExtensionIconKey("demo-app"), { background: "#EF4444" });
    rerender(<CanvasExtensionIcon extension={manifestApp} size={20} />);
    expect(screen.getByTestId("styled-icon")).toHaveStyle({
      backgroundColor: "#EF4444",
    });
  });
});
