import { AgentBrandIcon } from "#/components/shared/agent-brand-icon";
import type { FeedAgent } from "#/utils/feed-agent";
import { agentIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";
import { FeedCustomIcon } from "./feed-custom-icon";

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
  const avatar = (
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
  // Only the simulated personas can be customized; the real brand mark stays.
  if (!agent.demo) return avatar;
  return (
    <FeedCustomIcon
      iconKey={agentIconKey(`demo:${agent.demo.name}`)}
      size={size}
      radius={size / 2}
      glyph={<agent.demo.Icon size={glyphSize} />}
      fallback={avatar}
    />
  );
}
