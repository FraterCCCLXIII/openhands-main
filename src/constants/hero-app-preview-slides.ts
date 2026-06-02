import type { HeroAppPreviewSlide } from '~/components/hero-app-preview';

const AGENT_CANVAS_ASSET = '/assets/agent-canvas';

export const HERO_APP_PREVIEW_SLIDES: HeroAppPreviewSlide[] = [
  {
    src: `${AGENT_CANVAS_ASSET}/01-home-conversations.png`,
    alt: 'OpenHands Agent Canvas home with conversations',
  },
  {
    src: `${AGENT_CANVAS_ASSET}/02-conversation-chat.png`,
    alt: 'OpenHands Agent Canvas conversation view',
  },
  {
    src: `${AGENT_CANVAS_ASSET}/06-automations-list.png`,
    alt: 'OpenHands Agent Canvas automations list',
  },
  {
    src: `${AGENT_CANVAS_ASSET}/07-automation-detail.png`,
    alt: 'OpenHands Agent Canvas automation detail',
  },
  {
    src: `${AGENT_CANVAS_ASSET}/08-skills.png`,
    alt: 'OpenHands Agent Canvas skills',
  },
  {
    src: `${AGENT_CANVAS_ASSET}/09-mcp.png`,
    alt: 'OpenHands Agent Canvas MCP integrations',
  },
];
