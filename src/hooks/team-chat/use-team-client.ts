import { useEffect, useState } from "react";
import { TeamClient } from "#/chat-transport/nostr";
import { selectMyAgents, useTeamChatStore } from "#/stores/team-chat-store";

export type TeamClientStatus = "connecting" | "ready" | "error";

/**
 * Opens the signed-in person's team on the relay and re-renders whenever members or
 * messages change. The store's agents are adopted so they can post as themselves.
 */
export function useTeamClient() {
  const account = useTeamChatStore((s) => s.account);
  const relayUrl = useTeamChatStore((s) => s.relayUrl);
  const groupId = useTeamChatStore((s) => s.groupId);
  const [client, setClient] = useState<TeamClient | null>(null);
  const [status, setStatus] = useState<TeamClientStatus>("connecting");
  const [error, setError] = useState<unknown>(null);
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!account || !groupId) return undefined;
    let cancelled = false;
    let opened: TeamClient | null = null;
    let stop: (() => void) | null = null;
    setStatus("connecting");
    setError(null);
    TeamClient.open({ relayUrl, groupId, account })
      .then((c) => {
        if (cancelled) {
          c.close();
          return;
        }
        opened = c;
        selectMyAgents(useTeamChatStore.getState()).forEach((a) =>
          c.adoptAgent(a),
        );
        stop = c.onChange(() => setVersion((v) => v + 1));
        setClient(c);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e);
        setStatus("error");
      });
    return () => {
      cancelled = true;
      stop?.();
      opened?.close();
      setClient(null);
    };
  }, [account, relayUrl, groupId]);

  return { client, status, error };
}
