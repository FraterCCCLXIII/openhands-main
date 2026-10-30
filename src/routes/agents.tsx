import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { NewAgentModal } from "#/components/features/agents/new-agent-modal";
import { FeedRoleBadge } from "#/components/features/feed/feed-role-badge";
import { KamijiAvatar } from "#/components/features/kamiji/kamiji-avatar";
import { getKamijiColor } from "#/components/features/kamiji/kamiji-expressions";
import { BrandButton } from "#/components/features/settings/brand-button";
import { useNavigation } from "#/context/navigation-context";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { usePaginatedConversations } from "#/hooks/query/use-paginated-conversations";
import { I18nKey } from "#/i18n/declaration";
import { ExecutionStatus } from "#/types/agent-server/core/base/common";
import { getFeedAgentRole } from "#/utils/feed-agent-role";
import { getFeedFactory } from "#/utils/feed-team-demo";
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
  const [adding, setAdding] = useState(false);
  const profiles = data?.profiles ?? [];

  const usage = useMemo(() => {
    const all = conversations?.pages.flatMap((page) => page.items) ?? [];
    return (profileId: string | null) => {
      const mine = profileId
        ? all.filter(
            (c) => c.launched_agent_profile?.agent_profile_id === profileId,
          )
        : [];
      const factories = new Map<string, ReturnType<typeof getFeedFactory>>();
      mine.forEach((c) => {
        const factory = getFeedFactory(c.id);
        factories.set(factory.id, factory);
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
        factories: [...factories.values()],
        role: mine.length
          ? getFeedAgentRole(
              mine.find((c) => getFeedAgentRole(c).role === topRole) ?? mine[0],
            )
          : null,
        model: mine.find((c) => c.llm_model)?.llm_model ?? null,
      };
    };
  }, [conversations]);

  return (
    <div data-testid="agents-screen" className="flex h-full">
      <main className={cn(settingsLikeMainScrollClassName, "h-full")}>
        <div className="mx-auto flex w-full max-w-200 flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl font-semibold leading-6 tracking-tight text-foreground">
                {t(I18nKey.NAV$AGENTS)}
              </h2>
              <p className="max-w-2xl text-sm leading-5 text-tertiary-light">
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
                onClick={() => setAdding(true)}
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
                const model =
                  use.model ?? profile.llm_profile_ref ?? profile.agent_kind;
                return (
                  <li
                    key={profile.id ?? profile.name}
                    data-testid={`agent-profile-row-${profile.name}`}
                    className="flex flex-col gap-4 rounded-2xl bg-base-secondary p-4 ring-1 ring-white/5 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:w-56 sm:shrink-0">
                      <KamijiAvatar
                        color={getKamijiColor(profile.name)}
                        expression="happy"
                        size={44}
                      />
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
                      <Field label={t(I18nKey.NAV$AGENTS_ROLE)}>
                        {use.role ? (
                          <FeedRoleBadge role={use.role} />
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
                        {use.factories.length ? (
                          <ul className="flex flex-wrap gap-1.5">
                            {use.factories.map((factory) => (
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
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-muted">
                            {t(I18nKey.NAV$AGENTS_UNUSED)}
                          </span>
                        )}
                      </Field>
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
      {adding ? <NewAgentModal onClose={() => setAdding(false)} /> : null}
    </div>
  );
}
