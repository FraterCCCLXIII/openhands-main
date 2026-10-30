import {
  PAGE_TITLE_CLASS_NAME,
  PAGE_SUBTITLE_CLASS_NAME,
} from "#/components/shared/page-title";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AgentProfileModal } from "#/components/features/agents/new-agent-modal";
import { FeedRoleBadge } from "#/components/features/feed/feed-role-badge";
import { KamijiAgentAvatar } from "#/components/features/kamiji/kamiji-agent-avatar";
import { BrandButton } from "#/components/features/settings/brand-button";
import { useNavigation } from "#/context/navigation-context";
import { useDeleteAgentProfile } from "#/hooks/mutation/use-delete-agent-profile";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import {
  useFactoryResolver,
  useFeedFactories,
} from "#/hooks/use-feed-factories";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { agentTint } from "#/utils/feed-agent-identity";
import { type FeedFactory } from "#/utils/feed-team-demo";
import { usePaginatedConversations } from "#/hooks/query/use-paginated-conversations";
import { I18nKey } from "#/i18n/declaration";
import { ExecutionStatus } from "#/types/agent-server/core/base/common";
import { getFeedAgentRole } from "#/utils/feed-agent-role";
import { settingsLikeMainScrollClassName } from "#/utils/settings-like-page-layout-classes";
import { cn } from "#/utils/utils";

const labelClassName =
  "text-[11px] font-medium uppercase tracking-wider text-muted";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className={labelClassName}>{label}</span>
      {children}
    </div>
  );
}

/**
 * The agent profiles you use across your factories, as a list: each one with a Kamiji
 * avatar, its kind, role, model and the factories its conversations run in.
 */
export default function AgentsScreen() {
  const { t } = useTranslation("openhands");
  const { navigate } = useNavigation();
  const { data, isLoading } = useAgentProfiles();
  const { data: conversations } = usePaginatedConversations();
  // `null` is closed, "" is creating, a name is editing that profile.
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const deleteProfile = useDeleteAgentProfile();
  const profiles = data?.profiles ?? [];
  const configs = useFeedAgentConfigStore((state) => state.configs);
  const addedAgents = useFeedFactoriesStore((state) => state.addedAgents);
  const addAgent = useFeedFactoriesStore((state) => state.addAgent);
  const removeAgent = useFeedFactoriesStore((state) => state.removeAgent);
  const factories = useFeedFactories();
  const resolveFactory = useFactoryResolver();

  const usage = useMemo(() => {
    const all = conversations?.pages.flatMap((page) => page.items) ?? [];
    return (profileId: string | null) => {
      const mine = profileId
        ? all.filter(
            (c) => c.launched_agent_profile?.agent_profile_id === profileId,
          )
        : [];
      const usedIn = new Map<string, FeedFactory>();
      mine.forEach((c) => {
        const factory = resolveFactory(c);
        if (factory) usedIn.set(factory.id, factory);
      });
      const roles = new Map<string, number>();
      mine.forEach((c) => {
        const role = getFeedAgentRole(c).role;
        roles.set(role, (roles.get(role) ?? 0) + 1);
      });
      const topRole = [...roles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      return {
        count: mine.length,
        live: mine.filter((c) => c.execution_status === ExecutionStatus.RUNNING)
          .length,
        usedIn: [...usedIn.values()],
        role: mine.length
          ? getFeedAgentRole(
              mine.find((c) => getFeedAgentRole(c).role === topRole) ?? mine[0],
            )
          : null,
        model: mine.find((c) => c.llm_model)?.llm_model ?? null,
      };
    };
  }, [conversations, resolveFactory]);

  return (
    <div data-testid="agents-screen" className="flex h-full">
      <main className={cn(settingsLikeMainScrollClassName, "h-full")}>
        <div className="mx-auto flex w-full max-w-200 flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className={PAGE_TITLE_CLASS_NAME}>{t(I18nKey.NAV$AGENTS)}</h1>
              <p className={PAGE_SUBTITLE_CLASS_NAME}>
                {t(I18nKey.NAV$AGENTS_DESCRIPTION)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <BrandButton
                type="button"
                variant="secondary"
                testId="agents-manage-button"
                className="whitespace-nowrap"
                onClick={() => navigate("/settings/agents")}
              >
                {t(I18nKey.NAV$AGENTS_MANAGE)}
              </BrandButton>
              <BrandButton
                type="button"
                variant="primary"
                testId="agents-new-button"
                className="whitespace-nowrap"
                onClick={() => setEditing("")}
              >
                <Plus size={14} aria-hidden className="mr-1.5" />
                {t(I18nKey.AGENTS$NEW)}
              </BrandButton>
            </div>
          </div>

          {isLoading ? (
            <div className="h-28 animate-pulse rounded-2xl bg-base-secondary" />
          ) : profiles.length ? (
            <ul className="flex flex-col gap-3">
              {profiles.map((profile) => {
                const use = usage(profile.id);
                const config = configs[profile.name];
                const model =
                  use.model ?? profile.llm_profile_ref ?? profile.agent_kind;
                const roleValue = config?.role
                  ? {
                      role: config.role,
                      tier: config.tier ?? use.role?.tier ?? null,
                      model: use.role?.model ?? null,
                    }
                  : use.role;
                const memberOf = factories.filter((factory) =>
                  addedAgents[factory.id]?.includes(profile.name),
                );
                const factoryChips = [
                  ...memberOf,
                  ...use.usedIn.filter(
                    (factory) => !memberOf.some((m) => m.id === factory.id),
                  ),
                ];
                const joinable = factories.filter(
                  (factory) => !addedAgents[factory.id]?.includes(profile.name),
                );
                return (
                  <li
                    key={profile.id ?? profile.name}
                    data-testid={`agent-profile-row-${profile.name}`}
                    className="flex flex-col gap-4 rounded-2xl bg-base-secondary p-4 ring-1 ring-white/5 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:w-56 sm:shrink-0">
                      <span
                        className={cn(
                          "shrink-0 rounded-xl",
                          agentTint(profile.id ?? profile.name, config),
                        )}
                      >
                        <KamijiAgentAvatar name={profile.name} size={44} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold leading-5 text-contrast">
                          {profile.name}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted">
                          {profile.agent_kind}
                        </p>
                      </div>
                    </div>

                    <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                      {config?.description ? (
                        <p
                          data-testid="agent-profile-description"
                          className="col-span-2 text-sm text-muted sm:col-span-3"
                        >
                          {config.description}
                        </p>
                      ) : null}
                      <Field label={t(I18nKey.NAV$AGENTS_ROLE)}>
                        {roleValue ? (
                          <FeedRoleBadge role={roleValue} />
                        ) : (
                          <span className="text-sm text-muted">—</span>
                        )}
                      </Field>
                      <Field label={t(I18nKey.NAV$AGENTS_MODEL)}>
                        <span className="truncate font-mono text-xs text-contrast">
                          {model}
                        </span>
                      </Field>
                      <Field
                        label={t(I18nKey.NAV$AGENTS_CONVERSATIONS)}
                        className="sm:items-end"
                      >
                        <span className="flex items-center gap-1.5 text-sm tabular-nums text-contrast">
                          {use.count}
                          {use.live ? (
                            <span className="flex items-center gap-1 text-xs text-success">
                              <span className="size-1.5 rounded-full bg-success" />
                              {use.live}
                            </span>
                          ) : null}
                        </span>
                      </Field>
                      <Field
                        label={t(I18nKey.FEED$FACTORIES)}
                        className="col-span-2 sm:col-span-3"
                      >
                        <ul className="flex flex-wrap items-center gap-1.5">
                          {factoryChips.map((factory) => {
                            const isMember = memberOf.some(
                              (m) => m.id === factory.id,
                            );
                            return (
                              <li
                                key={factory.id}
                                data-testid={`agent-factory-chip-${factory.id}`}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
                                  factory.className,
                                )}
                              >
                                <factory.Icon size={12} aria-hidden />
                                {factory.name}
                                {isMember ? (
                                  <button
                                    type="button"
                                    aria-label={t(
                                      I18nKey.AGENTS$REMOVE_FROM_FACTORY,
                                      { factory: factory.name },
                                    )}
                                    data-testid={`agent-factory-remove-${factory.id}`}
                                    onClick={() =>
                                      removeAgent(factory.id, profile.name)
                                    }
                                  >
                                    <X size={12} aria-hidden />
                                  </button>
                                ) : null}
                              </li>
                            );
                          })}
                          {factoryChips.length === 0 ? (
                            <li className="text-xs text-muted">
                              {t(I18nKey.NAV$AGENTS_UNUSED)}
                            </li>
                          ) : null}
                          {joinable.length ? (
                            <li>
                              <select
                                data-testid={`agent-add-to-factory-${profile.name}`}
                                aria-label={t(I18nKey.AGENTS$ADD_TO_FACTORY)}
                                value=""
                                onChange={(event) => {
                                  if (event.target.value) {
                                    addAgent(event.target.value, profile.name);
                                  }
                                }}
                                className="rounded-full border border-border bg-base-secondary px-2 py-0.5 text-xs text-contrast"
                              >
                                <option value="">
                                  {t(I18nKey.AGENTS$ADD_TO_FACTORY)}
                                </option>
                                {joinable.map((factory) => (
                                  <option key={factory.id} value={factory.id}>
                                    {factory.name}
                                  </option>
                                ))}
                              </select>
                            </li>
                          ) : null}
                        </ul>
                      </Field>
                    </div>
                    <div className="flex shrink-0 gap-1 sm:flex-col">
                      <button
                        type="button"
                        data-testid={`agent-edit-${profile.name}`}
                        aria-label={t(I18nKey.AGENTS$EDIT)}
                        onClick={() => setEditing(profile.name)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-contrast"
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                      {confirmDelete === profile.name ? (
                        <button
                          type="button"
                          data-testid={`agent-delete-confirm-${profile.name}`}
                          onClick={() => {
                            setConfirmDelete(null);
                            deleteProfile.mutate(profile.name);
                          }}
                          className="rounded-md bg-danger/20 px-2 py-1 text-xs text-danger"
                        >
                          {t(I18nKey.AGENTS$DELETE_CONFIRM)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-testid={`agent-delete-${profile.name}`}
                          aria-label={t(I18nKey.AGENTS$DELETE)}
                          onClick={() => setConfirmDelete(profile.name)}
                          className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-danger"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-tertiary-light">
              {t(I18nKey.NAV$AGENTS_EMPTY)}
            </p>
          )}
        </div>
      </main>
      {editing !== null ? (
        <AgentProfileModal
          editName={editing || undefined}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
