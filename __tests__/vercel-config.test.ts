import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Vercel redirect configuration', () => {
  it('should have correct redirect configuration for hackathon paths', () => {
    // Read the vercel.json file
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    
    // Find the nyc and nycslides redirects
    const nycRedirect = vercelConfig.redirects.find((redirect: any) => redirect.source === '/nyc');
    const nycslidesRedirect = vercelConfig.redirects.find((redirect: any) => redirect.source === '/nycslides');
    
    // Verify both redirects exist and point to homepage
    expect(nycRedirect).toBeDefined();
    expect(nycRedirect.destination).toBe('/');
    expect(nycRedirect.permanent).toBe(true);
    
    expect(nycslidesRedirect).toBeDefined();
    expect(nycslidesRedirect.destination).toBe('/');
    expect(nycslidesRedirect.permanent).toBe(true);
    
    // Verify they don't point to external hackathon URLs anymore
    expect(nycRedirect.destination).not.toContain('github.com');
    expect(nycRedirect.destination).not.toContain('docs.google.com');
    expect(nycslidesRedirect.destination).not.toContain('github.com');
    expect(nycslidesRedirect.destination).not.toContain('docs.google.com');
  });
});