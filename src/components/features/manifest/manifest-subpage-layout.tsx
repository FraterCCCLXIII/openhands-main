import type { LucideIcon } from "lucide-react";
import { NavigationLink } from "#/components/shared/navigation-link";
import {
  SIDEBAR_ROW_INTERACTIVE_CLASS,
  sidebarNavRowClassName,
} from "#/components/features/sidebar/sidebar-layout";
import { settingsLikeMainScrollClassName } from "#/utils/settings-like-page-layout-classes";
import { cn } from "#/utils/utils";

export interface SubPageNavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  testId: string;
}

interface ManifestSubpageLayoutProps {
  /** The section heading above the desktop navigation. */
  heading: string;
  /** Prefix for the desktop/mobile nav testids. */
  navTestIdBase: string;
  items: SubPageNavItem[];
  /** Width limit of the content column; wide pages, such as a graph, lift it. */
  contentClassName?: string;
  /** Docked under the scrolling content, at the bottom of the screen (a composer). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

function SubPageNavLink({ item }: { item: SubPageNavItem }) {
  return (
    <NavigationLink
      to={item.to}
      end
      data-testid={item.testId}
      className={({ isActive }) =>
        cn(
          sidebarNavRowClassName(),
          "truncate whitespace-nowrap",
          isActive
            ? SIDEBAR_ROW_INTERACTIVE_CLASS.active
            : SIDEBAR_ROW_INTERACTIVE_CLASS.idle,
        )
      }
    >
      <span className="shrink-0 flex items-center justify-center">
        <item.Icon size={16} aria-hidden />
      </span>
      <span className="truncate">{item.label}</span>
    </NavigationLink>
  );
}

/**
 * The shell of a manifest-declared sub-page: a sticky desktop aside and a
 * horizontal mobile strip around a settings-like scrolling content column.
 * Purely presentational — what the items are, and whether any exist at all,
 * is the caller's (ultimately the manifest's) statement.
 */
export function ManifestSubpageLayout({
  heading,
  navTestIdBase,
  items,
  contentClassName = "max-w-200",
  footer,
  children,
}: ManifestSubpageLayoutProps) {
  return (
    <div className="flex h-full gap-4 lg:gap-10 lg:pl-10">
      <aside
        data-testid={`${navTestIdBase}-desktop`}
        className="hidden lg:flex lg:w-65 lg:shrink-0 lg:flex-col lg:gap-2 lg:sticky lg:top-8 lg:self-start"
      >
        <span className="px-2 text-sm font-normal text-contrast">
          {heading}
        </span>
        <div className="flex flex-col gap-0.5 pt-0.5">
          {items.map((item) => (
            <SubPageNavLink key={item.to} item={item} />
          ))}
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-1 flex-col">
          <main className={cn(settingsLikeMainScrollClassName, "h-full")}>
            <div
              className={cn(
                "mx-auto flex w-full min-w-0 flex-col gap-6",
                contentClassName,
              )}
            >
              <nav
                data-testid={`${navTestIdBase}-mobile`}
                className="lg:hidden flex gap-1 overflow-x-auto border-b border-border pb-2"
              >
                {items.map((item) => (
                  <SubPageNavLink key={item.to} item={item} />
                ))}
              </nav>
              {children}
            </div>
          </main>
          {footer ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t from-canvas-base to-transparent"
            />
          ) : null}
        </div>
        {footer ? (
          <div
            data-testid="manifest-subpage-footer"
            className="shrink-0 px-4 pb-4 pt-2 lg:pr-3.5"
          >
            <div className="mx-auto w-full max-w-[680px]">{footer}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
