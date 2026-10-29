import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useFactoryRoster } from "#/hooks/use-factory-roster";
import { useFactoryIncomingStore } from "#/stores/factory-incoming-store";
import { routeFactoryRequest } from "#/utils/factory-routing";
import {
  getFactoryIncoming,
  INCOMING_SOURCES,
  type IncomingPriority,
  type IncomingSource,
} from "#/utils/factory-incoming-demo";
import type { FeedFactory } from "#/utils/feed-team-demo";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { cn } from "#/utils/utils";
import { buildRouteContext } from "./factory-routing-context";
import type { FactoryData } from "./use-factory-data";
import { useFactoryDispatch } from "./use-factory-dispatch";

const SOURCE_LABEL: Record<IncomingSource, string> = {
  linear: "Linear",
  jira: "Jira",
  github: "GitHub",
};

const SOURCE_STYLE: Record<IncomingSource, string> = {
  linear: "bg-violet-500/15 text-violet-300",
  jira: "bg-sky-500/15 text-sky-300",
  github: "bg-slate-500/20 text-slate-300",
};

const PRIORITY_LABEL: Record<IncomingPriority, I18nKey> = {
  urgent: I18nKey.PLANNING$PRIORITY_URGENT,
  high: I18nKey.PLANNING$PRIORITY_HIGH,
  medium: I18nKey.PLANNING$PRIORITY_MEDIUM,
  low: I18nKey.PLANNING$PRIORITY_LOW,
};

const PRIORITY_STYLE: Record<IncomingPriority, string> = {
  urgent: "text-danger",
  high: "text-warning",
  medium: "text-muted",
  low: "text-muted",
};

interface FactoryIncomingProps {
  factory: FeedFactory;
  data: FactoryData;
}

/**
 * Work waiting to enter the factory from its sources: Linear and Jira tickets
 * and GitHub issues. Routing one sends it through the coordinator's router,
 * like a request typed in the composer.
 */
export function FactoryIncoming({ factory, data }: FactoryIncomingProps) {
  const { t, i18n } = useTranslation("openhands");
  const dispatch = useFactoryDispatch();
  const roster = useFactoryRoster(factory.id, data);
  const routed = useFactoryIncomingStore((state) => state.routed);
  const markRouted = useFactoryIncomingStore((state) => state.markRouted);
  const [source, setSource] = useState<IncomingSource | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const items = useMemo(() => getFactoryIncoming(factory.id), [factory.id]);
  const context = useMemo(
    () => buildRouteContext(data, roster),
    [data, roster],
  );
  const shown = items.filter(
    (item) => source === "all" || item.source === source,
  );

  const route = async (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item || busy) return;
    const text = `${item.key} ${item.title}`;
    const decision = routeFactoryRequest(text, { kind: "inbox" }, context);
    setBusy(id);
    try {
      await dispatch({
        factoryId: factory.id,
        factoryName: factory.name,
        text,
        targetLabel: SOURCE_LABEL[item.source],
        decision,
        conversationTitle: null,
      });
      markRouted(id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div data-testid="factory-incoming" className="flex flex-col gap-3">
      <p className="text-xs text-muted">{t(I18nKey.FACTORY$INCOMING_SAMPLE)}</p>
      <div className="flex flex-wrap gap-1.5">
        {(["all", ...INCOMING_SOURCES] as const).map((key) => {
          const count =
            key === "all"
              ? items.length
              : items.filter((item) => item.source === key).length;
          return (
            <button
              key={key}
              type="button"
              data-testid="factory-incoming-filter"
              data-source={key}
              aria-pressed={source === key}
              onClick={() => setSource(key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                source === key
                  ? "bg-contrast text-contrast-foreground"
                  : "bg-surface text-muted hover:text-contrast",
              )}
            >
              {key === "all" ? t(I18nKey.FEED$ALL) : SOURCE_LABEL[key]} {count}
            </button>
          );
        })}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted">
          {t(I18nKey.FACTORY$INCOMING_EMPTY)}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {shown.map((item) => {
            const done = routed.includes(item.id);
            return (
              <li
                key={item.id}
                data-testid="factory-incoming-item"
                data-source={item.source}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs",
                    SOURCE_STYLE[item.source],
                  )}
                >
                  {SOURCE_LABEL[item.source]}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {item.key}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    <span className={PRIORITY_STYLE[item.priority]}>
                      {t(PRIORITY_LABEL[item.priority])}
                    </span>
                    {` · ${item.reporter} · ${formatRelativeTime(
                      new Date(
                        Date.now() - item.hoursAgo * 3_600_000,
                      ).toISOString(),
                      i18n.language,
                      t,
                    )}`}
                  </span>
                </span>
                <button
                  type="button"
                  data-testid="factory-incoming-route"
                  disabled={done || busy !== null}
                  onClick={() => void route(item.id)}
                  className="shrink-0 rounded-lg border border-border px-3 py-1 text-xs text-contrast hover:bg-surface-raised disabled:opacity-50"
                >
                  {done
                    ? t(I18nKey.FACTORY$INCOMING_ROUTED)
                    : t(I18nKey.FACTORY$INCOMING_ROUTE)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
