import { KamijiAgentAvatar } from "#/components/features/kamiji/kamiji-agent-avatar";
import type { TeamMember } from "#/chat-transport/nostr";
import { cn } from "#/utils/utils";
import { Initials } from "./team-chat-ui";

/**
 * A member's avatar: a Kamiji Mochi for an agent, one per agent name, and initials for a person,
 * with a presence dot when we know whether they are around.
 */
export function MemberAvatar({
  member,
  size = 28,
}: {
  member: Pick<TeamMember, "name" | "kind" | "online">;
  size?: number;
}) {
  const agent = member.kind === "agent";
  return (
    <span
      className="relative inline-flex shrink-0"
      data-testid={agent ? "member-avatar-agent" : "member-avatar-person"}
    >
      {agent ? (
        <KamijiAgentAvatar name={member.name} size={size} />
      ) : (
        <Initials name={member.name} />
      )}
      {member.online !== undefined ? (
        <span
          data-testid="presence-dot"
          data-online={member.online}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-base-secondary",
            member.online ? "bg-success" : "bg-muted",
          )}
        />
      ) : null}
    </span>
  );
}
