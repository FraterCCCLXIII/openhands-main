import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bot,
  ChevronDown,
  GitPullRequest,
  Inbox,
  MessageSquare,
  SendHorizontal,
} from "lucide-react";
import type { TFunction } from "i18next";
import { ContextMenuListItem } from "#/components/features/context-menu/context-menu-list-item";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { I18nKey } from "#/i18n/declaration";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { ContextMenu } from "#/ui/context-menu";
import {
  routeFactoryRequest,
  type FactoryTarget,
  type RouteDecision,
  type RouteReason,
} from "#/utils/factory-routing";
import type { FeedFactory } from "#/utils/feed-team-demo";
import { cn } from "#/utils/utils";
import { buildRouteContext, buildRoster } from "./factory-routing-context";
import type { FactoryData } from "./use-factory-data";
import { useFactoryDispatch } from "./use-factory-dispatch";

const MENU_CONVERSATIONS = 12;
const RECENT_INBOX_ITEMS = 3;

/** One sentence for why the router chose what it did. */
export function describeReason(t: TFunction, reason: RouteReason): string {
  switch (reason.code) {
    case "picked":
      return t(I18nKey.FACTORY$REASON_PICKED);
    case "agent_named":
      return t(I18nKey.FACTORY$REASON_AGENT, { name: reason.name });
    case "ref":
      return t(I18nKey.FACTORY$REASON_REF, { ref: reason.ref });
    case "similar":
      return t(I18nKey.FACTORY$REASON_SIMILAR, { percent: reason.percent });
    case "role":
      return t(I18nKey.FACTORY$REASON_ROLE, { name: reason.name });
    default:
      return t(I18nKey.FACTORY$REASON_NEW);
  }
}

interface FactoryComposerProps {
  factory: FeedFactory;
  data: FactoryData;
  target: FactoryTarget;
  onTarget: (target: FactoryTarget) => void;
}

/**
 * Sends a request into a factory. The target says where: the factory inbox
 * (the coordinator routes it), one agent's inbox, one conversation or one pull
 * request. Whatever the target, the router decides between sending to an
 * existing conversation and starting a new one, and shows why.
 */
export function FactoryComposer({
  factory,
  data,
  target,
  onTarget,
}: FactoryComposerProps) {
  const { t } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const dispatch = useFactoryDispatch();
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useClickOutsideElement<HTMLUListElement>(
    () => setMenuOpen(false),
    triggerRef,
  );
  const items = useFactoryInboxStore((state) => state.items);
  const recent = items
    .filter((item) => item.factoryId === factory.id)
    .slice(-RECENT_INBOX_ITEMS)
    .reverse();

  const context = useMemo(() => buildRouteContext(data), [data]);
  const { coordinator, others } = useMemo(() => buildRoster(data), [data]);
  const titles = useMemo(
    () => new Map(data.conversations.map((c) => [c.id, c.title ?? ""])),
    [data.conversations],
  );
  const prOptions = context.candidates.flatMap((candidate) =>
    candidate.pullRequests.map((pr) => ({ pr, candidate })),
  );

  const targetLabel = (() => {
    if (target.kind === "agent") {
      return t(I18nKey.FACTORY$TARGET_AGENT_INBOX, { name: target.agentName });
    }
    if (target.kind === "conversation") {
      return titles.get(target.conversationId) || t(I18nKey.FEED$UNTITLED);
    }
    if (target.kind === "pr") return `#${target.prNumber}`;
    return t(I18nKey.FACTORY$INBOX);
  })();

  const trimmed = text.trim();
  const decision: RouteDecision | null = trimmed
    ? routeFactoryRequest(trimmed, target, context)
    : null;
  const where = decision
    ? decision.kind === "existing" && decision.conversationId
      ? `${decision.agentName} · ${titles.get(decision.conversationId) ?? ""}`
      : t(I18nKey.FACTORY$NEW_CONVERSATION, { name: decision.agentName })
    : "";

  const send = async () => {
    if (!decision || sending) return;
    setSending(true);
    try {
      await dispatch({
        factoryId: factory.id,
        factoryName: factory.name,
        text: trimmed,
        targetLabel,
        decision,
        conversationTitle: decision.conversationId
          ? (titles.get(decision.conversationId) ?? null)
          : null,
      });
      setText("");
    } finally {
      setSending(false);
    }
  };

  const pick = (next: FactoryTarget) => {
    onTarget(next);
    setMenuOpen(false);
  };

  return (
    <div
      data-testid="factory-composer"
      className="sticky bottom-0 z-10 -mx-1 mt-auto flex flex-col gap-2 bg-linear-to-t from-canvas-base from-70% to-transparent px-1 pb-4 pt-8"
    >
      {recent.length > 0 ? (
        <ul data-testid="factory-inbox-log" className="flex flex-col gap-1.5">
          {recent.map((item) => (
            <li
              key={item.id}
              data-testid="factory-inbox-item"
              data-status={item.status}
              className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs"
            >
              <Inbox
                size={14}
                aria-hidden
                className="mt-0.5 shrink-0 text-muted"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-contrast">
                  {item.text}
                </span>
                <span
                  className={cn(
                    "block text-muted",
                    item.status === "failed" && "text-danger",
                  )}
                >
                  {item.status === "failed"
                    ? t(I18nKey.FACTORY$ROUTE_FAILED)
                    : item.kind === "existing"
                      ? t(I18nKey.FACTORY$ROUTE_EXISTING, {
                          title: item.conversationTitle ?? "",
                          name: item.agentName,
                        })
                      : t(I18nKey.FACTORY$ROUTE_NEW, { name: item.agentName })}
                  {item.reasons[0]
                    ? ` · ${describeReason(t, item.reasons[0])}`
                    : ""}
                </span>
              </span>
              {item.conversationId ? (
                <NavigationLink
                  to={backendScopedPath(
                    `/conversations/${item.conversationId}`,
                  )}
                  className="shrink-0 text-muted hover:text-contrast hover:underline"
                >
                  {t(I18nKey.FEED$OPEN_SHORT)}
                </NavigationLink>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {decision ? (
        <p
          data-testid="factory-route-preview"
          className="px-1 text-xs text-muted"
        >
          {t(I18nKey.FACTORY$LIKELY, { where })}
          {decision.reasons[0]
            ? ` · ${describeReason(t, decision.reasons[0])}`
            : ""}
        </p>
      ) : null}

      <form
        className="flex items-end gap-2 rounded-2xl border border-border bg-surface-raised p-2 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div ref={triggerRef} className="relative shrink-0">
          <button
            type="button"
            data-testid="factory-target-trigger"
            aria-label={t(I18nKey.FACTORY$TARGET_LABEL)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex max-w-56 items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs text-contrast hover:bg-base-secondary"
          >
            {target.kind === "pr" ? (
              <GitPullRequest size={14} aria-hidden />
            ) : target.kind === "conversation" ? (
              <MessageSquare size={14} aria-hidden />
            ) : target.kind === "agent" ? (
              <Bot size={14} aria-hidden />
            ) : (
              <Inbox size={14} aria-hidden />
            )}
            <span className="truncate">{targetLabel}</span>
            <ChevronDown size={14} aria-hidden className="shrink-0" />
          </button>
          {menuOpen ? (
            <ContextMenu
              ref={menuRef}
              testId="factory-target-menu"
              alignment="left"
              position="top"
              className="z-20 max-h-80 w-80 overflow-y-auto"
            >
              <ContextMenuListItem
                testId="factory-target-inbox"
                onClick={() => pick({ kind: "inbox" })}
              >
                <span className="flex items-center gap-2">
                  <Inbox size={14} aria-hidden />
                  <span className="flex flex-col text-left">
                    <span>{t(I18nKey.FACTORY$INBOX)}</span>
                    <span className="text-xs text-muted">
                      {t(I18nKey.FACTORY$COORDINATOR)} ·{" "}
                      {coordinator.agent.name}
                    </span>
                  </span>
                </span>
              </ContextMenuListItem>
              <p className="px-2 pt-2 text-xs text-muted">
                {t(I18nKey.FEED$AGENTS)}
              </p>
              {others.map(({ agent }) => (
                <ContextMenuListItem
                  key={agent.name}
                  testId="factory-target-agent"
                  onClick={() => pick({ kind: "agent", agentName: agent.name })}
                >
                  <span className="flex items-center gap-2">
                    <Bot size={14} aria-hidden />
                    {t(I18nKey.FACTORY$TARGET_AGENT_INBOX, {
                      name: agent.name,
                    })}
                  </span>
                </ContextMenuListItem>
              ))}
              {context.candidates.length > 0 ? (
                <p className="px-2 pt-2 text-xs text-muted">
                  {t(I18nKey.FACTORY$TARGET_CONVERSATIONS)}
                </p>
              ) : null}
              {context.candidates.slice(0, MENU_CONVERSATIONS).map((c) => (
                <ContextMenuListItem
                  key={c.id}
                  testId="factory-target-conversation"
                  onClick={() =>
                    pick({ kind: "conversation", conversationId: c.id })
                  }
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MessageSquare size={14} aria-hidden className="shrink-0" />
                    <span className="truncate">
                      {c.agentName} › {c.title || t(I18nKey.FEED$UNTITLED)}
                    </span>
                  </span>
                </ContextMenuListItem>
              ))}
              {prOptions.length > 0 ? (
                <p className="px-2 pt-2 text-xs text-muted">
                  {t(I18nKey.FACTORY$TARGET_PRS)}
                </p>
              ) : null}
              {prOptions.map(({ pr, candidate }) => (
                <ContextMenuListItem
                  key={`${candidate.id}-${pr}`}
                  testId="factory-target-pr"
                  onClick={() => pick({ kind: "pr", prNumber: pr })}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GitPullRequest
                      size={14}
                      aria-hidden
                      className="shrink-0"
                    />
                    <span className="truncate">
                      #{pr} · {candidate.title}
                    </span>
                  </span>
                </ContextMenuListItem>
              ))}
            </ContextMenu>
          ) : null}
        </div>
        <textarea
          data-testid="factory-composer-input"
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder={t(I18nKey.FACTORY$COMPOSER_PLACEHOLDER, {
            target: targetLabel,
          })}
          aria-label={t(I18nKey.FACTORY$COMPOSER_PLACEHOLDER, {
            target: targetLabel,
          })}
          className="max-h-40 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-contrast outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          data-testid="factory-composer-send"
          aria-label={t(I18nKey.FEED$SEND)}
          disabled={!trimmed || sending}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-contrast text-contrast-foreground disabled:opacity-40"
        >
          <SendHorizontal size={16} />
        </button>
      </form>
    </div>
  );
}
