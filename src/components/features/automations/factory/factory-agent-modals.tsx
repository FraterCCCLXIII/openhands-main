import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Cpu, Palette, Puzzle, Sparkles, type LucideIcon } from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { usePlugins } from "#/hooks/query/use-plugins";
import { useSkillCatalog } from "#/hooks/query/use-skill-catalog";
import {
  useFeedAgentConfigStore,
  type FeedAgentConfig,
} from "#/stores/feed-agent-config-store";
import { ModalCloseButton } from "#/components/shared/modals/modal-close-button";
import {
  applyAgentConfig,
  FEED_AGENT_ROLE_KEYS,
  FEED_TIER_MODELS,
  getDemoAgentRole,
  type FeedAgentRoleKey,
  type FeedAgentTier,
} from "#/utils/feed-agent-role";
import { cn } from "#/utils/utils";
import { IconAppearancePanel } from "#/ui/icon-appearance-picker";
import { useKnownFeedAgents } from "#/hooks/use-known-feed-agents";
import { agentIconKey } from "#/utils/feed-icon-keys";
import { AgentProfileModal } from "#/components/features/agents/new-agent-modal";
import type { AgentOrchestrationTemplate } from "#/constants/agent-orchestration-templates";
import type { Roster, RosterAgent } from "./factory-routing-context";
import {
  OrchestrationTemplatesPanel,
  type UseTemplateRequest,
} from "./orchestration-templates-panel";
import { SuggestedTeamModal } from "./suggested-team-modal";

interface AddAgentModalProps {
  factoryId: string;
  roster: Roster;
  onClose: () => void;
}

type AddView =
  | { kind: "list" }
  | { kind: "team" }
  | ({ kind: "profile" } & UseTemplateRequest);

/**
 * Picks personas that are not yet in the factory and adds them to its roster.
 * The orchestration templates are always listed below them, so the dialog is
 * never a dead end when every existing agent is already a member.
 */
export function FactoryAddAgentModal({
  factoryId,
  roster,
  onClose,
}: AddAgentModalProps) {
  const { t } = useTranslation("openhands");
  const addAgent = useFeedFactoriesStore((state) => state.addAgent);
  const setCoordinator = useFeedFactoriesStore((state) => state.setCoordinator);
  const [view, setView] = useState<AddView>({ kind: "list" });
  const taken = new Set([
    roster.coordinator.agent.name,
    ...roster.others.map(({ agent }) => agent.name),
  ]);
  const known = useKnownFeedAgents();
  const available = known.filter(({ name }) => !taken.has(name));

  if (view.kind === "team") {
    return (
      <SuggestedTeamModal
        factoryId={factoryId}
        onClose={() => {
          setView({ kind: "list" });
          onClose();
        }}
      />
    );
  }

  if (view.kind === "profile") {
    const { template } = view;
    return (
      <AgentProfileModal
        prefill={{
          name: view.name,
          llmRef: view.llmRef,
          instructions: template.instructions,
          role: template.role,
          description: template.purpose,
          color: template.color,
          icon: { lucide_icon: template.icon },
        }}
        onCreated={(name) => {
          useFeedAgentConfigStore
            .getState()
            .setConfig(name, { tier: template.tier });
          addAgent(factoryId, name);
          if (view.asConductor) setCoordinator(factoryId, name);
          onClose();
        }}
        onClose={() => setView({ kind: "list" })}
      />
    );
  }

  const addExisting = (template: AgentOrchestrationTemplate) => {
    const configs = useFeedAgentConfigStore.getState();
    if (!configs.configs[template.name]) {
      configs.setConfig(template.name, {
        role: template.role,
        tier: template.tier,
      });
    }
    addAgent(factoryId, template.name);
    onClose();
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="factory-add-agent-modal"
        width="xl"
        className="max-h-[85vh] items-start border border-border"
      >
        <BaseModalTitle title={t(I18nKey.FACTORY$ADD_AGENT)} />
        <div className="custom-scrollbar flex min-h-0 w-full flex-col gap-4 overflow-y-auto">
          {available.length > 0 ? (
            <div className="flex w-full flex-col gap-1">
              {available.map((agent) => (
                <button
                  key={agent.name}
                  type="button"
                  data-testid="factory-add-agent-option"
                  data-agent={agent.name}
                  onClick={() => {
                    addAgent(factoryId, agent.name);
                    onClose();
                  }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-raised"
                >
                  <span className="size-8 shrink-0">
                    <FeedIconTile className={agent.className}>
                      <agent.Icon size={16} />
                    </FeedIconTile>
                  </span>
                  <span className="text-sm text-foreground">{agent.name}</span>
                </button>
              ))}
            </div>
          ) : null}
          <OrchestrationTemplatesPanel
            memberNames={taken}
            onUse={(request) => setView({ kind: "profile", ...request })}
            onAddExisting={addExisting}
            onSuggestTeam={() => setView({ kind: "team" })}
          />
        </div>
        <div className="flex w-full justify-end">
          <BrandButton
            type="button"
            variant="secondary"
            testId="factory-add-agent-close"
            onClick={onClose}
          >
            {t(I18nKey.BUTTON$CLOSE)}
          </BrandButton>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}

type EditTab = "general" | "skills" | "plugins" | "appearance";

const TABS: { key: EditTab; label: I18nKey; Icon: LucideIcon }[] = [
  { key: "general", label: I18nKey.FACTORY$AGENT_TAB_GENERAL, Icon: Cpu },
  { key: "skills", label: I18nKey.FACTORY$AGENT_TAB_SKILLS, Icon: Sparkles },
  { key: "plugins", label: I18nKey.FACTORY$AGENT_TAB_PLUGINS, Icon: Puzzle },
  {
    key: "appearance",
    label: I18nKey.FACTORY$AGENT_TAB_APPEARANCE,
    Icon: Palette,
  },
];

const ROLE_LABEL: Record<FeedAgentRoleKey, I18nKey> = {
  conductor: I18nKey.FEED$AGENT_ROLE_CONDUCTOR,
  dispatcher: I18nKey.FEED$AGENT_ROLE_DISPATCHER,
  worker: I18nKey.FEED$AGENT_ROLE_WORKER,
  verifier: I18nKey.FEED$AGENT_ROLE_VERIFIER,
  janitor: I18nKey.FEED$AGENT_ROLE_JANITOR,
  scout: I18nKey.FEED$AGENT_ROLE_SCOUT,
};

const TIERS: FeedAgentTier[] = [1, 2, 3, 4];

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-contrast outline-none focus:border-focus";

function PickList({
  options,
  selected,
  onChange,
  emptyLabel,
  testId,
}: {
  options: { name: string; description?: string | null }[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyLabel: string;
  testId: string;
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }
  return (
    <ul data-testid={testId} className="flex flex-col gap-1">
      {options.map(({ name, description }) => {
        const on = selected.includes(name);
        return (
          <li key={name}>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-raised">
              <input
                type="checkbox"
                checked={on}
                onChange={() =>
                  onChange(
                    on
                      ? selected.filter((n) => n !== name)
                      : [...selected, name],
                  )
                }
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm text-contrast">
                  {name}
                </span>
                {description ? (
                  <span className="block truncate text-xs text-muted">
                    {description}
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

interface EditAgentModalProps {
  factoryId: string;
  entry: RosterAgent;
  isCoordinator: boolean;
  /** Whether the agent was added by hand (only those can be removed). */
  isAdded: boolean;
  onClose: () => void;
}

/**
 * Edits an agent: its role and model, skills, plugins and icon, plus making it
 * the coordinator or removing it from the factory.
 */
export function FactoryEditAgentModal({
  factoryId,
  entry,
  isCoordinator,
  isAdded,
  onClose,
}: EditAgentModalProps) {
  const { t } = useTranslation("openhands");
  const { agent, conversations } = entry;
  const [tab, setTab] = useState<EditTab>("general");
  const iconKey = agentIconKey(agent.profileId ?? `demo:${agent.name}`);
  const savedIcon = useFeedIconsStore((state) => state.icons[iconKey]);
  const setIcon = useFeedIconsStore((state) => state.setIcon);
  const savedConfig = useFeedAgentConfigStore(
    (state) => state.configs[agent.name],
  );
  const saveConfig = useFeedAgentConfigStore((state) => state.setConfig);
  // Edits stay in a draft until Save; Cancel and the corner X drop them.
  const [config, setDraft] = useState<FeedAgentConfig>(savedConfig ?? {});
  const [value, setIconDraft] = useState(savedIcon ?? {});
  const setConfig = (_name: string, patch: FeedAgentConfig) =>
    setDraft((current) => ({ ...current, ...patch }));
  const save = () => {
    saveConfig(agent.name, config);
    setIcon(iconKey, value);
    onClose();
  };
  const setCoordinator = useFeedFactoriesStore((state) => state.setCoordinator);
  const removeAgent = useFeedFactoriesStore((state) => state.removeAgent);
  const { data: skills = [] } = useSkillCatalog();
  const { data: plugins = [] } = usePlugins();
  const role = applyAgentConfig(getDemoAgentRole(agent), config);
  const inUse = conversations > 0;
  const canRemove = isAdded && !isCoordinator && !inUse;

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="factory-edit-agent-modal"
        width="xl"
        className="relative max-h-[85vh] items-stretch border border-border"
      >
        <ModalCloseButton testId="factory-edit-agent-close" onClose={onClose} />
        <div className="flex flex-col gap-1">
          <BaseModalTitle title={t(I18nKey.FACTORY$EDIT_AGENT)} />
          <p className="text-sm text-muted">{agent.name}</p>
        </div>
        <div
          className="flex min-h-0 w-full flex-1 gap-6"
          onClick={(event) => event.stopPropagation()}
        >
          <nav className="flex w-40 shrink-0 flex-col gap-0.5 self-start">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                data-testid={`factory-agent-tab-${key}`}
                aria-current={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                  tab === key
                    ? "bg-surface-raised text-contrast"
                    : "text-muted hover:text-contrast",
                )}
              >
                <Icon size={14} aria-hidden />
                {t(label)}
              </button>
            ))}
          </nav>
          <div className="custom-scrollbar flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            {tab === "general" ? (
              <>
                <label className="flex flex-col gap-1 text-sm text-muted">
                  {t(I18nKey.FACTORY$AGENT_ROLE)}
                  <select
                    data-testid="factory-agent-role"
                    value={role.role}
                    onChange={(event) =>
                      setConfig(agent.name, {
                        role: event.target.value as FeedAgentRoleKey,
                      })
                    }
                    className={FIELD_CLASS}
                  >
                    {FEED_AGENT_ROLE_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(ROLE_LABEL[key])}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-muted">
                  {t(I18nKey.FACTORY$AGENT_MODEL)}
                  <select
                    data-testid="factory-agent-model"
                    value={role.tier ?? ""}
                    onChange={(event) =>
                      setConfig(agent.name, {
                        tier: event.target.value
                          ? (Number(event.target.value) as FeedAgentTier)
                          : null,
                      })
                    }
                    className={FIELD_CLASS}
                  >
                    <option value="">
                      {t(I18nKey.FACTORY$AGENT_NO_MODEL)}
                    </option>
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {`T${tier} ${FEED_TIER_MODELS[tier]}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-muted">
                  {t(I18nKey.FACTORY$AGENT_INSTRUCTIONS)}
                  <textarea
                    data-testid="factory-agent-instructions"
                    rows={4}
                    value={config?.instructions ?? ""}
                    onChange={(event) =>
                      setConfig(agent.name, {
                        instructions: event.target.value,
                      })
                    }
                    className={cn(FIELD_CLASS, "resize-none")}
                  />
                </label>
              </>
            ) : null}
            {tab === "skills" ? (
              <PickList
                testId="factory-agent-skills"
                options={skills}
                selected={config?.skills ?? []}
                onChange={(next) => setConfig(agent.name, { skills: next })}
                emptyLabel={t(I18nKey.FACTORY$AGENT_NO_SKILLS)}
              />
            ) : null}
            {tab === "plugins" ? (
              <PickList
                testId="factory-agent-plugins"
                options={plugins}
                selected={config?.plugins ?? []}
                onChange={(next) => setConfig(agent.name, { plugins: next })}
                emptyLabel={t(I18nKey.FACTORY$AGENT_NO_PLUGINS)}
              />
            ) : null}
            {tab === "appearance" ? (
              <IconAppearancePanel
                value={value ?? {}}
                onChange={setIconDraft}
              />
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {!isCoordinator ? (
              <BrandButton
                type="button"
                variant="secondary"
                testId="factory-make-coordinator"
                onClick={() => {
                  setCoordinator(factoryId, agent.name);
                  onClose();
                }}
              >
                {t(I18nKey.FACTORY$MAKE_COORDINATOR)}
              </BrandButton>
            ) : null}
            {isAdded && !isCoordinator ? (
              <BrandButton
                type="button"
                variant="secondary"
                testId="factory-remove-agent"
                isDisabled={!canRemove}
                onClick={() => {
                  removeAgent(factoryId, agent.name);
                  onClose();
                }}
              >
                {t(I18nKey.FACTORY$REMOVE_AGENT)}
              </BrandButton>
            ) : null}
          </div>
          <div className="flex gap-2">
            <BrandButton
              type="button"
              variant="secondary"
              testId="factory-edit-agent-cancel"
              onClick={onClose}
            >
              {t(I18nKey.BUTTON$CANCEL)}
            </BrandButton>
            <BrandButton
              type="button"
              variant="primary"
              testId="factory-edit-agent-save"
              onClick={save}
            >
              {t(I18nKey.BUTTON$SAVE)}
            </BrandButton>
          </div>
        </div>
        {isAdded && inUse ? (
          <p className="text-xs text-muted">
            {t(I18nKey.FACTORY$AGENT_IN_USE_HINT)}
          </p>
        ) : null}
      </ModalBody>
    </ModalBackdrop>
  );
}
