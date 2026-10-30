import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExtensionDrawerPage } from "#/components/features/canvas-extensions/extension-page-host";
import {
  dispatchCanvasExtensionIntent,
  resetCanvasExtensionIntents,
  subscribeCanvasExtensionIntents,
} from "#/stores/canvas-extension-intent-store";

const runtime = vi.hoisted(() => ({
  value: { pages: [] as unknown[], activating: false, errors: new Map() },
}));
vi.mock(
  "#/components/features/canvas-extensions/canvas-extensions-runtime",
  () => ({ useCanvasExtensionsRuntime: () => runtime.value }),
);

describe("ExtensionDrawerPage", () => {
  beforeEach(() => {
    runtime.value = { pages: [], activating: false, errors: new Map() };
  });

  it("mounts the page and disposes it on unmount", async () => {
    const dispose = vi.fn();
    runtime.value.pages = [
      {
        extension: { name: "meet" },
        contribution: { id: "home", title: "Meet home" },
        mount: ({ container }: { container: HTMLElement }) => {
          container.textContent = "Hello from Meet";
          return dispose;
        },
      },
    ];

    const { unmount } = render(
      <ExtensionDrawerPage
        extensionName="meet"
        pageId="home"
        navigate={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Hello from Meet")).toBeInTheDocument(),
    );
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("explains when the page is not installed", () => {
    render(
      <ExtensionDrawerPage
        extensionName="gone"
        pageId="home"
        navigate={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId("extension-drawer-unavailable"),
    ).toBeInTheDocument();
  });

  describe("create intents", () => {
    const request = { id: "new-document", action: "create:document" };
    const mountSpy = vi.fn();

    beforeEach(() => {
      mountSpy.mockReset();
      runtime.value.pages = [
        {
          extension: { name: "meet" },
          contribution: { id: "home", title: "Meet home" },
          mount: (context: unknown) => mountSpy(context),
        },
      ];
    });

    afterEach(() => resetCanvasExtensionIntents());

    const renderPage = () =>
      render(
        <ExtensionDrawerPage
          extensionName="meet"
          pageId="home"
          navigate={vi.fn()}
        />,
      );

    it("hands a pending intent to the page at mount, once", async () => {
      dispatchCanvasExtensionIntent("meet", "home", request);

      const first = renderPage();
      await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(1));
      expect(mountSpy.mock.calls[0][0].intent).toEqual({
        ...request,
        at: expect.any(Number),
      });
      first.unmount();

      renderPage();
      await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(2));
      expect(mountSpy.mock.calls[1][0].intent).toBeNull();
    });

    it("delivers to onIntent when the page is already mounted", async () => {
      const received = vi.fn();
      const unsubscribe = subscribeCanvasExtensionIntents("meet", received);
      renderPage();
      await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(1));

      dispatchCanvasExtensionIntent("meet", "home", request);

      expect(received).toHaveBeenCalledWith({
        ...request,
        at: expect.any(Number),
      });
      unsubscribe();
    });

    it("does not replay an intent that onIntent already handled", async () => {
      const unsubscribe = subscribeCanvasExtensionIntents("meet", vi.fn());
      const first = renderPage();
      await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(1));
      dispatchCanvasExtensionIntent("meet", "home", request);
      first.unmount();

      renderPage();
      await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(2));

      expect(mountSpy.mock.calls[1][0].intent).toBeNull();
      unsubscribe();
    });

    it("ignores an intent whose navigation never landed", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      dispatchCanvasExtensionIntent("meet", "home", request);
      vi.setSystemTime(Date.now() + 60_000);

      renderPage();
      await waitFor(() => expect(mountSpy).toHaveBeenCalledTimes(1));
      vi.useRealTimers();

      expect(mountSpy.mock.calls[0][0].intent).toBeNull();
    });
  });
});
