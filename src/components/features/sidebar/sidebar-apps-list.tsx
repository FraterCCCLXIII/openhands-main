/* eslint-disable no-param-reassign -- DataTransfer is a mutable browser API: setting effectAllowed and dropEffect is how drag and drop is used. */
import React from "react";
import { useTranslation } from "react-i18next";
import { MessagesSquare, Newspaper } from "lucide-react";
import { CanvasExtensionIcon } from "#/components/features/canvas-extensions/canvas-extension-icon";
import { useCanvasExtensionsRuntime } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { useNavigation } from "#/context/navigation-context";
import { I18nKey } from "#/i18n/declaration";
import { useDockedAppsStore } from "#/stores/docked-apps-store";
import { useSidebarAppsStore } from "#/stores/sidebar-apps-store";
import { cn } from "#/utils/utils";
import { BuiltInAppNavLink } from "./built-in-app-nav-link";
import { CanvasExtensionNavMenu } from "./canvas-extension-nav-menu";
import { SidebarGrip } from "./sidebar-grip";
import { SidebarNavLink } from "./sidebar-nav-link";

const FEED_PATH = "/feed";
const TEAM_CHAT_PATH = "/team-chat";
const ICON_SIZE = 22;
/** How many apps show before the rest hide behind the grip. */
const COLLAPSED_COUNT = 5;

interface AppEntry {
  key: string;
  href: string;
  node: React.ReactNode;
}

/**
 * Feed, Team chat and every installed app, as tiles. Only the first few show until the
 * grip under them is pulled open; the app you are on always stays in view.
 */
export function SidebarAppsList({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation("openhands");
  const { currentPath } = useNavigation();
  const { pages } = useCanvasExtensionsRuntime();
  const visibleCount = useSidebarAppsStore((s) => s.visibleCount);
  const setVisibleCount = useSidebarAppsStore((s) => s.setVisibleCount);
  const listRef = React.useRef<HTMLDivElement>(null);
  const order = useSidebarAppsStore((s) => s.order);
  const moveApp = useSidebarAppsStore((s) => s.moveApp);
  const [dragKey, setDragKey] = React.useState<string | null>(null);
  const [overKey, setOverKey] = React.useState<string | null>(null);
  // Pressing and holding lifts a row before it moves: it grows a little and casts a shadow.
  const [heldKey, setHeldKey] = React.useState<string | null>(null);
  const holdTimer = React.useRef<number | undefined>(undefined);
  const release = () => {
    window.clearTimeout(holdTimer.current);
    setHeldKey(null);
  };
  React.useEffect(() => () => window.clearTimeout(holdTimer.current), []);
  const undocked = useDockedAppsStore((s) => s.undocked);

  const apps: AppEntry[] = [
    {
      key: "feed",
      href: FEED_PATH,
      node: (
        <BuiltInAppNavLink
          appName="feed"
          to={FEED_PATH}
          label={t(I18nKey.FEED$TITLE)}
          testId="sidebar-feed-link"
          collapsed={collapsed}
          defaultBackground="orange"
          size={ICON_SIZE}
          glyph={<Newspaper width={14} height={14} />}
        />
      ),
    },
    {
      key: "team-chat",
      href: TEAM_CHAT_PATH,
      node: (
        <BuiltInAppNavLink
          appName="team-chat"
          to={TEAM_CHAT_PATH}
          label={t(I18nKey.TEAM_CHAT$NAV_LABEL)}
          testId="sidebar-team-chat-link"
          collapsed={collapsed}
          defaultBackground="emerald"
          size={ICON_SIZE}
          glyph={<MessagesSquare width={14} height={14} />}
        />
      ),
    },
    ...pages
      .filter((page) => !undocked[page.extension.name])
      .map((page) => {
        const label = page.contribution.nav_label || page.contribution.title;
        return {
          key: `${page.extension.name}:${page.contribution.id}`,
          href: page.href,
          node: (
            <CanvasExtensionNavMenu
              extensionName={page.extension.name}
              label={label}
            >
              <SidebarNavLink
                to={page.href}
                label={label}
                testId={`sidebar-canvas-extension-${page.extension.name}-${page.contribution.id}`}
                collapsed={collapsed}
                icon={
                  <CanvasExtensionIcon
                    extension={page.extension}
                    size={ICON_SIZE}
                  />
                }
              />
            </CanvasExtensionNavMenu>
          ),
        };
      }),
  ];

  // People's own order first; anything new follows in the default order.
  const rank = (key: string) => {
    const at = order.indexOf(key);
    return at < 0 ? order.length : at;
  };
  const ordered = [...apps].sort((a, b) => rank(a.key) - rank(b.key));
  const total = ordered.length;
  const shown = Math.min(Math.max(visibleCount, 1), total);
  const visible = ordered.filter(
    (app, index) =>
      index < shown ||
      currentPath === app.href ||
      currentPath.startsWith(`${app.href}/`),
  );
  const rowHeight = () => {
    const row = listRef.current?.querySelector<HTMLElement>(
      "[data-testid^='sidebar-app-row-']",
    );
    return row?.offsetHeight || 34;
  };

  return (
    <>
      <div ref={listRef} className="contents">
        {visible.map((app) => (
          <div
            key={app.key}
            data-testid={`sidebar-app-row-${app.key}`}
            draggable={!collapsed}
            onPointerDown={() => {
              if (collapsed) return;
              window.clearTimeout(holdTimer.current);
              holdTimer.current = window.setTimeout(
                () => setHeldKey(app.key),
                180,
              );
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onPointerLeave={() => {
              if (!dragKey) release();
            }}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", app.key);
              setDragKey(app.key);
              setHeldKey(null);
            }}
            onDragOver={(event) => {
              if (!dragKey || dragKey === app.key) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOverKey(app.key);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragKey && dragKey !== app.key) {
                moveApp(
                  dragKey,
                  app.key,
                  ordered.map((entry) => entry.key),
                );
              }
              setDragKey(null);
              setOverKey(null);
            }}
            onDragEnd={() => {
              setDragKey(null);
              setOverKey(null);
              release();
            }}
            className={cn(
              "rounded-lg transition-[transform,box-shadow,opacity,background-color] duration-200 ease-out motion-reduce:transition-none",
              heldKey === app.key &&
                !dragKey &&
                "z-10 scale-[1.03] cursor-grabbing bg-surface-raised shadow-lg shadow-black/40",
              dragKey === app.key && "scale-[0.97] opacity-40",
              overKey === app.key &&
                dragKey !== app.key &&
                "translate-y-2 shadow-[0_-2px_0_0_var(--color-primary,#fff)]",
            )}
          >
            {app.node}
          </div>
        ))}
      </div>
      {!collapsed && total > 1 ? (
        <SidebarGrip
          testId="sidebar-apps-toggle"
          shown={shown}
          total={total}
          collapsedCount={COLLAPSED_COUNT}
          rowHeight={rowHeight}
          onChange={setVisibleCount}
        />
      ) : null}
    </>
  );
}
