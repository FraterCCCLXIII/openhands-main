import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TeamClient } from "#/chat-transport/nostr";
import { I18nKey } from "#/i18n/declaration";
import { useOpenHandsReply } from "#/hooks/team-chat/use-openhands-reply";
import {
  selectMyAgents,
  useTeamChatStore,
  type ReplyMode,
} from "#/stores/team-chat-store";
import {
  pendingAgentRequests,
  requestText,
  type AgentRequest,
} from "#/utils/team-chat-inbox";
import { cn } from "#/utils/utils";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "./team-chat-ui";

/** The requests that wait on me, with the agent's "waiting" reply posted once for each. */
export function useAgentRequests(client: TeamClient) {
  const account = useTeamChatStore((s) => s.account);
  const agents = useTeamChatStore(selectMyAgents);
  const requests = useTeamChatStore((s) => s.requests);
  const setRequestProgress = useTeamChatStore((s) => s.setRequestProgress);
  const { t } = useTranslation("openhands");
  const messages = client.messages();
  const pending = useMemo(
    () =>
      account
        ? pendingAgentRequests({
            messages,
            myPubkey: account.pubkey,
            agents,
            requests,
          })
        : [],

    [messages.length, account, agents, requests],
  );
  // Keys already being acknowledged, so a re-render cannot post the reply twice.
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    if (!account) return;
    pending
      .filter((r) => !r.acknowledged && !inFlight.current.has(r.key))
      .forEach((r) => {
        inFlight.current.add(r.key);
        setRequestProgress(r.key, "acknowledged");
        client
          .post(t(I18nKey.TEAM_CHAT$WAITING_POST, { owner: account.name }), {
            parent: r.message.id,
            as: r.agent,
          })
          .catch(() => undefined);
      });
  }, [pending, account, client, setRequestProgress, t]);

  return pending;
}

function RequestCard({
  request,
  client,
}: {
  request: AgentRequest;
  client: TeamClient;
}) {
  const { t } = useTranslation("openhands");
  const account = useTeamChatStore((s) => s.account);
  const mode = useTeamChatStore((s) => s.replyModes[request.agent.pubkey]);
  const setRequestProgress = useTeamChatStore((s) => s.setRequestProgress);
  const askOpenHands = useOpenHandsReply();
  const [busy, setBusy] = useState(false);
  const owner = account?.name ?? "";
  const asker = client.nameOf(request.message.pubkey);
  const text = requestText(request.message.text, [request.agent.name]);

  const say = (body: string) =>
    client.post(body, { parent: request.message.id, as: request.agent });

  const decline = async () => {
    setBusy(true);
    await say(t(I18nKey.TEAM_CHAT$DECLINED_POST, { owner })).catch(
      () => undefined,
    );
    setRequestProgress(request.key, "done");
  };

  const approve = async () => {
    setBusy(true);
    try {
      if (mode === "openhands") {
        const reply = await askOpenHands(text);
        const link = `${window.location.origin}/conversations/${reply.conversationId}`;
        await say(
          `${reply.text}\n\n${t(I18nKey.TEAM_CHAT$CONVERSATION_LINK, { url: link })}`,
        );
      } else {
        await say(
          t(I18nKey.TEAM_CHAT$DEMO_REPLY, {
            request: text,
            agent: request.agent.name,
          }),
        );
      }
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      await say(t(I18nKey.TEAM_CHAT$OH_FAILED, { reason })).catch(
        () => undefined,
      );
    }
    setRequestProgress(request.key, "done");
  };

  return (
    <li
      data-testid="agent-request"
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
    >
      <p className="text-xs text-muted">
        {t(I18nKey.TEAM_CHAT$REQUEST_FROM, {
          name: asker,
          agent: request.agent.name,
        })}{" "}
        · {new Date(request.message.createdAt * 1000).toLocaleTimeString()}
      </p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{text}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={busy}
          onClick={() => void approve()}
        >
          {busy ? t(I18nKey.TEAM_CHAT$RUNNING) : t(I18nKey.TEAM_CHAT$APPROVE)}
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          disabled={busy}
          onClick={() => void decline()}
        >
          {t(I18nKey.TEAM_CHAT$DECLINE)}
        </button>
      </div>
    </li>
  );
}

export function AgentInbox({
  client,
  pending,
}: {
  client: TeamClient;
  pending: AgentRequest[];
}) {
  const { t } = useTranslation("openhands");
  return (
    <section data-testid="agent-inbox" className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-contrast">
        {t(I18nKey.TEAM_CHAT$AGENT_REQUESTS)}
      </h3>
      {pending.length === 0 ? (
        <p className="text-xs text-muted">{t(I18nKey.TEAM_CHAT$NO_REQUESTS)}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((r) => (
            <RequestCard key={r.key} request={r} client={client} />
          ))}
        </ul>
      )}
    </section>
  );
}

const MODES: Array<{ id: ReplyMode; label: I18nKey }> = [
  { id: "demo", label: I18nKey.TEAM_CHAT$DEMO_AGENT },
  { id: "openhands", label: I18nKey.TEAM_CHAT$OPENHANDS_AGENT },
];

/** The "Reply with" switch for one agent. */
export function ReplyModeSwitch({ agentPubkey }: { agentPubkey: string }) {
  const { t } = useTranslation("openhands");
  const mode = useTeamChatStore((s) => s.replyModes[agentPubkey] ?? "demo");
  const setReplyMode = useTeamChatStore((s) => s.setReplyMode);
  return (
    <div
      role="radiogroup"
      aria-label={t(I18nKey.TEAM_CHAT$REPLY_WITH)}
      className="flex items-center gap-1 text-xs"
    >
      <span className="text-muted">{t(I18nKey.TEAM_CHAT$REPLY_WITH)}</span>
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          onClick={() => setReplyMode(agentPubkey, id)}
          className={cn(
            "rounded-md px-2 py-1",
            mode === id
              ? "bg-surface-raised text-contrast"
              : "text-muted hover:text-contrast",
          )}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}
