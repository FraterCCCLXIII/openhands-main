import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Factory,
  FolderPlus,
  MessageSquarePlus,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { AgentProfileModal } from "#/components/features/agents/new-agent-modal";
import { AddFactoryModal } from "#/components/features/automations/factory/add-factory-modal";
import { OpenRepositoryDialog } from "#/components/features/home/open-repository-dialog";
import { useNavigation } from "#/context/navigation-context";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { FEED_QUERY_KEYS } from "#/hooks/query/query-keys";
import {
  AGENT_PROFILES_QUERY_KEYS,
  useAgentProfiles,
} from "#/hooks/query/use-agent-profiles";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import { useFeedPendingStore } from "#/stores/feed-pending-store";
import type { Branch, GitRepository } from "#/types/git";
import type { Provider } from "#/types/settings";
import { ContextMenu } from "#/ui/context-menu";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { getApiErrorMessage } from "#/utils/api-error-message";
import { dropdownMenuRowIconWrapperClassName } from "#/utils/dropdown-classes";
import { cn } from "#/utils/utils";

export type FeedAddKind = "factory" | "agent" | "conversation" | "project";

const ENTRIES: Array<{
  kind: FeedAddKind;
  icon: LucideIcon;
  label: I18nKey;
}> = [
  { kind: "factory", icon: Factory, label: I18nKey.FEED$ADD_FACTORY },
  { kind: "agent", icon: Bot, label: I18nKey.FEED$ADD_AGENT },
  {
    kind: "conversation",
    icon: MessageSquarePlus,
    label: I18nKey.FEED$ADD_CONVERSATION,
  },
  { kind: "project", icon: FolderPlus, label: I18nKey.FEED$ADD_PROJECT },
];

const focusComposer = (): boolean => {
  const input = document.querySelector<HTMLElement>(
    '[data-testid="feed-composer"] [contenteditable], [data-testid="feed-composer"] textarea',
  );
  input?.focus();
  return !!input;
};

interface FeedSectionAddMenuProps {
  /** The section the plus sits on; its entry is listed first. */
  primary: FeedAddKind;
}

/**
 * The plus on a left-panel header: one menu to add a factory, an agent, a
 * conversation or a project, reusing the app's own creation flows. What was
 * just created becomes the Tower filter, so it shows up selected.
 */
export function FeedSectionAddMenu({ primary }: FeedSectionAddMenuProps) {
  const { t } = useTranslation("openhands");
  const queryClient = useQueryClient();
  const { navigate } = useNavigation();
  const backendScopedPath = useBackendScopedPath();
  const setFilter = useFeedFilterStore((state) => state.setFilter);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<FeedAddKind | null>(null);
  const [selectAgentName, setSelectAgentName] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => setMenuOpen(false);
  const menuRef = useClickOutsideElement<HTMLUListElement>(close, triggerRef);
  useCloseOnEscape(menuOpen, close, triggerRef);
  const { data: agentProfiles } = useAgentProfiles();
  const { mutateAsync: createConversation } = useCreateConversation({
    disableToast: true,
  });

  // The new agent is selected once its profile is in the refreshed list.
  useEffect(() => {
    if (!selectAgentName) return;
    const created = agentProfiles?.profiles.find(
      (profile) => profile.name === selectAgentName && profile.id,
    );
    if (!created?.id) return;
    const current = useFeedFilterStore.getState().filter;
    setFilter({ ...current, agentProfileId: created.id });
    setSelectAgentName(null);
  }, [selectAgentName, agentProfiles, setFilter]);

  const ordered = [
    ...ENTRIES.filter((entry) => entry.kind === primary),
    ...ENTRIES.filter((entry) => entry.kind !== primary),
  ];

  const choose = (kind: FeedAddKind) => {
    close();
    if (kind === "conversation") {
      if (!focusComposer()) {
        navigate(backendScopedPath("/feed"));
        requestAnimationFrame(() => requestAnimationFrame(focusComposer));
      }
      return;
    }
    setDialog(kind);
  };

  const startProject = async (selection: {
    repository: GitRepository;
    branch: Branch;
    provider: Provider | null;
  }) => {
    const pendingId = `pending-${Date.now()}`;
    const project = selection.repository.full_name;
    useFeedPendingStore.getState().add({
      id: pendingId,
      text: project,
      factoryId: null,
      agentName: "OpenHands",
      createdAt: Date.now(),
    });
    try {
      const created = await createConversation({
        repository: {
          name: project,
          gitProvider: selection.provider ?? selection.repository.git_provider,
          branch: selection.branch.name,
        },
        entryPoint: "feed_add_project",
      });
      useFeedPendingStore.getState().attach(pendingId, created.conversation_id);
      const current = useFeedFilterStore.getState().filter;
      setFilter({ ...current, factoryId: null, project });
      void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all });
      void queryClient.invalidateQueries({
        queryKey: ["user", "conversations"],
      });
    } catch (error) {
      useFeedPendingStore.getState().remove(pendingId);
      const fallback = error instanceof Error ? error.message : "";
      displayErrorToast(getApiErrorMessage(error, fallback) || null);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        data-testid={`feed-add-${primary}`}
        aria-label={t(I18nKey.FEED$ADD)}
        title={t(I18nKey.FEED$ADD)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-interactive-hover hover:text-contrast",
          menuOpen && "bg-interactive-hover text-contrast",
        )}
      >
        <Plus size={16} aria-hidden />
      </button>
      {menuOpen ? (
        <ContextMenu
          ref={menuRef}
          testId="feed-add-menu"
          position="bottom"
          alignment="right"
          spacing="none"
          className="z-[60] mt-1 min-w-52 p-1"
        >
          {ordered.map((entry, index) => (
            <li key={entry.kind} role="presentation">
              <button
                type="button"
                role="menuitem"
                data-testid={`feed-add-${entry.kind}-item`}
                data-primary={index === 0 ? "true" : undefined}
                onClick={() => choose(entry.kind)}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded px-2 text-left text-sm text-foreground hover:bg-interactive-hover",
                  index === 0 && "font-semibold",
                )}
              >
                <span
                  className={dropdownMenuRowIconWrapperClassName}
                  aria-hidden
                >
                  <entry.icon width={16} height={16} />
                </span>
                {t(entry.label)}
              </button>
            </li>
          ))}
        </ContextMenu>
      ) : null}
      {dialog === "factory" ? (
        <AddFactoryModal
          onClose={() => setDialog(null)}
          onCreated={(factoryId) => {
            const current = useFeedFilterStore.getState().filter;
            setFilter({ ...current, factoryId });
            setDialog(null);
          }}
        />
      ) : null}
      {dialog === "agent" ? (
        <AgentProfileModal
          onClose={() => setDialog(null)}
          onCreated={(name) => {
            setSelectAgentName(name);
            void queryClient.invalidateQueries({
              queryKey: AGENT_PROFILES_QUERY_KEYS.all,
            });
            setDialog(null);
          }}
        />
      ) : null}
      {dialog === "project" ? (
        <OpenRepositoryDialog
          isOpen
          onClose={() => setDialog(null)}
          onConfirm={(selection) => void startProject(selection)}
        />
      ) : null}
    </div>
  );
}
