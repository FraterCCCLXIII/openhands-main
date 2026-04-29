import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import routes from '../../src/routes';

describe('mirror route cleanup', () => {
  it('does not reference mirror routes in the route config', () => {
    expect(JSON.stringify(routes)).not.toContain('mirror-');
  });

  it('does not keep mirror route files or the shared mirror helper in the repo', () => {
    const routeDir = join(process.cwd(), 'src/routes');
    const mirrorRouteFiles = readdirSync(routeDir).filter((name) => name.startsWith('mirror-'));

    expect(mirrorRouteFiles).toEqual([]);
    expect(existsSync(join(process.cwd(), 'src/utils/webflow-mirror-route.tsx'))).toBe(false);
  });
});
