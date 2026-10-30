import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import {
  TeamChatGate,
  TeamChooser,
} from "#/components/features/team-chat/team-chat-gate";
import {
  SampleNotice,
  TeamChatWorkspace,
  Workspace,
} from "#/components/features/team-chat/team-chat-workspace";
import { TeamChatWelcome } from "#/components/features/team-chat/team-chat-welcome";
import { createSampleTeam } from "#/chat-transport/nostr/demo-client";
import { I18nKey } from "#/i18n/declaration";
import {
  createSampleTeamChatStore,
  useTeamChatStore,
} from "#/stores/team-chat-store";
import { useTeamEntryStore } from "#/stores/team-chat-entry-store";
import { TeamChatStoreProvider } from "#/stores/team-chat-store-context";

type Stage = "welcome" | "dialog" | "sample";

/**
 * Before you are in a team: a welcome screen first, then the real team screen showing a sample team,
 * with the sign-in dialog over it. Close the dialog to look around; nothing there is sent or saved.
 */
function SignedOutTeamChat({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("openhands");
  // Arriving from the team switcher skips the welcome: straight to the sample or the form.
  const [stage, setStage] = useState<Stage>(() => {
    const { intent } = useTeamEntryStore.getState();
    if (intent === "sample") return "sample";
    return intent ? "dialog" : "welcome";
  });
  useEffect(() => {
    if (stage === "sample") useTeamEntryStore.getState().setIntent(null);
  }, [stage]);
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
    if (stage !== "dialog") return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStage("sample");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [stage]);

  if (stage === "welcome") {
    return (
      <TeamChatWelcome
        onStart={() => setStage("dialog")}
        onExplore={() => setStage("sample")}
      />
    );
  }
  const dialog = stage === "dialog";
  return (
    <div className="relative flex h-full flex-col">
      <div
        className="isolate min-h-0 flex-1"
        aria-hidden={dialog}
        inert={dialog ? true : undefined}
      >
        <TeamChatStoreProvider value={store}>
          <Workspace
            client={sample.client}
            sample
            onStartTeam={(mode) => {
              useTeamEntryStore.getState().setIntent(mode);
              setStage("dialog");
            }}
            sampleNotice={
              <SampleNotice
                onStart={() => setStage("dialog")}
                onWelcome={() => setStage("welcome")}
              />
            }
          />
        </TeamChatStoreProvider>
      </div>
      {dialog ? (
        <div
          data-testid="team-chat-overlay"
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setStage("sample");
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
              onClick={() => setStage("sample")}
            >
              <X size={16} aria-hidden />
            </button>
            {children}
            <div className="flex items-center justify-center gap-2 border-t border-border px-6 py-3">
              <button
                type="button"
                data-testid="team-chat-explore"
                className="text-sm text-muted underline-offset-2 hover:text-contrast hover:underline"
                onClick={() => setStage("sample")}
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
    <SignedOutTeamChat>
      <TeamChatGate />
    </SignedOutTeamChat>
  );
  if (account && !groupId) {
    body = (
      <SignedOutTeamChat>
        <TeamChooser account={account} />
      </SignedOutTeamChat>
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
