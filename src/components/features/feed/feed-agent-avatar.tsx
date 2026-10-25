import { KamijiAvatar } from "#/components/features/kamiji/kamiji-avatar";
import { getKamijiColor } from "#/components/features/kamiji/kamiji-expressions";
import type { ExecutionStatus } from "#/types/agent-server/core/base/common";
import type { FeedAgent } from "#/utils/feed-agent";
import { cn } from "#/utils/utils";
import { getFeedAgentLook } from "./feed-agent-look";

interface FeedAgentAvatarProps {
  agent: FeedAgent;
  /** Avatar diameter in px. */
  size: number;
  /** Execution status of the conversation the avatar sits on; sets the Kamiji's mood. */
  status?: ExecutionStatus | null;
  className?: string;
  "data-testid"?: string;
}

/** Round agent avatar: a little Kamiji, tinted per agent, whose mood follows the status. */
export function FeedAgentAvatar({
  agent,
  size,
  status,
  className,
  "data-testid": testId,
}: FeedAgentAvatarProps) {
  const look = getFeedAgentLook(status);
  return (
    <span
      data-testid={testId}
      className={cn(
        "flex shrink-0 items-center justify-center",
        agent.demo?.className,
        className,
      )}
      ref={(el) => {
        el?.style.setProperty("width", `${size}px`);
        el?.style.setProperty("height", `${size}px`);
      }}
    >
      <KamijiAvatar
        size={size}
        color={getKamijiColor(agent.name)}
        expression={look.expression}
        animation={look.animation}
      />
    </span>
  );
}
