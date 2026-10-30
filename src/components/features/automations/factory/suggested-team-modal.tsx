import { useState } from "react";
import { useTranslation } from "react-i18next";
import AgentProfilesService, {
  type AgentProfileSaveInput,
} from "#/api/agent-profiles-service/agent-profiles-service.api";
import { BrandButton } from "#/components/features/settings/brand-button";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import {
  SUGGESTED_TEAM_TEMPLATE_IDS,
  estimateRelativeSpend,
  getOrchestrationTemplate,
  matchLlmProfileForTier,
  type AgentOrchestrationTemplate,
} from "#/constants/agent-orchestration-templates";
import { useSaveAgentProfile } from "#/hooks/mutation/use-save-agent-profile";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useLlmProfiles } from "#/hooks/query/use-llm-profiles";
import { I18nKey } from "#/i18n/declaration";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { FEED_TIER_MODELS } from "#/utils/feed-agent-role";
import { agentIconKey } from "#/utils/feed-icon-keys";

const TEAM = SUGGESTED_TEAM_TEMPLATE_IDS.map(getOrchestrationTemplate).filter(
  (template): template is AgentOrchestrationTemplate => Boolean(template),
);

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-2 py-1 text-sm text-contrast";

interface SuggestedTeamModalProps {
  factoryId: string;
  onClose: () => void;
}

/**
 * Confirms, then creates the plan's starter team (conductor, worker, verifier)
 * as real agent profiles and adds them to the factory. A profile that already
 * has a template's name is added as it is, never overwritten.
 */
export function SuggestedTeamModal({
  factoryId,
  onClose,
}: SuggestedTeamModalProps) {
  const { t } = useTranslation("openhands");
  const save = useSaveAgentProfile();
  const { data: profileData } = useAgentProfiles();
  const { data: llmData } = useLlmProfiles();
  const llmProfiles = llmData?.profiles ?? [];
  const existing = new Set((profileData?.profiles ?? []).map((p) => p.name));
  const addAgent = useFeedFactoriesStore((state) => state.addAgent);
  const setCoordinator = useFeedFactoriesStore((state) => state.setCoordinator);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [asConductor, setAsConductor] = useState(false);
  const [error, setError] = useState("");

  const llmFor = (template: AgentOrchestrationTemplate) =>
    choices[template.id] ??
    matchLlmProfileForTier(template.tier, llmProfiles) ??
    "";
  const toCreate = TEAM.filter((template) => !existing.has(template.name));
  const ready =
    llmProfiles.length > 0 &&
    toCreate.every((template) => Boolean(llmFor(template)));

  const create = async () => {
    setError("");
    const configs = useFeedAgentConfigStore.getState();
    try {
      await Promise.all(
        toCreate.map(async (template) => {
          const profile: AgentProfileSaveInput = {
            agent_kind: "openhands",
            llm_profile_ref: llmFor(template),
            system_message_suffix: template.instructions,
          };
          await save.mutateAsync({ name: template.name, profile });
          configs.setConfig(template.name, {
            role: template.role,
            tier: template.tier,
            description: template.purpose,
            color: template.color,
          });
          const id = (await AgentProfilesService.getProfile(template.name))
            .profile.id;
          if (id) {
            useFeedIconsStore
              .getState()
              .setIcon(agentIconKey(id), { lucide_icon: template.icon });
          }
        }),
      );
    } catch {
      setError(t(I18nKey.FACTORY$SUGGESTED_TEAM_FAILED));
      return;
    }
    TEAM.forEach((template) => {
      if (existing.has(template.name) && !configs.configs[template.name]) {
        configs.setConfig(template.name, {
          role: template.role,
          tier: template.tier,
        });
      }
      addAgent(factoryId, template.name);
    });
    const conductor = TEAM.find((template) => template.role === "conductor");
    if (asConductor && conductor) setCoordinator(factoryId, conductor.name);
    onClose();
  };

  const conductor = TEAM.find((template) => template.role === "conductor");

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="factory-suggested-team-modal"
        width="lg"
        className="max-h-[85vh] items-stretch overflow-y-auto border border-border"
      >
        <BaseModalTitle title={t(I18nKey.FACTORY$SUGGESTED_TEAM_TITLE)} />
        <p className="text-sm text-muted">
          {t(I18nKey.FACTORY$SUGGESTED_TEAM_BODY)}
        </p>
        <ul className="flex flex-col gap-2">
          {TEAM.map((template) => {
            const family = FEED_TIER_MODELS[template.tier];
            const isExisting = existing.has(template.name);
            return (
              <li
                key={template.id}
                data-testid="factory-suggested-team-member"
                data-template={template.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="text-sm text-contrast">
                  {template.name}
                  <span className="text-muted">
                    {` · T${template.tier} ${family}`}
                  </span>
                </span>
                {isExisting ? (
                  <span className="text-xs text-muted">
                    {t(I18nKey.FACTORY$SUGGESTED_TEAM_EXISTING)}
                  </span>
                ) : (
                  <label className="flex items-center gap-2 text-xs text-muted">
                    {t(I18nKey.AGENTS$FIELD_LLM)}
                    <select
                      data-testid="factory-suggested-team-llm"
                      value={llmFor(template)}
                      onChange={(event) =>
                        setChoices((current) => ({
                          ...current,
                          [template.id]: event.target.value,
                        }))
                      }
                      className={FIELD_CLASS}
                    >
                      <option value="">
                        {t(I18nKey.AGENTS$FIELD_LLM_CHOOSE)}
                      </option>
                      {llmProfiles.map((profile) => (
                        <option key={profile.name} value={profile.name}>
                          {profile.model
                            ? `${profile.name} · ${profile.model}`
                            : profile.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </li>
            );
          })}
        </ul>
        <p
          data-testid="factory-suggested-team-spend"
          className="text-xs text-muted"
        >
          {t(I18nKey.FACTORY$SUGGESTED_TEAM_SPEND, {
            units: estimateRelativeSpend(TEAM),
          })}
        </p>
        {conductor ? (
          <label className="flex items-center gap-2 text-sm text-contrast">
            <input
              type="checkbox"
              data-testid="factory-suggested-team-conductor"
              checked={asConductor}
              onChange={(event) => setAsConductor(event.target.checked)}
            />
            {t(I18nKey.FACTORY$SUGGESTED_TEAM_CONDUCTOR, {
              name: conductor.name,
            })}
          </label>
        ) : null}
        {llmProfiles.length === 0 ? (
          <p role="status" className="text-xs text-danger">
            {t(I18nKey.FACTORY$TEMPLATE_NO_LLM)}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <BrandButton
            type="button"
            variant="secondary"
            testId="factory-suggested-team-cancel"
            onClick={onClose}
          >
            {t(I18nKey.BUTTON$CANCEL)}
          </BrandButton>
          <BrandButton
            type="button"
            variant="primary"
            testId="factory-suggested-team-create"
            isDisabled={!ready || save.isPending}
            onClick={() => void create()}
          >
            {t(I18nKey.FACTORY$SUGGESTED_TEAM_CREATE)}
          </BrandButton>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}
