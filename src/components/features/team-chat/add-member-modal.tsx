import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TeamClient } from "#/chat-transport/nostr";
import { MODAL_MAX_WIDTH_VIEWPORT } from "#/components/shared/modals/modal-body";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import {
  CopyField,
  ErrorNote,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "./team-chat-ui";

type AddTab = "invite" | "key";
const ADD_TABS: AddTab[] = ["invite", "key"];
const NPUB_PLACEHOLDER = "npub1…";

function InviteTab({ client }: { client: TeamClient }) {
  const { t } = useTranslation("openhands");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<unknown>(null);
  const make = async () => {
    setError(null);
    try {
      setInvite(await client.createInvite());
    } catch (e) {
      setError(e);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{t(I18nKey.TEAM_CHAT$INVITE_HELP)}</p>
      {invite && (
        <CopyField label={t(I18nKey.TEAM_CHAT$INVITE)} value={invite} />
      )}
      <ErrorNote error={error} />
      <button type="button" className={primaryButtonClassName} onClick={make}>
        {t(I18nKey.TEAM_CHAT$MAKE_INVITE)}
      </button>
    </div>
  );
}

function PublicKeyTab({ client }: { client: TeamClient }) {
  const { t } = useTranslation("openhands");
  const [key, setKey] = useState("");
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const add = async () => {
    setError(null);
    setAdded(false);
    try {
      await client.addMember(key);
      setKey("");
      setAdded(true);
    } catch (e) {
      setError(e);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <input
        aria-label={t(I18nKey.TEAM_CHAT$PUBLIC_KEY_INPUT)}
        className={cn(inputClassName, "font-mono text-xs")}
        placeholder={NPUB_PLACEHOLDER}
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <ErrorNote error={error} />
      {added && (
        <p role="status" className="text-sm text-success">
          {t(I18nKey.TEAM_CHAT$MEMBER_ADDED)}
        </p>
      )}
      <button
        type="button"
        className={primaryButtonClassName}
        disabled={!key.trim()}
        onClick={add}
      >
        {t(I18nKey.TEAM_CHAT$ADD)}
      </button>
    </div>
  );
}

export function AddMemberModal({
  client,
  onClose,
}: {
  client: TeamClient;
  onClose: () => void;
}) {
  const { t } = useTranslation("openhands");
  const [tab, setTab] = useState<AddTab>("invite");
  return (
    <ModalBackdrop
      onClose={onClose}
      aria-label={t(I18nKey.TEAM_CHAT$ADD_MEMBER)}
    >
      <div
        className={`flex w-110 ${MODAL_MAX_WIDTH_VIEWPORT} flex-col gap-4 rounded-xl border border-border bg-surface-raised p-5`}
      >
        <h2 className="text-lg font-medium text-contrast">
          {t(I18nKey.TEAM_CHAT$ADD_MEMBER)}
        </h2>
        {client.isAdmin() ? (
          <>
            <div role="tablist" className="flex gap-2">
              {ADD_TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm",
                    tab === id
                      ? "bg-surface text-contrast"
                      : "text-muted hover:text-contrast",
                  )}
                >
                  {t(
                    id === "invite"
                      ? I18nKey.TEAM_CHAT$TAB_INVITE_LINK
                      : I18nKey.TEAM_CHAT$TAB_BY_KEY,
                  )}
                </button>
              ))}
            </div>
            {tab === "invite" ? (
              <InviteTab client={client} />
            ) : (
              <PublicKeyTab client={client} />
            )}
          </>
        ) : (
          <p className="text-sm text-muted">
            {t(I18nKey.TEAM_CHAT$ONLY_ADMINS)}
          </p>
        )}
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={onClose}
        >
          {t(I18nKey.TEAM_CHAT$CLOSE)}
        </button>
      </div>
    </ModalBackdrop>
  );
}
