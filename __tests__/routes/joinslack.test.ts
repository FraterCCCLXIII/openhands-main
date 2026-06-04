import { describe, expect, it } from 'vitest';
import { loader } from '../../src/routes/joinslack';

describe('JoinSlack route', () => {
  it('matches the live site redirect target and status code', () => {
    const response = loader();

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://go.openhands.dev/slack');
  });
});
