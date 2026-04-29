import { describe, expect, it } from 'vitest';
import {
  getOpenHandsBlogUrl,
  resolveBlogSlug,
} from '../../src/utils/blog-slug-aliases';

describe('blog slug aliases', () => {
  it('resolves known live-site aliases to local slugs', () => {
    expect(resolveBlogSlug('20260219-velocity-is-dead')).toBe(
      'velocity-is-dead-ai-generated-compilers-and-the-future-of-software'
    );
    expect(resolveBlogSlug('20251209-use-openhands-in-your-ide-with-acp')).toBe(
      'use-openhands-in-your-favorite-editor-through-the-agent-client-protocol'
    );
  });

  it('falls back to the original slug and builds live redirect URLs', () => {
    expect(resolveBlogSlug('devstral-a-new-state-of-the-art-open-model-for-coding-agents')).toBe(
      'devstral-a-new-state-of-the-art-open-model-for-coding-agents'
    );
    expect(getOpenHandsBlogUrl('evoclaw-benchmark')).toBe(
      'https://openhands.dev/blog/evoclaw-benchmark'
    );
  });
});
