import type React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { FeedUpdateDetails, StepUsage } from "#/utils/feed-updates";

const formatSeconds = (ms: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "second",
    unitDisplay: "narrow",
    maximumFractionDigits: 1,
  }).format(ms / 1000);

function UsageLine({ usage }: { usage: StepUsage }) {
  const { t } = useTranslation("openhands");
  const n = (value: number) => new Intl.NumberFormat().format(value);
  const parts = [
    usage.model,
    t(I18nKey.FEED$DETAILS_TOKENS_IN, { num: n(usage.promptTokens) }),
    t(I18nKey.FEED$DETAILS_TOKENS_OUT, { num: n(usage.completionTokens) }),
    usage.cacheReadTokens > 0
      ? t(I18nKey.FEED$DETAILS_TOKENS_CACHED, { num: n(usage.cacheReadTokens) })
      : null,
    usage.reasoningTokens > 0
      ? t(I18nKey.FEED$DETAILS_TOKENS_REASONING, {
          num: n(usage.reasoningTokens),
        })
      : null,
    usage.cost > 0 ? `$${usage.cost.toFixed(4)}` : null,
    usage.contextTokens > 0
      ? t(I18nKey.FEED$DETAILS_CONTEXT, {
          used: n(usage.contextTokens),
          limit: usage.contextWindow > 0 ? ` / ${n(usage.contextWindow)}` : "",
        })
      : null,
  ].filter(Boolean);
  return <p className="break-words">{parts.join(" · ")}</p>;
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
  const { outcome } = details;
  return (
    <div
      data-testid="turn-details"
      className="mt-1.5 flex flex-col gap-1.5 border-l-2 border-border pl-2 text-xs text-muted"
    >
      {details.promptedBy ? (
        <div>
          <p className="font-semibold">{t(I18nKey.FEED$DETAILS_PROMPTED_BY)}</p>
          <p className="custom-scrollbar max-h-24 overflow-auto whitespace-pre-wrap break-words">
            {details.promptedBy}
          </p>
        </div>
      ) : null}
      {details.reasoning ? (
        <div>
          <p className="font-semibold">{t(I18nKey.FEED$DETAILS_REASONING)}</p>
          <p className="whitespace-pre-wrap break-words">{details.reasoning}</p>
        </div>
      ) : details.redacted ? (
        <p>{t(I18nKey.FEED$DETAILS_REASONING_REDACTED)}</p>
      ) : null}
      {details.thought ? (
        <div>
          <p className="font-semibold">{t(I18nKey.FEED$DETAILS_THOUGHT)}</p>
          <p className="whitespace-pre-wrap break-words">{details.thought}</p>
        </div>
      ) : null}
      {details.subagent ? (
        <div>
          <p className="font-semibold">
            {t(I18nKey.FEED$DETAILS_SUBAGENT, { type: details.subagent.type })}
          </p>
          <p className="break-words">
            {[details.subagent.description, details.subagent.status]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ) : null}
      {details.args?.length ? (
        <div>
          <p className="font-semibold">{t(I18nKey.FEED$DETAILS_ARGUMENTS)}</p>
          <dl className="custom-scrollbar max-h-32 overflow-auto font-mono text-[11px]">
            {details.args.map((arg) => (
              <div key={arg.key} className="flex gap-1.5">
                <dt className="flex-shrink-0 opacity-70">{arg.key}:</dt>
                <dd className="whitespace-pre-wrap break-all">{arg.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      {details.result ? (
        <div>
          <p className="font-semibold">{t(I18nKey.FEED$DETAILS_RESULT)}</p>
          <pre className="custom-scrollbar max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]">
            {details.result}
          </pre>
        </div>
      ) : null}
      {details.evidence?.length ? (
        <div>
          <p className="font-semibold">{t(I18nKey.FEED$DETAILS_BASED_ON)}</p>
          <ul className="flex flex-col gap-1.5">
            {details.evidence.map((item, index) => (
              <li key={index}>
                <p>{item.label}</p>
                <pre className="custom-scrollbar max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]">
                  {item.result}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {details.hooks?.length ? (
        <div>
          <p className="font-semibold">{t(I18nKey.FEED$DETAILS_HOOKS)}</p>
          <ul>
            {details.hooks.map((hook, index) => (
              <li
                key={index}
                className={hook.blocked || !hook.success ? "text-danger" : ""}
              >
                {[
                  hook.type,
                  hook.tool,
                  hook.blocked
                    ? t(I18nKey.FEED$DETAILS_HOOK_BLOCKED)
                    : t(
                        hook.success
                          ? I18nKey.FEED$DETAILS_OUTCOME_OK
                          : I18nKey.FEED$DETAILS_OUTCOME_ERROR,
                      ),
                  typeof hook.exitCode === "number"
                    ? t(I18nKey.FEED$DETAILS_EXIT_CODE, { code: hook.exitCode })
                    : null,
                  hook.reason,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {details.condensations?.length ? (
        <div>
          {details.condensations.map((item, index) => (
            <div key={index}>
              <p className="font-semibold">
                {t(I18nKey.FEED$DETAILS_CONDENSED, { num: item.dropped })}
              </p>
              {item.summary ? (
                <p className="custom-scrollbar max-h-24 overflow-auto whitespace-pre-wrap break-words">
                  {item.summary}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {details.usage ? (
        <div>
          <p className="font-semibold">{t(I18nKey.FEED$DETAILS_USAGE)}</p>
          <UsageLine usage={details.usage} />
        </div>
      ) : null}
      {details.skills?.length ? (
        <p>
          <span className="font-semibold">
            {t(I18nKey.FEED$DETAILS_SKILLS)}
          </span>
          {` ${details.skills.join(", ")}`}
        </p>
      ) : null}
      {details.risk || outcome || details.durationMs !== undefined ? (
        <p className="flex flex-wrap gap-x-3">
          {details.risk ? (
            <span>{t(I18nKey.FEED$DETAILS_RISK, { level: details.risk })}</span>
          ) : null}
          {outcome ? (
            <span className={outcome.isError ? "text-danger" : undefined}>
              {outcome.rejectionReason
                ? t(I18nKey.FEED$DETAILS_REJECTED, {
                    reason: outcome.rejectionReason,
                  })
                : t(
                    outcome.isError
                      ? I18nKey.FEED$DETAILS_OUTCOME_ERROR
                      : I18nKey.FEED$DETAILS_OUTCOME_OK,
                  )}
              {typeof outcome.exitCode === "number"
                ? ` · ${t(I18nKey.FEED$DETAILS_EXIT_CODE, { code: outcome.exitCode })}`
                : ""}
            </span>
          ) : null}
          {details.durationMs !== undefined ? (
            <span>
              {t(I18nKey.FEED$DETAILS_DURATION, {
                time: formatSeconds(details.durationMs),
              })}
            </span>
          ) : null}
        </p>
      ) : null}
      {footer}
      {details.eventId ? (
        <p className="font-mono text-[10px] opacity-70">{details.eventId}</p>
      ) : null}
    </div>
  );
}
