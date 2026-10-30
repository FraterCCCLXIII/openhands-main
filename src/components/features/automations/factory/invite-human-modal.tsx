import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { I18nKey } from "#/i18n/declaration";
import {
  emailAssignmentId,
  personAssignmentId,
  useFeedFactoriesStore,
  type HumanAssignment,
} from "#/stores/feed-factories-store";
import {
  FEED_TEAMMATES,
  isFeedTeamDemoEnabled,
  type FeedFactory,
} from "#/utils/feed-team-demo";
import { cn } from "#/utils/utils";
import {
  HUMAN_ROLE_LABEL,
  buildMailto,
  factoryLink,
  initialsOf,
  isValidEmail,
  normalizeEmail,
} from "./human-roles";
import type { PipelineStep } from "./pipeline-templates";

type InviteTab = "team" | "email";
const TABS: readonly InviteTab[] = ["team", "email"];
const TAB_LABEL: Record<InviteTab, I18nKey> = {
  team: I18nKey.FACTORY$INVITE_TAB_TEAM,
  email: I18nKey.FACTORY$INVITE_TAB_EMAIL,
};

const fieldClassName =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-contrast";

interface InviteHumanModalProps {
  factory: FeedFactory;
  stageKey: string;
  step: PipelineStep;
  /** People already at this stage, to leave out and de-duplicate against. */
  assignments: HumanAssignment[];
  onClose: () => void;
}

/**
 * Fills one human role: pick a teammate, or save an email invite. This app
 * has no way to send email, so an invite is only stored; the success state
 * offers a message to copy or open in the user's own mail app.
 */
export function InviteHumanModal({
  factory,
  stageKey,
  step,
  assignments,
  onClose,
}: InviteHumanModalProps) {
  const { t } = useTranslation("openhands");
  const assignPerson = useFeedFactoriesStore((state) => state.assignPerson);
  const inviteByEmail = useFeedFactoriesStore((state) => state.inviteByEmail);
  const [tab, setTab] = useState<InviteTab>("team");
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const role = t(HUMAN_ROLE_LABEL[step.humanRoleKind ?? "reviewer"]);
  const taken = useMemo(
    () => new Set(assignments.map((assignment) => assignment.id)),
    [assignments],
  );
  const people = useMemo(() => {
    const needle = query.trim().toLowerCase();
    // Teammates are simulated; without the demo only email invites exist.
    const teammates = isFeedTeamDemoEnabled(window.location.search)
      ? FEED_TEAMMATES
      : [];
    const available = teammates
      .filter((person) => !taken.has(personAssignmentId(person.id)))
      .filter(
        (person) =>
          !needle ||
          `${person.name} ${person.title}`.toLowerCase().includes(needle),
      )
      // The factory owner first: the person most likely to be asked.
      .sort(
        (a, b) =>
          Number(b.id === factory.ownerId) - Number(a.id === factory.ownerId),
      );
    return available;
  }, [query, taken, factory.ownerId]);

  const normalized = normalizeEmail(email);
  const emailValid = isValidEmail(email);
  const duplicate = taken.has(emailAssignmentId(normalized));
  const emailError =
    !touched || !normalized
      ? null
      : !emailValid
        ? I18nKey.FACTORY$INVITE_EMAIL_INVALID
        : duplicate
          ? I18nKey.FACTORY$INVITE_EMAIL_DUPLICATE
          : null;
  const picked = people.find((person) => person.id === pickedId);
  const canSubmit = tab === "team" ? Boolean(picked) : emailValid && !duplicate;

  const message = {
    subject: t(I18nKey.FACTORY$INVITE_MESSAGE_SUBJECT, {
      factory: factory.name,
      role,
    }),
    body: t(I18nKey.FACTORY$INVITE_MESSAGE_BODY, {
      factory: factory.name,
      role,
      stage: step.title,
      link: factoryLink(factory.id),
    }),
  };

  const submit = () => {
    if (!canSubmit) return;
    if (tab === "team" && picked) {
      assignPerson(factory.id, stageKey, picked);
      onClose();
      return;
    }
    inviteByEmail(factory.id, stageKey, { email: normalized, name });
    setSavedEmail(normalized);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <ModalBackdrop
      onClose={onClose}
      aria-label={t(I18nKey.FACTORY$INVITE_TITLE, { role })}
    >
      <ModalBody
        testID="invite-human-modal"
        width="md"
        className="items-start border border-border"
      >
        <BaseModalTitle title={t(I18nKey.FACTORY$INVITE_TITLE, { role })} />
        <p className="-mt-4 text-sm text-muted">{`${step.title} · ${factory.name}`}</p>
        {savedEmail ? (
          <div className="flex w-full flex-col gap-3">
            <p role="status" className="text-sm font-medium text-foreground">
              {t(I18nKey.FACTORY$INVITE_SAVED)}
            </p>
            <p className="text-sm text-muted">
              {t(I18nKey.FACTORY$INVITE_SAVED_HINT)}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <BrandButton
                type="button"
                variant="secondary"
                testId="invite-copy-message"
                onClick={copyMessage}
              >
                {copied
                  ? t(I18nKey.FACTORY$INVITE_COPIED)
                  : t(I18nKey.FACTORY$INVITE_COPY)}
              </BrandButton>
              <a
                data-testid="invite-open-mail"
                href={buildMailto(savedEmail, message.subject, message.body)}
                className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm text-contrast hover:bg-surface-raised"
              >
                {t(I18nKey.FACTORY$INVITE_OPEN_MAIL)}
              </a>
              <BrandButton
                type="button"
                variant="primary"
                testId="invite-done"
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
              submit();
            }}
          >
            <div role="tablist" className="flex gap-2">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`invite-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls={`invite-panel-${id}`}
                  data-testid={`invite-tab-${id}`}
                  onClick={() => setTab(id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm",
                    tab === id
                      ? "bg-surface text-contrast"
                      : "text-muted hover:text-contrast",
                  )}
                >
                  {t(TAB_LABEL[id])}
                </button>
              ))}
            </div>
            {tab === "team" ? (
              <div
                role="tabpanel"
                id="invite-panel-team"
                aria-labelledby="invite-tab-team"
                className="flex flex-col gap-2"
              >
                <input
                  type="search"
                  data-testid="invite-search"
                  aria-label={t(I18nKey.FACTORY$INVITE_SEARCH)}
                  placeholder={t(I18nKey.FACTORY$INVITE_SEARCH)}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={fieldClassName}
                />
                {people.length === 0 ? (
                  <p className="text-sm text-muted">
                    {t(I18nKey.FACTORY$INVITE_NO_PEOPLE)}
                  </p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-label={t(I18nKey.FACTORY$INVITE_TAB_TEAM)}
                    className="flex max-h-56 flex-col gap-1 overflow-y-auto"
                  >
                    {people.map((person) => (
                      <label
                        key={person.id}
                        data-testid={`invite-person-${person.id}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                          pickedId === person.id
                            ? "border-focus bg-surface-raised"
                            : "border-border hover:bg-surface-raised",
                        )}
                      >
                        <input
                          type="radio"
                          name="invite-person"
                          className="sr-only"
                          checked={pickedId === person.id}
                          onChange={() => setPickedId(person.id)}
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            person.className,
                          )}
                        >
                          {initialsOf(person.name)}
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="text-foreground">{person.name}</span>
                          <span className="text-xs text-muted">
                            {person.id === factory.ownerId
                              ? `${t(I18nKey.FACTORY$INVITE_OWNER)} · ${person.title}`
                              : person.title}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                role="tabpanel"
                id="invite-panel-email"
                aria-labelledby="invite-tab-email"
                className="flex flex-col gap-3"
              >
                <label className="flex flex-col gap-1 text-sm text-contrast">
                  {t(I18nKey.FACTORY$INVITE_EMAIL_LABEL)}
                  <input
                    type="email"
                    data-testid="invite-email"
                    autoComplete="off"
                    value={email}
                    aria-invalid={emailError !== null}
                    aria-describedby={
                      emailError ? "invite-email-error" : undefined
                    }
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setTouched(true)}
                    className={fieldClassName}
                  />
                </label>
                {emailError ? (
                  <p
                    id="invite-email-error"
                    role="alert"
                    className="-mt-2 text-xs text-danger"
                  >
                    {t(emailError)}
                  </p>
                ) : null}
                <label className="flex flex-col gap-1 text-sm text-contrast">
                  {t(I18nKey.FACTORY$INVITE_NAME_LABEL)}
                  <input
                    type="text"
                    data-testid="invite-name"
                    autoComplete="off"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={fieldClassName}
                  />
                </label>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <BrandButton
                type="button"
                variant="secondary"
                testId="invite-cancel"
                onClick={onClose}
              >
                {t(I18nKey.BUTTON$CANCEL)}
              </BrandButton>
              <BrandButton
                type="submit"
                variant="primary"
                testId="invite-submit"
                isDisabled={!canSubmit}
              >
                {tab === "team"
                  ? t(I18nKey.FACTORY$INVITE_ASSIGN)
                  : t(I18nKey.FACTORY$INVITE_SAVE)}
              </BrandButton>
            </div>
          </form>
        )}
      </ModalBody>
    </ModalBackdrop>
  );
}
