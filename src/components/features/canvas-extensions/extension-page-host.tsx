import React from "react";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { I18nKey } from "#/i18n/declaration";
import {
  clearCanvasExtensionIntent,
  markCanvasExtensionPageMounted,
  peekCanvasExtensionIntent,
} from "#/stores/canvas-extension-intent-store";
import {
  useCanvasExtensionsRuntime,
  type RegisteredCanvasExtensionPage,
} from "./canvas-extensions-runtime";

/**
 * Mounts an extension page into a container and returns the ref to attach, plus
 * any error the page threw. Shared by the routed page and the conversation drawer.
 */
export function useExtensionPageMount(
  page: RegisteredCanvasExtensionPage | undefined,
  path: string,
  navigate: (path: string) => void,
) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mountError, setMountError] = React.useState<string | null>(null);
  // Keep the latest navigate without remounting the page when it changes.
  const navigateRef = React.useRef(navigate);
  navigateRef.current = navigate;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !page) return undefined;
    let disposed = false;
    let disposeMount: (() => void) | undefined;
    setMountError(null);
    container.replaceChildren();
    const extensionName = page.extension.name;
    const pageId = page.contribution.id;
    const intent = peekCanvasExtensionIntent(extensionName, pageId);
    const unmarkMounted = markCanvasExtensionPageMounted(extensionName, pageId);

    Promise.resolve()
      .then(() => {
        // Delivered once: a later plain visit must not replay the create intent.
        if (intent) clearCanvasExtensionIntent(extensionName, pageId);
        return page.mount({
          container,
          path,
          navigate: (target) => navigateRef.current(target),
          intent,
        });
      })
      .then((dispose) => {
        if (typeof dispose !== "function") return;
        if (disposed) dispose();
        else disposeMount = dispose;
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setMountError(
            error instanceof Error ? error.message : "Extension page failed.",
          );
        }
      });

    return () => {
      disposed = true;
      unmarkMounted();
      try {
        disposeMount?.();
      } catch (error) {
        console.error("Canvas Extension page cleanup failed", error);
      }
      container.replaceChildren();
    };
  }, [page, path]);

  return { containerRef, mountError };
}

/** One extension page rendered inside the conversation's right-hand drawer. */
export function ExtensionDrawerPage({
  extensionName,
  pageId,
  navigate,
}: {
  extensionName: string;
  pageId: string;
  navigate: (path: string) => void;
}) {
  const { t } = useTranslation("openhands");
  const { pages, activating, errors } = useCanvasExtensionsRuntime();
  const page = React.useMemo(
    () =>
      pages.find(
        (candidate) =>
          candidate.extension.name === extensionName &&
          candidate.contribution.id === pageId,
      ),
    [extensionName, pageId, pages],
  );
  const { containerRef, mountError } = useExtensionPageMount(
    page,
    "",
    navigate,
  );

  if (activating && !page) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const error = mountError ?? errors.get(extensionName);
  if (error || !page) {
    return (
      <div
        data-testid="extension-drawer-unavailable"
        className="flex h-full items-center justify-center p-6 text-center text-sm text-tertiary-light"
      >
        {error || t(I18nKey.SETTINGS$APPS_PAGE_UNAVAILABLE)}
      </div>
    );
  }

  return (
    <section
      aria-label={page.contribution.title}
      className="h-full min-h-0 overflow-auto"
    >
      <div ref={containerRef} className="min-h-full" />
    </section>
  );
}
