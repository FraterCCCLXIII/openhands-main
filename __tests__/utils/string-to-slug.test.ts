import { expect, test } from 'vitest';
import { stringToSlug } from '../../src/utils/string-to-slug';

test('stringToSlug', () => {
  expect(stringToSlug('Introducing All Hands AI')).toBe('introducing-all-hands-ai');
  expect(
    stringToSlug('Levels of Autonomy in AI-enhanced Software Engineering!!:@!@#')
  ).toBe('levels-of-autonomy-in-ai-enhanced-software-engineering');
  expect(
    stringToSlug('Introducing OpenHands LM 32B -- A Strong, Open Coding Agent Model')
  ).toBe('introducing-openhands-lm-32b-a-strong-open-coding-agent-model');
});
