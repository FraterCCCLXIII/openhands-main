import {
  TeamChatGate,
  TeamChooser,
} from "#/components/features/team-chat/team-chat-gate";
import { TeamChatWorkspace } from "#/components/features/team-chat/team-chat-workspace";
import { useTeamChatStore } from "#/stores/team-chat-store";

function TeamChatScreen() {
  const account = useTeamChatStore((s) => s.account);
  const groupId = useTeamChatStore((s) => s.groupId);
  let body = <TeamChatGate />;
  if (account && !groupId) body = <TeamChooser account={account} />;
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
