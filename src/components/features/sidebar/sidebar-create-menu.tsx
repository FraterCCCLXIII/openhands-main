import React, { useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Factory,
  MessageSquarePlus,
  Plug,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { CanvasExtensionIcon } from "#/components/features/canvas-extensions/canvas-extension-icon";
import {
  useCanvasExtensionsRuntime,
  type RegisteredCanvasExtensionCreateAction,
} from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import { I18nKey } from "#/i18n/declaration";
import { dispatchCanvasExtensionIntent } from "#/stores/canvas-extension-intent-store";
import { ContextMenu } from "#/ui/context-menu";
import { dropdownMenuRowIconWrapperClassName } from "#/utils/dropdown-classes";
import { cn } from "#/utils/utils";

/** Things a user can create, each opened from the New Chat dropdown. */
const CREATE_ITEMS = [
  {
    key: "conversation",
    icon: MessageSquarePlus,
    label: I18nKey.COMMON$NEW_CONVERSATION,
    to: "/conversations",
  },
  {
    key: "factory",
    icon: Factory,
    label: I18nKey.SIDEBAR$NEW_FACTORY,
    to: "/factory?new=1",
  },
  {
    key: "automation",
    icon: Workflow,
    label: I18nKey.AUTOMATIONS$ADD_AUTOMATION,
    to: "/automations/setup",
  },
  {
    key: "agent-profile",
    icon: Bot,
    label: I18nKey.SETTINGS$ADD_AGENT_PROFILE,
    to: "/settings/agents",
  },
  {
    key: "skill",
    icon: Sparkles,
    label: I18nKey.CONVERSATION$OVERVIEW_ADD_SKILL,
    to: "/skills",
  },
  {
    key: "mcp-server",
    icon: Plug,
    label: I18nKey.CONVERSATION$OVERVIEW_ADD_MCP,
    to: "/mcp",
  },
] as const satisfies readonly {
  key: string;
  icon: LucideIcon;
  label: I18nKey;
  to: string;
}[];

/**
 * An extension's own icon. The markup is untrusted, so it is never inserted as
 * HTML: it becomes a CSS mask over the theme colour, which keeps scripts inert
 * and lets `currentColor` artwork follow the menu text colour.
 */
function CreateActionSvgIcon({ svg }: { svg: string }) {
  const markup = /\sxmlns=/.test(svg)
    ? svg
    : svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(markup)}")`;
  return (
    <span
      data-testid="sidebar-create-extension-svg-icon"
      style={{ "--canvas-extension-create-icon": url } as React.CSSProperties}
      className="size-4 bg-current [mask-image:var(--canvas-extension-create-icon)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
    />
  );
}

function isModifiedClick(event: React.MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  );
}

/** Chevron beside New Chat that opens a menu of other things to create. */
export function SidebarCreateMenu() {
  const { t } = useTranslation("openhands");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { createActions } = useCanvasExtensionsRuntime();
  const backendScopedPath = useBackendScopedPath();
  const close = () => setIsOpen(false);
  const openCreateAction = (
    entry: RegisteredCanvasExtensionCreateAction,
    event: React.MouseEvent,
  ) => {
    close();
    // A new-tab click leaves this tab where it is, so it must not queue an
    // intent that a later visit here would pick up.
    if (isModifiedClick(event)) return;
    dispatchCanvasExtensionIntent(entry.extension.name, entry.action.pageId, {
      id: entry.action.id,
      action: entry.action.intent ?? entry.action.id,
    });
  };
  const menuRef = useClickOutsideElement<HTMLUListElement>(close, triggerRef);
  useCloseOnEscape(isOpen, close, triggerRef);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        data-testid="sidebar-create-menu-trigger"
        aria-label={t(I18nKey.COMMON$MORE_OPTIONS)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-interactive-hover hover:text-contrast",
          isOpen && "bg-interactive-hover text-contrast",
        )}
      >
        <ChevronDown width={14} height={14} aria-hidden />
      </button>
      {isOpen && (
        <ContextMenu
          ref={menuRef}
          testId="sidebar-create-menu"
          position="bottom"
          alignment="left"
          spacing="none"
          className="z-[60] mt-2 min-w-56 p-1"
        >
          {CREATE_ITEMS.map((item) => (
            <li key={item.key} role="presentation">
              <NavigationLink
                to={item.to}
                onClick={close}
                data-testid={`sidebar-create-${item.key}`}
                className="flex h-8 items-center gap-2 rounded px-2 text-sm text-foreground hover:bg-interactive-hover"
              >
                <span
                  className={dropdownMenuRowIconWrapperClassName}
                  aria-hidden
                >
                  <item.icon width={16} height={16} />
                </span>
                {t(item.label)}
              </NavigationLink>
            </li>
          ))}
          {createActions.length > 0 && (
            <li role="separator" className="my-1 h-px bg-border" />
          )}
          {createActions.map((entry) => (
            <li
              key={`${entry.extension.name}:${entry.action.id}`}
              role="presentation"
            >
              <NavigationLink
                to={backendScopedPath(entry.href)}
                onClick={(event) => openCreateAction(entry, event)}
                title={entry.action.description}
                data-testid={`sidebar-create-extension-${entry.extension.name}-${entry.action.id}`}
                className="flex h-8 items-center gap-2 rounded px-2 text-sm text-foreground hover:bg-interactive-hover"
              >
                <span
                  className={dropdownMenuRowIconWrapperClassName}
                  aria-hidden
                >
                  {entry.action.icon ? (
                    <CreateActionSvgIcon svg={entry.action.icon.svg} />
                  ) : (
                    <CanvasExtensionIcon
                      extension={entry.extension}
                      size={16}
                    />
                  )}
                </span>
                {entry.action.label}
              </NavigationLink>
            </li>
          ))}
        </ContextMenu>
      )}
    </div>
  );
}
