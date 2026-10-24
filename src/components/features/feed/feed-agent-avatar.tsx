import { AgentBrandIcon } from "#/components/shared/agent-brand-icon";
import type { FeedAgent } from "#/utils/feed-agent";
import { cn } from "#/utils/utils";

interface FeedAgentAvatarProps {
  agent: FeedAgent;
  /** Avatar diameter in px. */
  size: number;
  className?: string;
  "data-testid"?: string;
}

/** Round agent avatar: the simulated persona's icon in demo mode, else the brand mark. */
export function FeedAgentAvatar({
  agent,
  size,
  className,
  "data-testid": testId,
}: FeedAgentAvatarProps) {
  const glyphSize = Math.round(size * 0.5);
  return (
    <span
      data-testid={testId}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        agent.demo?.className ?? "bg-surface text-contrast",
        className,
      )}
      ref={(el) => {
        el?.style.setProperty("width", `${size}px`);
        el?.style.setProperty("height", `${size}px`);
      }}
    >
      {agent.demo ? (
        <agent.demo.Icon size={glyphSize} />
      ) : (
        <AgentBrandIcon kind={agent.icon} size={glyphSize} />
      )}
    </span>
  );
}
