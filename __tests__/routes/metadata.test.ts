import { describe, expect, it } from 'vitest';
import { meta as blogMeta } from '../../src/routes/blog';
import { meta as blogPostMeta } from '../../src/routes/blog.$slug';
import { meta as featuresMeta } from '../../src/routes/features';
import { meta as homeMeta } from '../../src/routes/home';
import { meta as privacyMeta } from '../../src/routes/privacy-policy';
import { meta as disclosureMeta } from '../../src/routes/responsible-disclosure-policy';
import { meta as shareMeta } from '../../src/routes/share';
import { meta as tosMeta } from '../../src/routes/tos';
import { meta as whitepaperMeta } from '../../src/routes/whitepapers.modernize-legacy-systems-with-ai-agents';

type MetaEntry = Record<string, unknown>;

const getTitle = (entries: MetaEntry[]) =>
  entries.find((entry) => 'title' in entry)?.title;

const findEntry = (entries: MetaEntry[], key: string, value: string) =>
  entries.find((entry) => entry[key] === value);

describe('route metadata branding parity', () => {
  it('updates privacy and terms metadata to OpenHands branding', () => {
    const privacyEntries = (privacyMeta as any)({
      location: { pathname: '/privacy' },
    }) as MetaEntry[];
    const tosEntries = (tosMeta as any)({
      location: { pathname: '/tos' },
    }) as MetaEntry[];

    expect(getTitle(privacyEntries)).toBe('Privacy Policy');
    expect(findEntry(privacyEntries, 'name', 'description')?.content).toBe(
      'Learn how OpenHands and All Hands AI collect, use, and protect personal information across our website and services.'
    );
    expect(findEntry(privacyEntries, 'rel', 'canonical')?.href).toBe(
      'https://openhands.dev/privacy'
    );

    expect(getTitle(tosEntries)).toBe('Terms of Service');
    expect(findEntry(tosEntries, 'name', 'description')?.content).toBe(
      'OpenHands Terms of Service'
    );
    expect(findEntry(tosEntries, 'rel', 'canonical')?.href).toBe(
      'https://openhands.dev/tos'
    );

    expect(JSON.stringify({ privacyEntries, tosEntries })).not.toContain(
      'https://www.all-hands.dev'
    );
  });

  it('uses OpenHands metadata for secondary routes and shared trajectories', () => {
    const featuresEntries = (featuresMeta as any)({
      location: { pathname: '/features' },
    }) as MetaEntry[];
    const notFoundShareEntries = (shareMeta as any)({
      data: { status: 404 },
      location: { pathname: '/share' },
    }) as MetaEntry[];
    const loadedShareEntries = (shareMeta as any)({
      data: { meta: { agent: 'CodeAct', model: 'Claude Sonnet 4' } },
      location: { pathname: '/share' },
    }) as MetaEntry[];

    expect(getTitle(featuresEntries)).toBe('OpenHands Cloud');
    expect(findEntry(featuresEntries, 'rel', 'canonical')?.href).toBe(
      'https://openhands.dev/features'
    );

    expect(getTitle(notFoundShareEntries)).toBe('OpenHands Shared Trajectory');
    expect(getTitle(loadedShareEntries)).toBe(
      'OpenHands Shared Trajectory (CodeAct)'
    );
    expect(findEntry(loadedShareEntries, 'name', 'description')?.content).toBe(
      'View a shared OpenHands agent trajectory powered by Claude Sonnet 4.'
    );

    expect(
      JSON.stringify({ featuresEntries, notFoundShareEntries, loadedShareEntries })
    ).not.toContain('All Hands AI');
  });

  it('normalizes OpenHands canonical and publisher metadata', () => {
    const homeEntries = (homeMeta as any)({}) as MetaEntry[];
    const blogEntries = (blogMeta as any)({
      location: { pathname: '/blog' },
    }) as MetaEntry[];
    const blogPostEntries = (blogPostMeta as any)({
      data: {
        title: 'Test Post',
        excerpt: 'Test excerpt',
        ogImage:
          'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
        url: 'https://openhands.dev/blog/test-post',
        date: '2026-01-01',
        authors: [{ name: 'Jane Doe' }],
        cover:
          'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
        content: 'hello world',
      },
    }) as MetaEntry[];
    const disclosureEntries = (disclosureMeta as any)({
      location: { pathname: '/responsible-disclosure-policy' },
    }) as MetaEntry[];
    const whitepaperEntries = (whitepaperMeta as any)({
      location: { pathname: '/whitepapers/modernize-legacy-systems-with-ai-agents' },
    }) as MetaEntry[];

    expect(findEntry(homeEntries, 'rel', 'canonical')?.href).toBe(
      'https://openhands.dev'
    );
    expect(findEntry(blogEntries, 'rel', 'canonical')?.href).toBe(
      'https://openhands.dev/blog'
    );
    expect(findEntry(disclosureEntries, 'rel', 'canonical')?.href).toBe(
      'https://openhands.dev/responsible-disclosure-policy'
    );
    expect(findEntry(whitepaperEntries, 'rel', 'canonical')?.href).toBe(
      'https://openhands.dev/whitepapers/modernize-legacy-systems-with-ai-agents'
    );
    expect(findEntry(disclosureEntries, 'name', 'description')?.content).toBe(
      'OpenHands Responsible Disclosure Policy'
    );
    expect(findEntry(whitepaperEntries, 'name', 'description')?.content).toBe(
      '74% of legacy modernization projects fail. Learn how OpenHands uses AI agents and dependency-aware orchestration to safely migrate COBOL and large codebases at enterprise scale. Download the whitepaper and apply for the Q2 2026 PoC.'
    );

    expect(findEntry(blogPostEntries, 'property', 'og:site_name')?.content).toBe(
      'OpenHands'
    );
    expect(findEntry(whitepaperEntries, 'property', 'og:site_name')?.content).toBe(
      'OpenHands'
    );

    const structuredData = blogPostEntries.find(
      (entry) => 'script:ld+json' in entry
    )?.['script:ld+json'];

    expect(String(structuredData)).toContain('"name":"OpenHands"');
    expect(String(structuredData)).not.toContain('All Hands AI');
    expect(JSON.stringify(whitepaperEntries)).not.toContain('All Hands AI');
  });
});
