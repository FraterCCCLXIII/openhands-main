import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TeamClient, TeamMember } from "#/chat-transport/nostr";
import { shortNpub } from "#/chat-transport/nostr/keys";
import { I18nKey } from "#/i18n/declaration";
import { useTeamClient } from "#/hooks/team-chat/use-team-client";
import { selectMyAgents, useTeamChatStore } from "#/stores/team-chat-store";
import { useTeamStore } from "#/stores/team-chat-store-context";
import { AddMemberModal } from "./add-member-modal";
import { AgentInbox, ReplyModeSwitch, useAgentRequests } from "./agent-inbox";
import { TeamChatThread } from "./team-chat-thread";
import {
  CopyField,
  ErrorNote,
  Initials,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "./team-chat-ui";
import { MODAL_MAX_WIDTH_VIEWPORT } from "#/components/shared/modals/modal-body";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

function MemberRow({
  member,
  client,
}: {
  member: TeamMember;
  client: TeamClient;
}) {
  const { t } = useTranslation("openhands");
  const isMe = member.pubkey === client.account.pubkey;
  return (
    <li data-testid="team-member" className="flex items-center gap-2">
      <Initials name={member.name} agent={member.kind === "agent"} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1">
          <span className="truncate text-sm text-contrast">{member.name}</span>
          {isMe && <Badge>{t(I18nKey.TEAM_CHAT$YOU)}</Badge>}
          {member.roles.includes("admin") && (
            <Badge>{t(I18nKey.TEAM_CHAT$ADMIN)}</Badge>
          )}
          {member.kind === "agent" && (
            <Badge>{t(I18nKey.TEAM_CHAT$AGENT)}</Badge>
          )}
        </div>
        <p className="truncate font-mono text-xs text-muted">
          {shortNpub(member.pubkey)}
          {member.kind === "agent" && member.owner
            ? ` · ${t(I18nKey.TEAM_CHAT$RUNS_FOR, { owner: client.nameOf(member.owner) })}`
            : ""}
        </p>
      </div>
    </li>
  );
}

function MyAgents({
  client,
  waiting,
}: {
  client: TeamClient;
  waiting: Record<string, number>;
}) {
  const { t } = useTranslation("openhands");
  const agents = useTeamStore(selectMyAgents);
  const addAgentToStore = useTeamStore((s) => s.addAgent);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const agent = await client.addAgent(name.trim());
      addAgentToStore(agent);
      setName("");
      setAdding(false);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section data-testid="my-agents" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-contrast">
          {t(I18nKey.TEAM_CHAT$MY_AGENTS)}
        </h3>
        <button
          type="button"
          className="text-xs text-muted hover:text-contrast"
          onClick={() => setAdding((v) => !v)}
        >
          {t(I18nKey.TEAM_CHAT$NEW_AGENT)}
        </button>
      </div>
      {adding && (
        <div className="flex flex-col gap-2">
          <input
            aria-label={t(I18nKey.TEAM_CHAT$AGENT_NAME)}
            placeholder={t(I18nKey.TEAM_CHAT$AGENT_NAME)}
            className={inputClassName}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <ErrorNote error={error} />
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={busy || !name.trim()}
            onClick={() => void create()}
          >
            {t(I18nKey.TEAM_CHAT$CREATE_AGENT)}
          </button>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {agents.map((agent) => (
          <li
            key={agent.pubkey}
            data-testid="my-agent"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-contrast">{agent.name}</span>
              <span className="text-xs text-muted">
                {t(I18nKey.TEAM_CHAT$WAITING_COUNT, {
                  count: waiting[agent.pubkey] ?? 0,
                })}
              </span>
            </div>
            <p className="truncate font-mono text-xs text-muted">
              {agent.npub}
            </p>
            <ReplyModeSwitch agentPubkey={agent.pubkey} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SignOutDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("openhands");
  const account = useTeamChatStore((s) => s.account);
  const signOut = useTeamChatStore((s) => s.signOut);
  if (!account) return null;
  return (
    <ModalBackdrop onClose={onClose} aria-label={t(I18nKey.TEAM_CHAT$SIGN_OUT)}>
      <div
        className={`flex w-110 ${MODAL_MAX_WIDTH_VIEWPORT} flex-col gap-4 rounded-xl border border-border bg-surface-raised p-5`}
      >
        <p className="text-sm text-foreground">
          {t(I18nKey.TEAM_CHAT$SIGN_OUT_CONFIRM)}
        </p>
        <CopyField
          secret
          label={t(I18nKey.TEAM_CHAT$COPY_KEY_BACKUP)}
          value={account.nsec}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className={primaryButtonClassName}
            onClick={signOut}
          >
            {t(I18nKey.TEAM_CHAT$SIGN_OUT)}
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            {t(I18nKey.TEAM_CHAT$CANCEL)}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/** The team screen for a connected team, or for the in-memory sample team when `sample` is set. */
export function Workspace({
  client,
  sample = false,
}: {
  client: TeamClient;
  sample?: boolean;
}) {
  const { t } = useTranslation("openhands");
  const [adding, setAdding] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pending = useAgentRequests(client);
  const waiting = pending.reduce<Record<string, number>>((acc, r) => {
    acc[r.agent.pubkey] = (acc[r.agent.pubkey] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div data-testid="team-chat-workspace" className="flex h-full">
      <aside className="custom-scrollbar flex w-72 shrink-0 flex-col gap-5 overflow-y-auto border-r border-border p-4">
        <h1 className="text-lg font-medium text-contrast">{client.name}</h1>
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-contrast">
              {t(I18nKey.TEAM_CHAT$MEMBERS)}
            </h3>
            <button
              type="button"
              className="text-xs text-muted hover:text-contrast"
              onClick={() => setAdding(true)}
            >
              {t(I18nKey.TEAM_CHAT$ADD_MEMBER)}
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {client.members().map((m) => (
              <MemberRow key={m.pubkey} member={m} client={client} />
            ))}
          </ul>
        </section>
        <MyAgents client={client} waiting={waiting} />
        <AgentInbox client={client} pending={pending} />
        {sample ? null : (
          <button
            type="button"
            className="mt-auto text-left text-xs text-muted hover:text-contrast"
            onClick={() => setSigningOut(true)}
          >
            {t(I18nKey.TEAM_CHAT$SIGN_OUT)}
          </button>
        )}
      </aside>
      <TeamChatThread client={client} />
      {adding && (
        <AddMemberModal client={client} onClose={() => setAdding(false)} />
      )}
      {signingOut && <SignOutDialog onClose={() => setSigningOut(false)} />}
    </div>
  );
}

/** The signed-in team screen. Opens the team on the relay, then shows the workspace. */
export function TeamChatWorkspace() {
  const { t } = useTranslation("openhands");
  const { client, status, error } = useTeamClient();
  const signOut = useTeamChatStore((s) => s.signOut);
  if (status === "error") {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <ErrorNote error={error} />
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={signOut}
        >
          {t(I18nKey.TEAM_CHAT$SIGN_OUT)}
        </button>
      </div>
    );
  }
  if (!client) {
    return (
      <p className="p-6 text-sm text-muted">{t(I18nKey.TEAM_CHAT$WORKING)}</p>
    );
  }
  return <Workspace client={client} />;
}
