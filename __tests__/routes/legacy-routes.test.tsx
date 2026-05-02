import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('renders the legacy whitepaper page with the live copy and iframe-boundary form semantics', () => {
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
    expect(screen.getByTitle('Download whitepaper form')).toBeInTheDocument();
    expect(main.querySelector('form, input, select, button')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download Local GUI' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup'
    );
  });

  it('reveals the legacy whitepaper direct download after the embedded form reports success', async () => {
    renderRoute(<WhitepaperModernizeLegacySystemsWithAiAgents />);

    fireEvent(
      window,
      new MessageEvent('message', {
        data: { type: 'openhands:whitepaper-form-submitted' },
      })
    );

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Download the Whitepaper'));

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
