import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import {
  TeamChatGate,
  TeamChooser,
} from "#/components/features/team-chat/team-chat-gate";
import {
  TeamChatWorkspace,
  Workspace,
} from "#/components/features/team-chat/team-chat-workspace";
import { createSampleTeam } from "#/chat-transport/nostr/demo-client";
import { I18nKey } from "#/i18n/declaration";
import {
  createSampleTeamChatStore,
  useTeamChatStore,
} from "#/stores/team-chat-store";
import { TeamChatStoreProvider } from "#/stores/team-chat-store-context";

/**
 * Before you are in a team, the real team screen shows behind the dialog with a sample
 * team in it. Close the dialog to look around; nothing there is sent or saved.
 */
function SampleBehindDialog({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = useState(true);
  const sample = useMemo(() => createSampleTeam(), []);
  const store = useMemo(
    () =>
      createSampleTeamChatStore({
        account: sample.me,
        groupId: "demo",
        agentsByOwner: sample.agentsByOwner,
        requests: sample.requests,
      }),
    [sample],
  );
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="relative flex h-full flex-col">
      {open ? null : (
        <div
          data-testid="team-chat-sample-banner"
          className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2 text-xs text-muted"
        >
          <span className="rounded-full bg-surface-raised px-2 py-0.5 font-medium text-contrast">
            {t(I18nKey.TEAM_CHAT$SAMPLE_BADGE)}
          </span>
          <span>{t(I18nKey.TEAM_CHAT$SAMPLE_BANNER)}</span>
          <button
            type="button"
            data-testid="team-chat-sample-open"
            className="ml-auto rounded-lg bg-contrast px-3 py-1 font-medium text-contrast-foreground hover:opacity-90"
            onClick={() => setOpen(true)}
          >
            {t(I18nKey.TEAM_CHAT$SAMPLE_OPEN)}
          </button>
        </div>
      )}
      <div
        className="min-h-0 flex-1"
        aria-hidden={open}
        inert={open ? true : undefined}
      >
        <TeamChatStoreProvider value={store}>
          <Workspace client={sample.client} sample />
        </TeamChatStoreProvider>
      </div>
      {open ? (
        <div
          data-testid="team-chat-overlay"
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t(I18nKey.TEAM_CHAT$TITLE)}
            className="custom-scrollbar relative flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-border bg-base-secondary shadow-2xl"
          >
            <button
              type="button"
              data-testid="team-chat-dismiss"
              aria-label={t(I18nKey.BUTTON$CLOSE)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:bg-surface-raised hover:text-contrast"
              onClick={() => setOpen(false)}
            >
              <X size={16} aria-hidden />
            </button>
            {children}
            <div className="flex items-center justify-center gap-2 border-t border-border px-6 py-3">
              <button
                type="button"
                data-testid="team-chat-explore"
                className="text-sm text-muted underline-offset-2 hover:text-contrast hover:underline"
                onClick={() => setOpen(false)}
              >
                {t(I18nKey.TEAM_CHAT$EXPLORE_SAMPLE)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TeamChatScreen() {
  const account = useTeamChatStore((s) => s.account);
  const groupId = useTeamChatStore((s) => s.groupId);
  let body = (
    <SampleBehindDialog>
      <TeamChatGate />
    </SampleBehindDialog>
  );
  if (account && !groupId) {
    body = (
      <SampleBehindDialog>
        <TeamChooser account={account} />
      </SampleBehindDialog>
    );
  }
  if (account && groupId) body = <TeamChatWorkspace />;
  return (
    <div
      data-testid="team-chat-screen"
      className="h-full overflow-hidden rounded-xl bg-transparent"
    >
      {body}
    </div>
  );
}

export default TeamChatScreen;
