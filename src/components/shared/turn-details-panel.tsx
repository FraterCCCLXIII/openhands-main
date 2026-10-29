import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { FeedUpdateDetails } from "#/utils/feed-updates";

/** What an agent was thinking and how a step turned out. */
export function TurnDetailsPanel({ details }: { details: FeedUpdateDetails }) {
  const { t } = useTranslation("openhands");
  const { outcome } = details;
  return (
    <div
      data-testid="turn-details"
      className="mt-1.5 flex flex-col gap-1.5 border-l-2 border-border pl-2 text-xs text-muted"
    >
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
      {details.skills?.length ? (
        <p>
          <span className="font-semibold">
            {t(I18nKey.FEED$DETAILS_SKILLS)}
          </span>
          {` ${details.skills.join(", ")}`}
        </p>
      ) : null}
      {details.risk || outcome ? (
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
        </p>
      ) : null}
      {details.eventId ? (
        <p className="font-mono text-[10px] opacity-70">{details.eventId}</p>
      ) : null}
    </div>
  );
}
