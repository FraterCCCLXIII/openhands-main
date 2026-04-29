const BLOG_SLUG_ALIASES: Record<string, string> = {
  '20260216-swefficiency-benchmark':
    'swe-fficiency-evaluating-how-to-fix-code-not-just-what-to-fix',
  '20251218-openhands-toad-collaboration':
    'openhands-partners-with-toad-a-universal-terminal-interface-for-ai-agents',
  'introducing-openhands-lm-32b-a-strong-open-coding-agent-model':
    'introducing-openhands-lm-32b----a-strong-open-coding-agent-model',
  '20251202-agents-in-the-outer-loop': 'agents-in-the-outer-loop',
  '20251209-use-openhands-in-your-ide-with-acp':
    'use-openhands-in-your-favorite-editor-through-the-agent-client-protocol',
  '20251218-cobol-to-java-refactoring':
    'refactoring-cobol-to-java-with-ai-agents',
  '20260219-velocity-is-dead':
    'velocity-is-dead-ai-generated-compilers-and-the-future-of-software',
  '20251119-amd-ryzen-ai-collaboration':
    'host-your-own-coding-agents-with-openhands-using-amd-ryzen-ai',
  'introducing-openhands-lm-32b----a-strong-open-coding-agent-model':
    'introducing-openhands-lm-32b-a-strong-open-coding-agent-model',
  'use-ai-agents-in-your-favorite-editor-through-the-agent-client-protocol':
    '20251209-use-openhands-in-your-ide-with-acp',
};

export const resolveBlogSlug = (slug: string) => BLOG_SLUG_ALIASES[slug] ?? slug;

export const getOpenHandsBlogUrl = (slug: string) =>
  `https://openhands.dev/blog/${slug}`;
