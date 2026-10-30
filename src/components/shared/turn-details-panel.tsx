import React from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  FileDiff,
  GitBranch,
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
  Sigma,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { FeedUpdateDetails, StepUsage } from "#/utils/feed-updates";
import { SecurityRisk } from "#/types/agent-server/core/base/common";
import { cn } from "#/utils/utils";
import { useTurnDetailsStore } from "#/stores/turn-details-store";
import { Chip, type ChipTone } from "./turn-details/chip";
import { CodeBlock, CopyButton } from "./turn-details/code-block";
import { CollapsibleText } from "./turn-details/collapsible-text";
import { DiffBlock } from "./turn-details/diff-block";
import { GitActionList } from "./turn-details/git-actions";
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

/** A small switch that adds the rest of the conversation's usage beside each number. */
function TotalsToggle() {
  const { t } = useTranslation("openhands");
  const on = useTurnDetailsStore((state) => state.showConversationTotals);
  const set = useTurnDetailsStore((state) => state.setShowConversationTotals);
  return (
    <button
      type="button"
      data-testid="turn-details-totals-toggle"
      aria-pressed={on}
      aria-label={t(I18nKey.FEED$DETAILS_TOTALS_TOGGLE)}
      title={t(I18nKey.FEED$DETAILS_TOTALS_TOGGLE)}
      onClick={() => set(!on)}
      className={cn(
        "flex size-5 items-center justify-center rounded-md text-xs transition-colors",
        on
          ? "bg-surface-raised text-contrast"
          : "text-muted hover:text-contrast",
      )}
    >
      <Sigma size={12} aria-hidden />
    </button>
  );
}

/** Local runtimes report no price because they cost nothing per token. */
const LOCAL_MODEL = /^(ollama|ollama_chat|lm_studio|llamafile|llama_cpp)\b/i;

/** A call's cost, always: what the server reported, free for a local model, or not reported. */
function costLabel(usage: StepUsage, t: (key: I18nKey) => string): string {
  if (usage.cost > 0) return `$${usage.cost.toFixed(4)}`;
  if (usage.model && LOCAL_MODEL.test(usage.model)) {
    return t(I18nKey.FEED$DETAILS_COST_LOCAL);
  }
  return t(I18nKey.FEED$DETAILS_COST_NOT_REPORTED);
}

const compact = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

/** What the other model calls in the conversation used: the total less this call. */
function othersOf(total: StepUsage, usage: StepUsage) {
  const rest = (a: number, b: number) => Math.max(0, a - b);
  return {
    promptTokens: rest(total.promptTokens, usage.promptTokens),
    completionTokens: rest(total.completionTokens, usage.completionTokens),
    reasoningTokens: rest(total.reasoningTokens, usage.reasoningTokens),
    cacheReadTokens: rest(total.cacheReadTokens, usage.cacheReadTokens),
    cost: rest(total.cost, usage.cost),
  };
}

function UsageStats({ usage, total }: { usage: StepUsage; total?: StepUsage }) {
  const { t } = useTranslation("openhands");
  const show = useTurnDetailsStore((state) => state.showConversationTotals);
  const others = show && total ? othersOf(total, usage) : null;
  const extra = (value: number | undefined): string | undefined =>
    others && value !== undefined ? `+${compact(value)}` : undefined;
  const stats = [
    {
      label: t(I18nKey.FEED$DETAILS_STAT_INPUT),
      value: formatNumber(usage.promptTokens),
      extra: extra(others?.promptTokens),
    },
    {
      label: t(I18nKey.FEED$DETAILS_STAT_OUTPUT),
      value: formatNumber(usage.completionTokens),
      extra: extra(others?.completionTokens),
    },
    usage.reasoningTokens > 0
      ? {
          label: t(I18nKey.FEED$DETAILS_REASONING),
          value: formatNumber(usage.reasoningTokens),
          extra: extra(others?.reasoningTokens),
        }
      : null,
    usage.cacheReadTokens > 0
      ? {
          label: t(I18nKey.FEED$DETAILS_STAT_CACHED),
          value: formatNumber(usage.cacheReadTokens),
          extra: extra(others?.cacheReadTokens),
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
    {
      label: t(I18nKey.FEED$DETAILS_STAT_COST),
      value: costLabel(usage, t),
      end: true,
      // When this call's own cost was not reported, the conversation's reported
      // total is not "other calls" on top of it, so say what it is.
      extra:
        others && others.cost > 0
          ? usage.cost > 0
            ? `+$${others.cost.toFixed(2)}`
            : t(I18nKey.FEED$DETAILS_COST_CONVERSATION, {
                cost: `$${others.cost.toFixed(2)}`,
              })
          : undefined,
    },
  ].filter(
    (
      stat,
    ): stat is {
      label: string;
      value: string;
      end?: boolean;
      extra?: string;
    } => stat !== null,
  );
  const pct =
    usage.contextWindow > 0 && usage.contextTokens > 0
      ? Math.min(100, (usage.contextTokens / usage.contextWindow) * 100)
      : null;
  return (
    <div className="flex flex-col gap-2">
      <StatGrid
        stats={stats}
        extraTitle={t(I18nKey.FEED$DETAILS_TOTALS_TOGGLE)}
      />
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
  const { outcome, usage, changes } = details;
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
  if (changes?.length) {
    const added = changes.reduce((n, c) => n + c.added, 0);
    const removed = changes.reduce((n, c) => n + c.removed, 0);
    chips.push(
      <Chip
        key="lines"
        testId="turn-details-chip-lines"
        mono
        icon={<FileDiff />}
      >
        <span className="text-success">{`+${added}`}</span>
        <span className="text-danger">{`−${removed}`}</span>
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
  if (usage && usage.promptTokens + usage.completionTokens > 0) {
    chips.push(
      <Chip key="cost" testId="turn-details-chip-cost" icon={<Coins />}>
        {costLabel(usage, t)}
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
        {details.changes?.length ? (
          <Module
            wide
            icon={<FileDiff />}
            title={t(I18nKey.FEED$DETAILS_CHANGES)}
          >
            <div className="flex flex-col gap-2">
              {details.changes.map((change) => (
                <DiffBlock key={change.path} change={change} />
              ))}
            </div>
          </Module>
        ) : null}
        {details.gitActions?.length ? (
          <Module
            wide
            icon={<GitBranch />}
            title={t(I18nKey.FEED$DETAILS_CODE_ACTIONS)}
          >
            <GitActionList actions={details.gitActions} />
          </Module>
        ) : null}
        {details.usage ? (
          <Module
            wide
            icon={<Coins />}
            title={t(I18nKey.FEED$DETAILS_USAGE)}
            actions={details.conversationUsage ? <TotalsToggle /> : undefined}
          >
            <UsageStats
              usage={details.usage}
              total={details.conversationUsage}
            />
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
