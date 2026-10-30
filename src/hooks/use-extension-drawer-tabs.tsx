import React from "react";
import { useCanvasExtensionsRuntime } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { CanvasExtensionIcon } from "#/components/features/canvas-extensions/canvas-extension-icon";
import {
  makeExtensionTabId,
  type ExtensionTabId,
} from "#/utils/extension-tab-id";

export interface ExtensionDrawerTab {
  tab: ExtensionTabId;
  label: string;
  icon: React.ComponentType<{ className: string }>;
}

/**
 * One drawer tab per registered extension page, in registration order. The icon
 * components are memoised so the tab strip does not remount them every render.
 */
export function useExtensionDrawerTabs(): ExtensionDrawerTab[] {
  const { pages } = useCanvasExtensionsRuntime();
  return React.useMemo(
    () =>
      pages.map((page) => ({
        tab: makeExtensionTabId(page.extension.name, page.contribution.id),
        label: page.contribution.nav_label ?? page.contribution.title,
        icon: function ExtensionTabIcon({ className }: { className: string }) {
          return (
            <CanvasExtensionIcon
              extension={page.extension}
              size={16}
              className={className}
            />
          );
        },
      })),
    [pages],
  );
}
