export const PRODUCT_CANVAS_ACP_SPEC_URL = 'https://agentclientprotocol.com/';
export const PRODUCT_CANVAS_ACP_LEARN_MORE_URL =
  'https://docs.openhands.dev/openhands/usage/run-openhands/acp';

export type ProductCanvasAcpAgentIcon = 'claude' | 'codex' | 'gemini' | 'openhands';

export type ProductCanvasAcpAgent = {
  name: string;
  provider: string;
  subtitle: string;
  icon: ProductCanvasAcpAgentIcon;
};

export const PRODUCT_CANVAS_ACP_AGENTS: ProductCanvasAcpAgent[] = [
  {
    name: 'Claude Code',
    provider: 'Anthropic',
    subtitle: 'use your existing subscription',
    icon: 'claude',
  },
  {
    name: 'Codex',
    provider: 'OpenAI',
    subtitle: 'use your existing subscription',
    icon: 'codex',
  },
  {
    name: 'Gemini CLI',
    provider: 'Google',
    subtitle: 'use your existing subscription',
    icon: 'gemini',
  },
  {
    name: 'OpenHands Agent',
    provider: 'Open source',
    subtitle: 'bring your own LLM key',
    icon: 'openhands',
  },
];
