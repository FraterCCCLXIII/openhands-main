import { useTranslation } from "react-i18next";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useSkillCatalog } from "#/hooks/query/use-skill-catalog";
import { useSkills } from "#/hooks/query/use-skills";
import { useSkillEnablement } from "#/hooks/use-skill-enablement";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { getSkillCardDescription } from "#/components/features/skills/get-skill-card-description";
import { ToggleSwitch } from "#/ui/toggle-switch";
import { cn } from "#/utils/utils";
import {
  automationActivityListClassName,
  automationActivityRowClassName,
} from "../automation-view-mode";

const NO_SKILLS: string[] = [];

/**
 * The skills a factory's agents can use. The list is the same one the global
 * Skills page shows (the local catalog, or the Cloud list); a factory can only
 * switch a skill off for itself, so a skill that is off globally stays off.
 */
export function FactorySkills({ factoryId }: { factoryId: string }) {
  const { t } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const { backend } = useActiveBackend();
  const isCloud = backend.kind === "cloud";
  const catalog = useSkillCatalog();
  const cloudSkills = useSkills(undefined, { enabled: isCloud });
  const { data: skills = [] } = isCloud ? cloudSkills : catalog;
  const { isEnabled: isGloballyEnabled } = useSkillEnablement();
  const disabled =
    useFeedFactoriesStore((state) => state.disabledSkills[factoryId]) ??
    NO_SKILLS;
  const setSkillEnabled = useFeedFactoriesStore(
    (state) => state.setSkillEnabled,
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{t(I18nKey.FACTORY$SKILLS_HINT)}</p>
      {skills.length === 0 ? (
        <p data-testid="factory-skills-empty" className="text-sm text-muted">
          {t(I18nKey.FACTORY$SKILLS_EMPTY)}
        </p>
      ) : (
        <ul className={automationActivityListClassName}>
          {skills.map((skill) => {
            const globallyOn = isGloballyEnabled(skill);
            const enabled = globallyOn && !disabled.includes(skill.name);
            const description = getSkillCardDescription(skill);
            return (
              <li
                key={skill.name}
                data-testid="factory-skill"
                className={cn(
                  automationActivityRowClassName,
                  "items-center gap-3 px-3 py-2.5",
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {skill.name}
                  </span>
                  {description ? (
                    <span className="line-clamp-2 text-xs text-muted">
                      {description}
                    </span>
                  ) : null}
                  <span className="truncate text-xs text-muted">
                    {skill.source ?? skill.origin}
                  </span>
                </span>
                {globallyOn ? null : (
                  <span className="shrink-0 text-xs text-muted">
                    {t(I18nKey.FACTORY$SKILL_OFF_GLOBALLY)}
                  </span>
                )}
                <ToggleSwitch
                  enabled={enabled}
                  disabled={!globallyOn}
                  label={t(I18nKey.FACTORY$SKILL_TOGGLE, { name: skill.name })}
                  onToggle={() =>
                    setSkillEnabled(factoryId, skill.name, !enabled)
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
      <NavigationLink
        to={backendScopedPath("/skills")}
        data-testid="factory-skills-install"
        className="self-start text-sm font-medium text-contrast hover:underline"
      >
        {t(I18nKey.FACTORY$SKILLS_INSTALL_MORE)}
      </NavigationLink>
    </div>
  );
}
