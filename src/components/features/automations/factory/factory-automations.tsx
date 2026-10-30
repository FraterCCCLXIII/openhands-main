import { useTranslation } from "react-i18next";
import { Unlink } from "lucide-react";
import { getTriggerSummary } from "#/components/features/home/featured-automations/automation-run-health";
import { BrandButton } from "#/components/features/settings/brand-button";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useAutomationHealth } from "#/hooks/query/use-automation-health";
import {
  useAutomations,
  useToggleAutomation,
} from "#/hooks/query/use-automations";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useStartAutomationSetup } from "#/hooks/use-start-automation-setup";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import type { Automation } from "#/types/automation";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { cn } from "#/utils/utils";
import {
  automationActivityListClassName,
  automationActivityRowClassName,
} from "../automation-view-mode";
import { ActiveStatusBadge } from "../detail/active-status-badge";

const NO_IDS: string[] = [];

/**
 * The automations attached to a factory. The automation service has no
 * factory field, so the association is the id list kept in the factory store;
 * the rows and actions are the ones the Automate page uses.
 */
export function FactoryAutomations({ factoryId }: { factoryId: string }) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const { startSetup } = useStartAutomationSetup();
  const { data: health } = useAutomationHealth();
  const { data } = useAutomations({ enabled: health?.status === "ok" });
  const { mutate: toggle, isPending: isToggling } = useToggleAutomation();
  const attachedIds =
    useFeedFactoriesStore((state) => state.automationIds[factoryId]) ?? NO_IDS;
  const attach = useFeedFactoriesStore((state) => state.attachAutomation);
  const detach = useFeedFactoriesStore((state) => state.detachAutomation);

  const all = data?.automations ?? [];
  const attached = all.filter((automation) =>
    attachedIds.includes(automation.id),
  );
  const attachable = all.filter(
    (automation) => !attachedIds.includes(automation.id),
  );

  const renderRow = (automation: Automation) => {
    const lastRun = automation.last_triggered_at;
    return (
      <li
        key={automation.id}
        data-testid="factory-automation"
        className={cn(
          automationActivityRowClassName,
          "flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5",
        )}
      >
        <NavigationLink
          to={backendScopedPath(
            `/automations/${encodeURIComponent(automation.id)}`,
          )}
          aria-label={t(I18nKey.FACTORY$AUTOMATION_OPEN, {
            name: automation.name,
          })}
          className="flex min-w-0 flex-1 basis-48 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <span className="truncate text-sm font-medium text-foreground">
            {automation.name}
          </span>
          <span className="truncate text-xs text-muted">
            {getTriggerSummary(automation)}
            {lastRun
              ? ` · ${t(I18nKey.AUTOMATIONS$DETAIL$LAST_RUN)} ${formatRelativeTime(lastRun, i18n.language, t)}`
              : ""}
          </span>
        </NavigationLink>
        <ActiveStatusBadge automation={automation} compact />
        <BrandButton
          type="button"
          variant="secondary"
          testId="factory-automation-toggle"
          isDisabled={isToggling}
          onClick={() =>
            toggle({ id: automation.id, enabled: !automation.enabled })
          }
        >
          {automation.enabled
            ? t(I18nKey.BUTTON$PAUSE)
            : t(I18nKey.GOAL$RESUME)}
        </BrandButton>
        <BrandButton
          type="button"
          variant="secondary"
          testId="factory-automation-detach"
          ariaLabel={t(I18nKey.FACTORY$AUTOMATION_DETACH, {
            name: automation.name,
          })}
          onClick={() => detach(factoryId, automation.id)}
        >
          <Unlink size={14} aria-hidden />
        </BrandButton>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {t(I18nKey.FACTORY$AUTOMATIONS_HINT)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <BrandButton
          type="button"
          variant="primary"
          testId="factory-automation-new"
          onClick={startSetup}
        >
          {t(I18nKey.AUTOMATIONS$ADD_AUTOMATION)}
        </BrandButton>
        <select
          data-testid="factory-automation-attach"
          aria-label={t(I18nKey.FACTORY$AUTOMATIONS_ATTACH)}
          value=""
          disabled={attachable.length === 0}
          onChange={(event) => {
            if (event.currentTarget.value) {
              attach(factoryId, event.currentTarget.value);
            }
          }}
          className="h-10 rounded-lg border border-border bg-surface px-2 text-sm text-foreground disabled:opacity-60"
        >
          <option value="">
            {attachable.length === 0
              ? t(I18nKey.FACTORY$AUTOMATIONS_NONE_TO_ATTACH)
              : t(I18nKey.FACTORY$AUTOMATIONS_ATTACH)}
          </option>
          {attachable.map((automation) => (
            <option key={automation.id} value={automation.id}>
              {automation.name}
            </option>
          ))}
        </select>
      </div>
      {attached.length === 0 ? (
        <p
          data-testid="factory-automations-empty"
          className="text-sm text-muted"
        >
          {t(I18nKey.FACTORY$AUTOMATIONS_EMPTY)}
        </p>
      ) : (
        <ul className={automationActivityListClassName}>
          {attached.map(renderRow)}
        </ul>
      )}
    </div>
  );
}
