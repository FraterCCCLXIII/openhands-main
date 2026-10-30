import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import type { FeedFactory } from "#/utils/feed-team-demo";
import { cn } from "#/utils/utils";
import { buildActivity } from "./pipeline-activity";
import { ActivityDetails } from "./pipeline-activity-ui";
import { HumanRolesPanel } from "./human-roles-panel";
import { pipelineCounts } from "./pipeline-counts";
import {
  DEFAULT_PIPELINE_TEMPLATE_ID,
  PIPELINE_TEMPLATES,
  type PipelineStepKind,
} from "./pipeline-templates";
import type { FactoryData } from "./use-factory-data";

// The node map brings React Flow with it, so it loads only on this page.
const PipelineMap = lazy(() =>
  import("./pipeline-map").then((module) => ({ default: module.PipelineMap })),
);

const KIND_LABEL: Record<PipelineStepKind, I18nKey> = {
  human: I18nKey.FACTORY$STEP_HUMAN,
  auto: I18nKey.FACTORY$STEP_AUTO,
  system: I18nKey.FACTORY$STEP_SYSTEM,
};

interface PipelinePageProps {
  factory: FeedFactory;
  data: FactoryData;
}

/**
 * A factory's pipeline: templates in a list on the left, and the whole
 * pipeline of the one you pick as a node map on the right.
 */
export function PipelinePage({ factory, data }: PipelinePageProps) {
  const { t } = useTranslation("openhands");
  const applied = useFeedFactoriesStore((state) => state.templates[factory.id]);
  const setTemplate = useFeedFactoriesStore((state) => state.setTemplate);
  const [templateId, setTemplateId] = useState(
    applied ?? DEFAULT_PIPELINE_TEMPLATE_ID,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const template =
    PIPELINE_TEMPLATES.find((candidate) => candidate.id === templateId) ??
    PIPELINE_TEMPLATES[0];
  const counts = useMemo(
    () => pipelineCounts(data.conversations),
    [data.conversations],
  );
  const [sample, setSample] = useState(true);
  const activity = useMemo(
    () => (sample ? buildActivity(template.steps, factory.id) : undefined),
    [sample, template, factory.id],
  );
  const selected = template.steps.find((step) => step.id === selectedId);
  const inUse = applied === template.id;

  return (
    <div
      data-testid="factory-pipeline"
      className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <aside className="flex flex-col gap-2">
        <h2 className="px-1 text-base font-semibold text-foreground">
          {t(I18nKey.FACTORY$TEMPLATES)}
        </h2>
        <ul className="flex flex-col gap-1.5">
          {PIPELINE_TEMPLATES.map((candidate) => {
            const isSelected = candidate.id === template.id;
            return (
              <li key={candidate.id}>
                <button
                  type="button"
                  data-testid={`pipeline-template-${candidate.id}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setTemplateId(candidate.id);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left",
                    isSelected
                      ? "border-focus bg-surface-raised"
                      : "border-border hover:bg-surface-raised",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {candidate.name}
                    </span>
                    {applied === candidate.id ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <Check size={12} aria-hidden />
                        {t(I18nKey.FACTORY$TEMPLATE_IN_USE)}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted">
                    {candidate.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <BrandButton
          type="button"
          variant="primary"
          testId="pipeline-use-template"
          isDisabled={inUse}
          onClick={() => setTemplate(factory.id, template.id)}
        >
          {inUse
            ? t(I18nKey.FACTORY$TEMPLATE_IN_USE)
            : t(I18nKey.FACTORY$USE_TEMPLATE)}
        </BrandButton>
      </aside>

      <section className="flex min-w-0 flex-col gap-3">
        <label
          className="flex items-center gap-2 px-1 text-xs text-muted"
          title={t(I18nKey.FACTORY$ACTIVITY_SAMPLE_HINT)}
        >
          <input
            type="checkbox"
            data-testid="pipeline-sample-toggle"
            checked={sample}
            onChange={(event) => setSample(event.target.checked)}
          />
          {t(I18nKey.FACTORY$ACTIVITY_SAMPLE)}
          <span>{`· ${t(I18nKey.FACTORY$ACTIVITY_SAMPLE_HINT)}`}</span>
        </label>
        <div
          data-testid="pipeline-map"
          className="h-[min(48rem,calc(100vh-15rem))] min-h-[26rem] overflow-hidden rounded-xl border border-border bg-surface"
        >
          <Suspense
            fallback={
              <p className="p-4 text-sm text-muted">
                {t(I18nKey.FACTORY$PIPELINE_LOADING)}
              </p>
            }
          >
            <PipelineMap
              template={template}
              counts={counts}
              activity={activity}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Suspense>
        </div>
        <HumanRolesPanel factory={factory} template={template} />
        <div
          data-testid="pipeline-inspector"
          className="rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm"
        >
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {selected.title}
                </span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                  {t(KIND_LABEL[selected.kind])}
                </span>
              </div>
              {selected.lines.map((line) => (
                <p key={line} className="mt-1 text-muted">
                  {line}
                </p>
              ))}
              {activity?.[selected.id] ? (
                <ActivityDetails activity={activity[selected.id]} sample />
              ) : null}
            </>
          ) : (
            <p className="text-muted">
              {t(I18nKey.FACTORY$PIPELINE_SELECT_STEP)}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
