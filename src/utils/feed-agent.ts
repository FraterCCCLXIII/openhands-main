import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import {
  getAcpProviderDisplayName,
  resolveAcpProviderIcon,
} from "#/constants/acp-providers";
import type { AgentBrandIconKind } from "#/components/shared/agent-brand-icon";
import { pickFeedDemoAgent, type FeedDemoAgent } from "./feed-demo-agents";

const OPENHANDS_AGENT_NAME = "OpenHands";
const GENERIC_ACP_AGENT_NAME = "ACP";

export interface FeedAgent {
  name: string;
  icon: AgentBrandIconKind;
  /** Set only for the simulated personas of the demo mode. */
  demo?: FeedDemoAgent;
}

/** The name and icon a feed card shows as the post's author. */
export function getFeedAgent(
  conversation: AppConversation,
  useDemoAgents = false,
): FeedAgent {
  if (useDemoAgents) {
    const demo = pickFeedDemoAgent(conversation.id);
    return { name: demo.name, icon: "openhands", demo };
  }
  if (conversation.agent_kind === "acp") {
    return {
      name:
        getAcpProviderDisplayName(conversation.acp_server) ??
        GENERIC_ACP_AGENT_NAME,
      icon: resolveAcpProviderIcon(conversation.acp_server),
    };
  }
  return { name: OPENHANDS_AGENT_NAME, icon: "openhands" };
}
