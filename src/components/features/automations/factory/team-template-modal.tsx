import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import {
  TEAM_ROLES,
  teamStageKey,
  type TeamRoleId,
  type TeamTemplate,
} from "#/constants/factory-team-templates";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import {
  FEED_TEAMMATES,
  isFeedTeamDemoEnabled,
  type FeedFactory,
} from "#/utils/feed-team-demo";
import { isValidEmail, normalizeEmail } from "./human-roles";

const fieldClassName =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-contrast disabled:opacity-50";

interface RowValue {
  email: string;
  contactId: string;
}

const EMPTY_ROW: RowValue = { email: "", contactId: "" };

interface TeamTemplateModalProps {
  factory: FeedFactory;
  template: TeamTemplate;
  /** Roles that already have someone; they get no row. */
  filledRoles: ReadonlySet<TeamRoleId>;
  onClose: () => void;
}

/**
 * One row per open role of a template: an email or a contact. Saving stores
 * pending invites through the factory store; nothing is ever sent.
 */
export function TeamTemplateModal({
  factory,
  template,
  filledRoles,
  onClose,
}: TeamTemplateModalProps) {
  const { t } = useTranslation("openhands");
  const assignPerson = useFeedFactoriesStore((state) => state.assignPerson);
  const inviteByEmail = useFeedFactoriesStore((state) => state.inviteByEmail);
  const [rows, setRows] = useState<Partial<Record<TeamRoleId, RowValue>>>({});
  const [saved, setSaved] = useState(false);

  const openRoles = template.roles.filter(({ role }) => !filledRoles.has(role));
  // Contacts are simulated; without the demo only email invites exist.
  const contacts = useMemo(
    () => (isFeedTeamDemoEnabled(window.location.search) ? FEED_TEAMMATES : []),
    [],
  );

  const rowOf = (role: TeamRoleId) => rows[role] ?? EMPTY_ROW;
  const update = (role: TeamRoleId, patch: Partial<RowValue>) =>
    setRows((current) => ({
      ...current,
      [role]: { ...rowOf(role), ...patch },
    }));
  const isFilled = (row: RowValue) =>
    Boolean(row.contactId || row.email.trim());
  const isInvalid = (row: RowValue) =>
    !row.contactId && Boolean(row.email.trim()) && !isValidEmail(row.email);

  const entries = openRoles.map(({ role }) => rowOf(role));
  const canSave = entries.some(isFilled) && !entries.some(isInvalid);

  const save = () => {
    if (!canSave) return;
    openRoles.forEach(({ role }) => {
      const row = rowOf(role);
      const key = teamStageKey(role);
      const person = contacts.find((contact) => contact.id === row.contactId);
      if (person) assignPerson(factory.id, key, person);
      else if (row.email.trim() && isValidEmail(row.email)) {
        inviteByEmail(factory.id, key, { email: normalizeEmail(row.email) });
      }
    });
    setSaved(true);
  };

  const title = t(I18nKey.FACTORY$TEAM_MODAL_TITLE, {
    template: t(template.name),
  });

  return (
    <ModalBackdrop onClose={onClose} aria-label={title}>
      <ModalBody
        testID="team-template-modal"
        width="md"
        className="items-start border border-border"
      >
        <BaseModalTitle title={title} />
        {saved ? (
          <div className="flex w-full flex-col gap-3">
            <p role="status" className="text-sm font-medium text-foreground">
              {t(I18nKey.FACTORY$INVITE_SAVED)}
            </p>
            <div className="flex justify-end">
              <BrandButton
                type="button"
                variant="primary"
                testId="team-template-done"
                onClick={onClose}
              >
                {t(I18nKey.FACTORY$INVITE_DONE)}
              </BrandButton>
            </div>
          </div>
        ) : (
          <form
            className="flex w-full flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <p className="-mt-4 text-sm text-muted">
              {t(I18nKey.FACTORY$TEAM_MODAL_HINT)}
            </p>
            {openRoles.map(({ role }) => {
              const label = t(TEAM_ROLES[role].label);
              const row = rowOf(role);
              const invalid = isInvalid(row);
              return (
                <fieldset
                  key={role}
                  data-testid={`team-template-row-${role}`}
                  className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <legend className="px-1 text-sm font-medium text-foreground">
                    {label}
                  </legend>
                  <input
                    type="email"
                    autoComplete="off"
                    data-testid={`team-template-email-${role}`}
                    aria-label={t(I18nKey.FACTORY$TEAM_ROW_EMAIL, {
                      role: label,
                    })}
                    placeholder={t(I18nKey.FACTORY$INVITE_EMAIL_LABEL)}
                    value={row.email}
                    disabled={Boolean(row.contactId)}
                    aria-invalid={invalid}
                    onChange={(event) =>
                      update(role, { email: event.target.value })
                    }
                    className={fieldClassName}
                  />
                  {invalid ? (
                    <p role="alert" className="text-xs text-danger">
                      {t(I18nKey.FACTORY$INVITE_EMAIL_INVALID)}
                    </p>
                  ) : null}
                  {contacts.length > 0 ? (
                    <select
                      data-testid={`team-template-contact-${role}`}
                      aria-label={t(I18nKey.FACTORY$TEAM_ROW_CONTACT, {
                        role: label,
                      })}
                      value={row.contactId}
                      onChange={(event) =>
                        update(role, {
                          contactId: event.target.value,
                          email: "",
                        })
                      }
                      className={fieldClassName}
                    >
                      <option value="">
                        {t(I18nKey.FACTORY$TEAM_PICK_CONTACT)}
                      </option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {`${contact.name} · ${contact.title}`}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </fieldset>
              );
            })}
            <div className="flex justify-end gap-2">
              <BrandButton
                type="button"
                variant="secondary"
                testId="team-template-cancel"
                onClick={onClose}
              >
                {t(I18nKey.BUTTON$CANCEL)}
              </BrandButton>
              <BrandButton
                type="submit"
                variant="primary"
                testId="team-template-save"
                isDisabled={!canSave}
              >
                {t(I18nKey.FACTORY$TEAM_SAVE)}
              </BrandButton>
            </div>
          </form>
        )}
      </ModalBody>
    </ModalBackdrop>
  );
}
