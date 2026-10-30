import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Code,
  Compass,
  Cpu,
  Crosshair,
  Globe,
  Map as MapIcon,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import { ROLE_LABEL } from "#/components/features/agents/new-agent-modal";
import {
  AGENT_ORCHESTRATION_TEMPLATES,
  ORCHESTRATION_GUIDE_SOURCE,
  matchLlmProfileForTier,
  spendLevelForTier,
  type AgentOrchestrationTemplate,
  type OrchestrationSpendLevel,
} from "#/constants/agent-orchestration-templates";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useLlmProfiles } from "#/hooks/query/use-llm-profiles";
import { I18nKey } from "#/i18n/declaration";
import { FEED_AGENT_COLORS } from "#/utils/feed-agent-identity";
import { FEED_TIER_MODELS } from "#/utils/feed-agent-role";

const ICONS: Record<string, LucideIcon> = {
  Code,
  Compass,
  Cpu,
  Crosshair,
  Globe,
  Map: MapIcon,
  Sparkles,
  Target,
  Zap,
};

const SPEND_LABEL: Record<OrchestrationSpendLevel, I18nKey> = {
  low: I18nKey.FACTORY$SPEND_LOW,
  medium: I18nKey.FACTORY$SPEND_MEDIUM,
  high: I18nKey.FACTORY$SPEND_HIGH,
};

export interface UseTemplateRequest {
  template: AgentOrchestrationTemplate;
  /** Profile name to prefill; differs from the template's when it was taken. */
  name: string;
  /** The person's LLM profile that matches the tier, or empty. */
  llmRef: string;
  asConductor: boolean;
}

interface PanelProps {
  /** Names of the agents already in this factory. */
  memberNames: ReadonlySet<string>;
  onUse: (request: UseTemplateRequest) => void;
  onAddExisting: (template: AgentOrchestrationTemplate) => void;
  onSuggestTeam: () => void;
}

function freeName(base: string, taken: ReadonlySet<string>): string {
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * The orchestration templates: always listed, whether or not the factory has
 * other agents left to add. Owns no state beyond the form choices; creating a
 * profile and joining the factory happen in the caller.
 */
export function OrchestrationTemplatesPanel({
  memberNames,
  onUse,
  onAddExisting,
  onSuggestTeam,
}: PanelProps) {
  const { t } = useTranslation("openhands");
  const { data: profileData } = useAgentProfiles();
  const { data: llmData } = useLlmProfiles();
  const llmProfiles = llmData?.profiles ?? [];
  const existing = new Set((profileData?.profiles ?? []).map((p) => p.name));
  const [asConductor, setAsConductor] = useState(false);
  const noLlm = llmProfiles.length === 0;

  return (
    <section
      data-testid="factory-templates"
      aria-labelledby="factory-templates-title"
      className="flex w-full flex-col gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="factory-templates-title"
          className="text-sm font-semibold text-contrast"
        >
          {t(I18nKey.FACTORY$TEMPLATES_TITLE)}
        </h3>
        <BrandButton
          type="button"
          variant="secondary"
          testId="factory-suggested-team"
          isDisabled={noLlm}
          onClick={onSuggestTeam}
        >
          {t(I18nKey.FACTORY$SUGGESTED_TEAM)}
        </BrandButton>
      </div>
      <p className="text-xs text-muted">{t(I18nKey.FACTORY$TEMPLATES_INTRO)}</p>
      <div
        data-testid="factory-cost-guide"
        className="rounded-lg border border-border bg-surface px-3 py-2"
      >
        <p className="text-xs font-medium text-contrast">
          {t(I18nKey.FACTORY$COST_GUIDE_TITLE)}
        </p>
        <p className="mt-1 text-xs text-muted">
          {t(I18nKey.FACTORY$COST_GUIDE_BODY)}
        </p>
        <p className="mt-1 text-xs text-muted">
          {t(I18nKey.FACTORY$TEMPLATE_SOURCE, {
            source: ORCHESTRATION_GUIDE_SOURCE,
          })}
        </p>
      </div>
      <p className="text-xs text-muted">
        {t(I18nKey.FACTORY$TEMPLATES_RECOMMENDED)}
      </p>
      {noLlm ? (
        <p
          id="factory-templates-no-llm"
          role="status"
          className="text-xs text-danger"
        >
          {t(I18nKey.FACTORY$TEMPLATE_NO_LLM)}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {AGENT_ORCHESTRATION_TEMPLATES.map((template) => {
          const Icon = ICONS[template.icon] ?? Compass;
          const family = FEED_TIER_MODELS[template.tier];
          const llmRef = matchLlmProfileForTier(template.tier, llmProfiles);
          const taken = existing.has(template.name);
          const member = memberNames.has(template.name);
          const isConductor = template.role === "conductor";
          return (
            <li
              key={template.id}
              data-testid="factory-template"
              data-template={template.id}
              className="flex gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <span className="size-8 shrink-0">
                <FeedIconTile className={FEED_AGENT_COLORS[template.color]}>
                  <Icon size={16} aria-hidden />
                </FeedIconTile>
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm text-contrast">
                  <span className="font-medium">{template.name}</span>
                  <span className="text-muted">
                    {` · ${t(ROLE_LABEL[template.role])}`}
                  </span>
                </p>
                <p className="text-xs text-muted">{template.purpose}</p>
                <p className="text-xs text-muted">
                  {[
                    t(I18nKey.FACTORY$TEMPLATE_TIER, {
                      tier: template.tier,
                      family,
                    }),
                    t(I18nKey.FACTORY$TEMPLATE_SPEND, {
                      level: t(SPEND_LABEL[spendLevelForTier(template.tier)]),
                    }),
                    template.turnCap === null
                      ? t(I18nKey.FACTORY$TEMPLATE_NO_TURN_CAP)
                      : t(I18nKey.FACTORY$TEMPLATE_TURN_CAP, {
                          count: template.turnCap,
                        }),
                  ].join(" · ")}
                </p>
                <p className="line-clamp-2 text-xs text-muted">
                  {template.instructions}
                </p>
                <p className="text-xs text-muted">
                  {t(I18nKey.FACTORY$TEMPLATE_SOURCE, {
                    source: template.source,
                  })}
                  {template.proposal
                    ? ` · ${t(I18nKey.FACTORY$TEMPLATE_PROPOSAL)}`
                    : ""}
                </p>
                {!noLlm && !llmRef ? (
                  <p className="text-xs text-muted">
                    {t(I18nKey.FACTORY$TEMPLATE_NO_MATCH, { family })}
                  </p>
                ) : null}
                {taken ? (
                  <p className="text-xs text-muted">
                    {t(I18nKey.FACTORY$TEMPLATE_EXISTS, {
                      name: template.name,
                    })}
                  </p>
                ) : null}
                {isConductor && !taken ? (
                  <label className="flex items-center gap-2 text-xs text-contrast">
                    <input
                      type="checkbox"
                      data-testid="factory-template-conductor"
                      checked={asConductor}
                      onChange={(event) => setAsConductor(event.target.checked)}
                    />
                    {t(I18nKey.FACTORY$TEMPLATE_AS_CONDUCTOR)}
                  </label>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end justify-center gap-1">
                {taken ? (
                  <>
                    <BrandButton
                      type="button"
                      variant="secondary"
                      testId="factory-template-add-existing"
                      isDisabled={member}
                      onClick={() => onAddExisting(template)}
                    >
                      {member
                        ? t(I18nKey.FACTORY$TEMPLATE_IN_FACTORY)
                        : t(I18nKey.FACTORY$TEMPLATE_ADD_EXISTING)}
                    </BrandButton>
                    <BrandButton
                      type="button"
                      variant="secondary"
                      testId="factory-template-create-new"
                      isDisabled={noLlm}
                      onClick={() =>
                        onUse({
                          template,
                          name: freeName(template.name, existing),
                          llmRef: llmRef ?? "",
                          asConductor: false,
                        })
                      }
                    >
                      {t(I18nKey.FACTORY$TEMPLATE_CREATE_NEW)}
                    </BrandButton>
                  </>
                ) : (
                  <BrandButton
                    type="button"
                    variant="primary"
                    testId="factory-template-use"
                    isDisabled={noLlm}
                    onClick={() =>
                      onUse({
                        template,
                        name: template.name,
                        llmRef: llmRef ?? "",
                        asConductor: isConductor && asConductor,
                      })
                    }
                  >
                    {t(I18nKey.FACTORY$TEMPLATE_USE)}
                  </BrandButton>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
