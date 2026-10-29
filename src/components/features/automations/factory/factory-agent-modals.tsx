import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { IconAppearancePanel } from "#/ui/icon-appearance-picker";
import { FEED_DEMO_AGENTS } from "#/utils/feed-demo-agents";
import { agentIconKey } from "#/utils/feed-icon-keys";
import type { Roster, RosterAgent } from "./factory-routing-context";

interface AddAgentModalProps {
  factoryId: string;
  roster: Roster;
  onClose: () => void;
}

/** Picks personas that are not yet in the factory and adds them to its roster. */
export function FactoryAddAgentModal({
  factoryId,
  roster,
  onClose,
}: AddAgentModalProps) {
  const { t } = useTranslation("openhands");
  const addAgent = useFeedFactoriesStore((state) => state.addAgent);
  const taken = new Set([
    roster.coordinator.agent.name,
    ...roster.others.map(({ agent }) => agent.name),
  ]);
  const available = FEED_DEMO_AGENTS.filter(({ name }) => !taken.has(name));

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="factory-add-agent-modal"
        className="items-start border border-border"
      >
        <BaseModalTitle title={t(I18nKey.FACTORY$ADD_AGENT)} />
        <div className="flex w-full flex-col gap-1">
          {available.length === 0 ? (
            <p className="text-sm text-muted">
              {t(I18nKey.FACTORY$NO_AGENTS_TO_ADD)}
            </p>
          ) : (
            available.map((agent) => (
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
            ))
          )}
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

interface EditAgentModalProps {
  factoryId: string;
  entry: RosterAgent;
  isCoordinator: boolean;
  /** Whether the agent was added by hand (only those can be removed). */
  isAdded: boolean;
  onClose: () => void;
}

/** Edits an agent's icon, makes it the coordinator, or removes it. */
export function FactoryEditAgentModal({
  factoryId,
  entry,
  isCoordinator,
  isAdded,
  onClose,
}: EditAgentModalProps) {
  const { t } = useTranslation("openhands");
  const { agent, conversations } = entry;
  const iconKey = agentIconKey(`demo:${agent.name}`);
  const value = useFeedIconsStore((state) => state.icons[iconKey]);
  const setIcon = useFeedIconsStore((state) => state.setIcon);
  const setCoordinator = useFeedFactoriesStore((state) => state.setCoordinator);
  const removeAgent = useFeedFactoriesStore((state) => state.removeAgent);
  const inUse = conversations > 0;
  const canRemove = isAdded && !isCoordinator && !inUse;

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="factory-edit-agent-modal"
        className="items-start border border-border"
      >
        <div className="flex flex-col gap-1">
          <BaseModalTitle title={t(I18nKey.FACTORY$EDIT_AGENT)} />
          <p className="text-sm text-muted">{agent.name}</p>
        </div>
        <div
          className="flex w-full flex-col gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <IconAppearancePanel
            value={value ?? {}}
            onChange={(next) => setIcon(iconKey, next)}
          />
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
          <BrandButton
            type="button"
            variant="secondary"
            testId="factory-edit-agent-close"
            onClick={onClose}
          >
            {t(I18nKey.BUTTON$CLOSE)}
          </BrandButton>
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
