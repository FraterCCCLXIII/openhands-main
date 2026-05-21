import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import NotFoundRoute, {
  handle as notFoundHandle,
  loader as notFoundLoader,
  meta as notFoundMeta,
} from '../../src/routes/not-found';
import WhitepaperModernizeLegacySystemsWithAiAgents, {
  meta as whitepaperMeta,
} from '../../src/routes/whitepapers.modernize-legacy-systems-with-ai-agents';

type MetaEntry = Record<string, unknown>;

const renderRoute = (element: ReactElement) => render(<MemoryRouter>{element}</MemoryRouter>);

const getTitle = (entries: MetaEntry[]) =>
  entries.find((entry) => 'title' in entry)?.title;

const findEntry = (entries: MetaEntry[], key: string, value: string) =>
  entries.find((entry) => entry[key] === value);

describe('legacy routes parity', () => {
  it('renders the legacy whitepaper page with the live copy and native HubSpot form embed', () => {
    renderRoute(<WhitepaperModernizeLegacySystemsWithAiAgents />);
    const main = screen.getByRole('main');

    expect(
      screen.getByRole('heading', {
        name: 'Whitepaper: Modernize legacy systems before your expertise disappears',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Legacy modernization projects fail 74% of the time and the engineers who understand your COBOL/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /What you'll learn in the whitepaper:/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('How dependency-aware orchestration unlocks safe parallel refactoring')
    ).toBeInTheDocument();
    expect(main.querySelector('script[src="https://js.hsforms.net/forms/embed/50790961.js"]')).toBeInTheDocument();
    expect(main.querySelector('.hs-form-frame')).toHaveAttribute('data-region', 'na1');
    expect(main.querySelector('.hs-form-frame')).toHaveAttribute('data-portal-id', '50790961');
    expect(main.querySelector('.hs-form-frame')).toHaveAttribute('data-form-id', '4426798e-b2ea-48ec-b9ee-e314cbeda890');
    expect(screen.getByRole('link', { name: 'Download Local GUI' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup'
    );
  });

  it('reveals the legacy whitepaper direct download after the native HubSpot form reports success', () => {
    renderRoute(<WhitepaperModernizeLegacySystemsWithAiAgents />);

    act(() => {
      window.dispatchEvent(new Event('hs-form-event:on-submission:success'));
    });

    expect(screen.getByRole('status')).toHaveTextContent('Download the Whitepaper');

    expect(screen.getByRole('link', { name: 'Download now' })).toHaveAttribute(
      'href',
      '/assets/webflow/whitepapers/openhands-whitepaper.pdf'
    );
  });

  it('returns the live-style branded not found content and metadata', () => {
    const response = notFoundLoader() as any;
    const entries = notFoundMeta({} as any) as MetaEntry[];

    const { container } = renderRoute(<NotFoundRoute />);

    expect(response.init?.status ?? response.status).toBe(404);
    expect(getTitle(entries)).toBe('Not Found');
    expect(notFoundHandle).toEqual({ hideGlobalFooter: true });
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Page Not Found',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("The page you are looking for doesn't exist or has been moved")
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('uses live metadata for the whitepaper route', () => {
    const entries = whitepaperMeta({
      location: { pathname: '/whitepapers/modernize-legacy-systems-with-ai-agents' },
    } as any) as MetaEntry[];

    expect(getTitle(entries)).toBe(
      'Modernize Legacy Systems with AI Agents | OpenHands Whitepaper'
    );
    expect(findEntry(entries, 'name', 'description')?.content).toBe(
      "74% of legacy modernization projects fail. Learn how OpenHands uses AI agents and dependency-aware orchestration to safely migrate COBOL and large codebases at enterprise scale. Download the whitepaper and apply for the Q2 2026 PoC."
    );
    expect(findEntry(entries, 'rel', 'canonical')?.href).toBe(
      'https://openhands.dev/whitepapers/modernize-legacy-systems-with-ai-agents'
    );
  });
});
