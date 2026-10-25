import { KamijiLookAvatar } from "#/components/features/kamiji/kamiji-look-avatar";
import { getKamijiColor } from "#/components/features/kamiji/kamiji-expressions";
import {
  statusLookKey,
  type KamijiLookKey,
} from "#/components/features/kamiji/kamiji-look";
import type { ExecutionStatus } from "#/types/agent-server/core/base/common";
import type { FeedAgent } from "#/utils/feed-agent";
import { cn } from "#/utils/utils";

interface FeedAgentAvatarProps {
  agent: FeedAgent;
  /** Avatar diameter in px. */
  size: number;
  /** Execution status of the conversation the avatar sits on; sets the Kamiji's mood. */
  status?: ExecutionStatus | null;
  /** Explicit look (a notification or update kind); wins over `status`. */
  look?: KamijiLookKey;
  className?: string;
  "data-testid"?: string;
}

/** Round agent avatar: a little Kamiji, tinted per agent, whose mood follows the look. */
export function FeedAgentAvatar({
  agent,
  size,
  status,
  look,
  className,
  "data-testid": testId,
}: FeedAgentAvatarProps) {
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
      <KamijiLookAvatar
        size={size}
        color={getKamijiColor(agent.name)}
        look={look ?? statusLookKey(status)}
      />
    </span>
  );
}
