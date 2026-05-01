import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../../src/root';
import About from '../../src/routes/about';
import Contact from '../../src/routes/contact';
import Manifesto from '../../src/routes/manifesto';
import Press from '../../src/routes/press';

const renderRoute = (element: ReactElement) => {
  return render(<MemoryRouter>{element}</MemoryRouter>);
};

const renderInApp = (initialEntry: string, routePath: string, element: ReactElement) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <App />,
        children: [{ path: routePath, element }],
      },
    ],
    { initialEntries: [initialEntry] }
  );

  return render(<RouterProvider router={router} />);
};

describe('company information pages parity', () => {
  it('renders the synced about page team roster with live heading hierarchy', () => {
    const { container } = renderRoute(<About />);

    expect(screen.getByRole('heading', { level: 1, name: 'Empowering every team to build software autonomously.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Milestones' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Team' })).toBeInTheDocument();
    expect(screen.getByText('Built by developers, for developers.').tagName).toBe('P');
    expect(screen.getByRole('link', { name: 'Join us' })).toHaveAttribute('href', 'https://jobs.ashbyhq.com/OpenHands');
    expect(screen.getByText('Ash Clarke').tagName).toBe('P');
    expect(screen.getByText('Ben Solari').tagName).toBe('P');
    expect(screen.getByText('Product Manager').tagName).toBe('P');
    expect(screen.queryByRole('heading', { name: 'Built by developers, for developers.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'CEO' })).not.toBeInTheDocument();
    expect(container.querySelector('img[alt="Ash Clarke"]')).not.toBeInTheDocument();
    expect(screen.getByTestId('company-page-background')).toBeInTheDocument();
    expect(screen.getAllByTestId('member-card-media')[0]?.className).toContain('h-[190px]');
    expect(
      Array.from(container.querySelectorAll('article img')).every((image) =>
        image.getAttribute('src')?.startsWith('/assets/')
      )
    ).toBe(true);
  });

  it('renders the synced contact page copy, supporting sections, and paragraph-style form labels', () => {
    const { container } = renderRoute(<Contact />);

    expect(screen.getByRole('heading', { name: 'Talk to the OpenHands Team' })).toBeInTheDocument();
    expect(screen.getByText(/Get a custom demo and explore pricing, private deployments/)).toBeInTheDocument();
    expect(screen.getByText('Why enterprises choose OpenHands')).toBeInTheDocument();
    expect(screen.getByText('Trusted by engineers at')).toBeInTheDocument();
    expect(screen.getByText('Containerized sandbox runtime for safe autonomy').tagName).toBe('P');
    expect(screen.getByText('Designated support, training, and services offerings').tagName).toBe('P');
    expect(screen.getByText('First Name *').tagName).toBe('P');
    expect(screen.getByText('Company email *').tagName).toBe('P');
    expect(screen.getByPlaceholderText('James')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Acme')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Send us a note here....')).toBeInTheDocument();
    expect(container.querySelectorAll('label')).toHaveLength(0);
    expect(container.querySelector('input[type="submit"][value="Submit"]')).toBeInTheDocument();
    expect(container.querySelector('button[type="submit"]')).not.toBeInTheDocument();
    expect(screen.getByText('We’ll be in touch soon')).toBeInTheDocument();
    expect(screen.getByText('Oops! Something went wrong while submitting the form.')).toBeInTheDocument();
  });

  it('renders the synced newsroom cards using paragraph titles and text links', () => {
    renderRoute(<Press />);

    expect(screen.getByRole('heading', { name: 'In the news' })).toBeInTheDocument();
    expect(screen.getByText('Read how OpenHands is reshaping the future of AI-powered software development.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact');
    expect(screen.getByText('November 18, 2025').tagName).toBe('P');
    expect(screen.getByText('OpenHands Raises $18.8M Series A to Bring Open-Source Cloud Coding Agents to Enterprises').tagName).toBe('P');
    expect(screen.getByText('All Hands AI Announces $5M to Advance Open-source AI Agents for Developers').tagName).toBe('P');
    expect(screen.getByText('All Hands AI raises $5M to build open source agents for developers').tagName).toBe('P');
    expect(screen.getAllByRole('link', { name: 'Read more' })).toHaveLength(3);
    expect(screen.queryByRole('heading', { name: 'OpenHands Raises $18.8M Series A to Bring Open-Source Cloud Coding Agents to Enterprises' })).not.toBeInTheDocument();
    expect(screen.queryByText('Media Kit')).not.toBeInTheDocument();
  });

  it('renders the synced manifesto copy with live heading and paragraph semantics', () => {
    renderRoute(<Manifesto />);

    const introHeading = screen.getByRole('heading', { level: 3, name: /We're at the beginning of a new era in software/i });

    expect(screen.getByRole('heading', { level: 1, name: 'Hands on the Future' })).toBeInTheDocument();
    expect(screen.getByText('We believe in an open, autonomous future for software development')).toBeInTheDocument();
    expect(introHeading).toBeInTheDocument();
    expect(introHeading.textContent).toContain('We believe:‍');
    expect(screen.getByText(/The future of software development must be written by engineers/).closest('p')?.tagName).toBe('P');
    expect(screen.getByText(/A new class of engineers are emerging/).closest('p')?.tagName).toBe('P');
    expect(screen.getByText(/Scale lives in the cloud/).closest('p')?.tagName).toBe('P');
    expect(screen.getByText(/Openness is non-negotiable/).closest('p')?.tagName).toBe('P');
    expect(screen.getByText(/Model choice is a right/).closest('p')?.tagName).toBe('P');
    expect(screen.getByText(/Security is a runtime, not a promise/).closest('p')?.tagName).toBe('P');
    expect(screen.getByRole('heading', { level: 3, name: 'What this means for OpenHands' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'What this asks of you' })).toBeInTheDocument();
    expect(screen.getByText(/Adopt an agentic mindset\. Identify toil\. Delegate clearly\./).closest('p')?.tagName).toBe('P');
    expect(screen.queryByRole('heading', { name: 'The future of software development must be written by engineers' })).not.toBeInTheDocument();
  });

  it.each([
    ['/about/', 'about', <About key='about' />],
    ['/contact/', 'contact', <Contact key='contact' />],
    ['/manifesto/', 'manifesto', <Manifesto key='manifesto' />],
    ['/press/', 'press', <Press key='press' />],
  ])('renders the shared marketing footer on %s even with a trailing slash', (initialEntry, routePath, element) => {
    renderInApp(initialEntry, routePath, element);

    expect(screen.getByText('Building the open standard for autonomous software development.')).toBeInTheDocument();
  });
});
