import React from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Cpu,
  FileText,
  Hash,
  Layers,
  ListTree,
  MessageSquareQuote,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Users,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { FeedUpdateDetails, StepUsage } from "#/utils/feed-updates";
import { SecurityRisk } from "#/types/agent-server/core/base/common";
import { cn } from "#/utils/utils";
import { Chip, type ChipTone } from "./turn-details/chip";
import { CodeBlock, CopyButton } from "./turn-details/code-block";
import { CollapsibleText } from "./turn-details/collapsible-text";
import { Module } from "./turn-details/module";
import { StatGrid } from "./turn-details/stat-grid";

const formatSeconds = (ms: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "second",
    unitDisplay: "narrow",
    maximumFractionDigits: 1,
  }).format(ms / 1000);

const formatNumber = (value: number): string =>
  new Intl.NumberFormat().format(value);

const RISK_TONE: Partial<Record<string, ChipTone>> = {
  [SecurityRisk.LOW]: "success",
  [SecurityRisk.MEDIUM]: "warning",
  [SecurityRisk.HIGH]: "danger",
};

function EvidenceItem({ label, result }: { label: string; result: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <li className="rounded-lg border border-border bg-surface-raised">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-1.5 px-2 py-1 text-left text-xs text-foreground"
      >
        <span className="flex-1 truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 flex-shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="px-1.5 pb-1.5">
          <CodeBlock maxHeight="max-h-32">{result}</CodeBlock>
        </div>
      ) : null}
    </li>
  );
}

function UsageStats({ usage }: { usage: StepUsage }) {
  const { t } = useTranslation("openhands");
  const stats = [
    {
      label: t(I18nKey.FEED$DETAILS_STAT_INPUT),
      value: formatNumber(usage.promptTokens),
    },
    {
      label: t(I18nKey.FEED$DETAILS_STAT_OUTPUT),
      value: formatNumber(usage.completionTokens),
    },
    usage.reasoningTokens > 0
      ? {
          label: t(I18nKey.FEED$DETAILS_REASONING),
          value: formatNumber(usage.reasoningTokens),
        }
      : null,
    usage.cacheReadTokens > 0
      ? {
          label: t(I18nKey.FEED$DETAILS_STAT_CACHED),
          value: formatNumber(usage.cacheReadTokens),
        }
      : null,
    usage.cost > 0
      ? {
          label: t(I18nKey.FEED$DETAILS_STAT_COST),
          value: `$${usage.cost.toFixed(4)}`,
        }
      : null,
    usage.contextTokens > 0
      ? {
          label: t(I18nKey.FEED$DETAILS_STAT_CONTEXT),
          value:
            usage.contextWindow > 0
              ? `${formatNumber(usage.contextTokens)} / ${formatNumber(usage.contextWindow)}`
              : formatNumber(usage.contextTokens),
        }
      : null,
  ].filter((stat): stat is { label: string; value: string } => stat !== null);
  const pct =
    usage.contextWindow > 0 && usage.contextTokens > 0
      ? Math.min(100, (usage.contextTokens / usage.contextWindow) * 100)
      : null;
  return (
    <div className="flex flex-col gap-2">
      <StatGrid stats={stats} />
      {pct !== null ? (
        <div
          role="progressbar"
          aria-label={t(I18nKey.FEED$DETAILS_STAT_CONTEXT)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          className="h-1 overflow-hidden rounded-full bg-surface-raised"
        >
          <div
            className="h-full rounded-full bg-muted"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function HeaderChips({ details }: { details: FeedUpdateDetails }) {
  const { t } = useTranslation("openhands");
  const { outcome, usage } = details;
  const chips: React.ReactNode[] = [];
  if (outcome) {
    const rejected = !!outcome.rejectionReason;
    chips.push(
      <Chip
        key="status"
        testId="turn-details-chip-status"
        tone={outcome.isError ? "danger" : "success"}
        icon={outcome.isError ? <X /> : <Check />}
        title={outcome.rejectionReason}
      >
        {t(
          rejected
            ? I18nKey.FEED$DETAILS_STATUS_REJECTED
            : outcome.isError
              ? I18nKey.FEED$DETAILS_OUTCOME_ERROR
              : I18nKey.FEED$DETAILS_OUTCOME_OK,
        )}
      </Chip>,
    );
  }
  if (details.risk && RISK_TONE[details.risk]) {
    chips.push(
      <Chip
        key="risk"
        testId="turn-details-chip-risk"
        tone={RISK_TONE[details.risk]}
        icon={details.risk === SecurityRisk.HIGH ? <ShieldAlert /> : <Shield />}
      >
        {t(I18nKey.FEED$DETAILS_RISK, { level: details.risk })}
      </Chip>,
    );
  }
  if (details.durationMs !== undefined) {
    chips.push(
      <Chip key="duration" testId="turn-details-chip-duration" icon={<Clock />}>
        {formatSeconds(details.durationMs)}
      </Chip>,
    );
  }
  if (details.tool) {
    chips.push(
      <Chip key="tool" testId="turn-details-chip-tool" icon={<Terminal />} mono>
        {details.tool}
      </Chip>,
    );
  }
  if (typeof outcome?.exitCode === "number") {
    chips.push(
      <Chip
        key="exit"
        testId="turn-details-chip-exit-code"
        tone={outcome.exitCode === 0 ? "neutral" : "danger"}
        icon={<Hash />}
        mono
      >
        {t(I18nKey.FEED$DETAILS_EXIT_CODE, { code: outcome.exitCode })}
      </Chip>,
    );
  }
  if (usage?.model) {
    chips.push(
      <Chip key="model" testId="turn-details-chip-model" icon={<Cpu />}>
        {usage.model}
      </Chip>,
    );
  }
  if (usage && usage.promptTokens + usage.completionTokens > 0) {
    chips.push(
      <Chip key="tokens" testId="turn-details-chip-tokens" icon={<Zap />}>
        {t(I18nKey.FEED$DETAILS_TOKENS_TOTAL, {
          num: formatNumber(usage.promptTokens + usage.completionTokens),
        })}
      </Chip>,
    );
  }
  if (usage && usage.cost > 0) {
    chips.push(
      <Chip key="cost" testId="turn-details-chip-cost" icon={<Coins />}>
        {`$${usage.cost.toFixed(4)}`}
      </Chip>,
    );
  }
  if (!chips.length) return null;
  return (
    <div data-testid="turn-details-chips" className="flex flex-wrap gap-1.5">
      {chips}
    </div>
  );
}

/** What an agent was thinking and how a step turned out. */
export function TurnDetailsPanel({
  details,
  footer,
}: {
  details: FeedUpdateDetails;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation("openhands");
  return (
    <div
      data-testid="turn-details"
      className="@container mt-1.5 flex min-w-0 flex-col gap-2 text-xs text-muted"
    >
      <HeaderChips details={details} />
      <div className="grid grid-cols-1 gap-2 @lg:grid-cols-2">
        {details.promptedBy ? (
          <Module
            icon={<MessageSquareQuote />}
            title={t(I18nKey.FEED$DETAILS_PROMPTED_BY)}
            wide
          >
            <blockquote className="custom-scrollbar max-h-24 overflow-auto whitespace-pre-wrap break-words border-l-2 border-border pl-2 italic text-muted">
              {details.promptedBy}
            </blockquote>
          </Module>
        ) : null}
        {details.reasoning ? (
          <Module
            icon={<Brain />}
            title={t(I18nKey.FEED$DETAILS_REASONING)}
            wide
          >
            <CollapsibleText text={details.reasoning} />
          </Module>
        ) : details.redacted ? (
          <Module
            icon={<Brain />}
            title={t(I18nKey.FEED$DETAILS_REASONING)}
            wide
          >
            <p
              role="note"
              className="flex items-center gap-1.5 rounded-lg bg-surface-raised px-2 py-1 text-muted"
            >
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {t(I18nKey.FEED$DETAILS_REASONING_REDACTED)}
            </p>
          </Module>
        ) : null}
        {details.thought ? (
          <Module
            icon={<Sparkles />}
            title={t(I18nKey.FEED$DETAILS_THOUGHT)}
            wide
          >
            <CollapsibleText text={details.thought} />
          </Module>
        ) : null}
        {details.subagent ? (
          <Module
            icon={<Users />}
            title={t(I18nKey.FEED$DETAILS_SUBAGENT, {
              type: details.subagent.type,
            })}
            wide
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap gap-1.5">
                <Chip icon={<Users />} mono>
                  {details.subagent.type}
                </Chip>
                {details.subagent.status ? (
                  <Chip icon={<Activity />}>{details.subagent.status}</Chip>
                ) : null}
              </div>
              {details.subagent.description ? (
                <p className="break-words">{details.subagent.description}</p>
              ) : null}
            </div>
          </Module>
        ) : null}
        {details.args?.length ? (
          <Module icon={<ListTree />} title={t(I18nKey.FEED$DETAILS_ARGUMENTS)}>
            <dl className="custom-scrollbar flex max-h-32 flex-col gap-1 overflow-auto font-mono text-xs">
              {details.args.map((arg) => (
                <div key={arg.key} className="flex gap-1.5">
                  <dt className="flex-shrink-0 text-muted">{arg.key}</dt>
                  <dd className="min-w-0 whitespace-pre-wrap break-all text-foreground">
                    {arg.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Module>
        ) : null}
        {details.usage ? (
          <Module icon={<Coins />} title={t(I18nKey.FEED$DETAILS_USAGE)}>
            <UsageStats usage={details.usage} />
          </Module>
        ) : null}
        {details.result ? (
          <Module
            icon={<FileText />}
            title={t(I18nKey.FEED$DETAILS_RESULT)}
            actions={<CopyButton text={details.result} />}
            tone={details.outcome?.isError ? "danger" : "neutral"}
            wide
          >
            <CodeBlock>{details.result}</CodeBlock>
          </Module>
        ) : null}
        {details.evidence?.length ? (
          <Module
            icon={<Layers />}
            title={t(I18nKey.FEED$DETAILS_BASED_ON)}
            wide
          >
            <ul className="flex flex-col gap-1">
              {details.evidence.map((item, index) => (
                <EvidenceItem
                  key={index}
                  label={item.label}
                  result={item.result}
                />
              ))}
            </ul>
          </Module>
        ) : null}
        {details.skills?.length ? (
          <Module icon={<Sparkles />} title={t(I18nKey.FEED$DETAILS_SKILLS)}>
            <div className="flex flex-wrap gap-1.5">
              {details.skills.map((skill) => (
                <Chip key={skill} icon={<Sparkles />}>
                  {skill}
                </Chip>
              ))}
            </div>
          </Module>
        ) : null}
        {details.hooks?.length ? (
          <Module icon={<Webhook />} title={t(I18nKey.FEED$DETAILS_HOOKS)}>
            <ul className="flex flex-col gap-1">
              {details.hooks.map((hook, index) => {
                const failed = hook.blocked || !hook.success;
                return (
                  <li
                    key={index}
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <Chip tone={failed ? "danger" : "success"} mono>
                      {hook.type}
                    </Chip>
                    <span className="min-w-0 break-words text-muted">
                      {[
                        hook.tool,
                        hook.blocked
                          ? t(I18nKey.FEED$DETAILS_HOOK_BLOCKED)
                          : t(
                              hook.success
                                ? I18nKey.FEED$DETAILS_OUTCOME_OK
                                : I18nKey.FEED$DETAILS_OUTCOME_ERROR,
                            ),
                        typeof hook.exitCode === "number"
                          ? t(I18nKey.FEED$DETAILS_EXIT_CODE, {
                              code: hook.exitCode,
                            })
                          : null,
                        hook.reason,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Module>
        ) : null}
        {details.condensations?.length ? (
          <Module
            icon={<Layers />}
            title={t(I18nKey.FEED$DETAILS_CONDENSED_TITLE)}
          >
            <ul className="flex flex-col gap-1.5">
              {details.condensations.map((item, index) => (
                <li key={index} className="flex flex-col gap-1">
                  <p className="font-medium">
                    {t(I18nKey.FEED$DETAILS_CONDENSED, { num: item.dropped })}
                  </p>
                  {item.summary ? (
                    <p className="custom-scrollbar max-h-24 overflow-auto whitespace-pre-wrap break-words text-muted">
                      {item.summary}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Module>
        ) : null}
        {footer}
      </div>
      {details.eventId ? (
        <p className="truncate font-mono text-xs text-muted opacity-70">
          {details.eventId}
        </p>
      ) : null}
    </div>
  );
}
