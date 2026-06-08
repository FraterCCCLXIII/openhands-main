import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/root';
import { teamMembers } from '../../src/constants/members';
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

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    expect(container.querySelector('.about-page')).toBeInTheDocument();
    expect(container.querySelector('.about-hero-section')).toBeInTheDocument();
    expect(container.querySelector('.about-team-section')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-wf-el="standard-collection-list-item"]')).toHaveLength(teamMembers.length + 2);
    expect(container.querySelectorAll('[data-wf-el="card-2"]')).toHaveLength(4);
    expect(container.querySelector('.about-milestone-cards')).toBeInTheDocument();
    expect(container.querySelector('.about-team-list')).toBeInTheDocument();
    expect(screen.getByText('Robert Brennan')).toHaveClass('fluid-body-lg');
    expect(screen.getByText('CEO')).toHaveClass('fluid-sm');
    expect(screen.getByText('OSS contributors')).toBeInTheDocument();
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
    expect(container.querySelector('[data-wf-el="card"] [data-wf-el="card-body"] [data-wf-el="form-block"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-wf-el="icon-media"]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-wf-el="track-item"]')).toHaveLength(16);
    expect(container.querySelector('select[data-wf-el="select-field"].contact-select-field')).toBeInTheDocument();
    expect(container.querySelector('input[type="submit"][value="Submit"][data-wf-el="button"]')).toBeInTheDocument();
    expect(container.querySelector('#contact-page-form')).toHaveClass('contact-form', 'form-block--form', 'u-mt-sm', 'u-mb-sm');
    expect(container.querySelector('[data-wf-el="page-main"]')).toHaveClass('contact-page-main');
    expect(container.querySelector('.contact-form-section')).toBeInTheDocument();

    expect(container.querySelector('button[type="submit"]')).not.toBeInTheDocument();
    expect(screen.getByText('We’ll be in touch soon')).toBeInTheDocument();
    expect(screen.getByText('Oops! Something went wrong while submitting the form.')).toBeInTheDocument();
  });

  it('tabs through the contact form fields in live mobile stacking order', async () => {
    const user = userEvent.setup();
    const { container } = renderRoute(<Contact />);
    const fields = Array.from(container.querySelectorAll('.contact-half-field input'));

    expect(fields.map((field) => field.getAttribute('placeholder'))).toEqual([
      'James',
      'email@company.com',
      'Smith',
      'Acme',
    ]);

    screen.getByPlaceholderText('James').focus();
    await user.tab();

    expect(screen.getByPlaceholderText('email@company.com')).toHaveFocus();

    await user.tab();
    expect(screen.getByPlaceholderText('Smith')).toHaveFocus();

    await user.tab();
    expect(screen.getByPlaceholderText('Acme')).toHaveFocus();
  });

  it('submits the contact form locally and shows the dismissible Webflow-style success state', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { container } = renderRoute(<Contact />);

    await user.type(screen.getByPlaceholderText('James'), 'Test');
    await user.type(screen.getByPlaceholderText('Smith'), 'User');
    await user.type(screen.getByPlaceholderText('email@company.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Acme'), 'Example Co');
    await user.selectOptions(screen.getByRole('combobox'), '50-100');
    await user.type(screen.getByPlaceholderText('Send us a note here....'), 'Testing the local Webflow-style behavior.');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled();

    const successRegion = await screen.findByRole('region', { name: 'Contact-page-form success' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.querySelector('#contact-page-form')).toHaveStyle({ display: 'none' });
    expect(successRegion).toHaveStyle({ display: 'block' });
    expect(successRegion).toHaveFocus();

    await user.click(screen.getByRole('link', { name: 'Dismiss' }));

    expect(container.querySelector('#contact-page-form')).toHaveStyle({ display: 'block' });
    expect(successRegion).toHaveStyle({ display: 'none' });
    expect(screen.getByPlaceholderText('James')).toHaveValue('');
  });

  it('keeps the Webflow-style failure block hidden for the local-only success path', async () => {
    const user = userEvent.setup();
    const { container } = renderRoute(<Contact />);

    await user.type(screen.getByPlaceholderText('James'), 'Test');
    await user.type(screen.getByPlaceholderText('Smith'), 'User');
    await user.type(screen.getByPlaceholderText('email@company.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Acme'), 'Example Co');
    await user.selectOptions(screen.getByRole('combobox'), '50-100');
    await user.type(screen.getByPlaceholderText('Send us a note here....'), 'Testing the local-only form.');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await screen.findByRole('region', { name: 'Contact-page-form success' });

    expect(container.querySelector('.w-form-fail')).toHaveStyle({ display: 'none' });
  });

  it('renders the synced newsroom cards using paragraph titles and text links', () => {
    const { container } = renderRoute(<Press />);

    expect(screen.getByRole('heading', { name: 'In the news' })).toBeInTheDocument();
    expect(screen.getByText('Read how OpenHands is reshaping the future of AI-powered software development.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact');
    expect(screen.getByText('November 18, 2025').tagName).toBe('P');
    expect(screen.getByText('OpenHands Raises $18.8M Series A to Bring Open-Source Cloud Coding Agents to Enterprises').tagName).toBe('P');
    expect(screen.getByText('All Hands AI Announces $5M to Advance Open-source AI Agents for Developers').tagName).toBe('P');
    expect(screen.getByText('All Hands AI raises $5M to build open source agents for developers').tagName).toBe('P');
    expect(screen.getAllByRole('link', { name: 'Read more' })).toHaveLength(4);
    expect(container.querySelectorAll('[data-wf-el="standard-collection-list-item"]')).toHaveLength(4);
    expect(container.querySelectorAll('.press-card')).toHaveLength(4);
    expect(container.querySelector('[data-wf-el="section-hero"] [data-wf-el="container"]')).toHaveClass('w-[90%]');
    expect(container.querySelector('[data-wf-el="standard-collection"]')).toHaveClass('press-standard-collection', 'w-[90%]');
    expect(container.querySelector('[data-wf-el="standard-collection-list"]')).toHaveAttribute('role', 'list');
    expect(container.querySelector('main')?.lastElementChild?.tagName).toBe('SECTION');
    expect(container.querySelector('section.bg-brand-accent > div[aria-hidden="true"]')).toHaveStyle({ height: 'var(--footer-compact-spacer-height, 9.1875px)' });
    expect(screen.getByText(/OpenHands - All rights reserved/).textContent?.replace(/\u00a0/g, ' ')).toContain(`${new Date().getFullYear()} OpenHands - All rights reserved`);
    expect(screen.queryByRole('heading', { name: 'OpenHands Raises $18.8M Series A to Bring Open-Source Cloud Coding Agents to Enterprises' })).not.toBeInTheDocument();
    expect(screen.queryByText('Media Kit')).not.toBeInTheDocument();
  });

  it('renders the synced manifesto copy with live heading and paragraph semantics', () => {
    const { container } = renderRoute(<Manifesto />);

    const introHeading = screen.getByRole('heading', { level: 3, name: /We're at the beginning of a new era in software/i });
    const platformStrong = screen.getByText((_, element) =>
      element?.tagName === 'STRONG' &&
      element.textContent?.includes('We are building the open, secure, and model-agnostic platform') &&
      element.textContent.includes('Every agent runs in a containerized sandbox you control.')
    );

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
    expect(platformStrong.querySelector('br')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="company-page-background"]')).not.toBeInTheDocument();
    expect(container.querySelectorAll('div[data-wf-el="standard-collection"]')).toHaveLength(2);
    expect(container.querySelectorAll('section[data-wf-el="section"]')).toHaveLength(2);
    expect(container.querySelector('div[data-wf-el="rich-text"]')).toContainElement(introHeading);
  });

  it('keeps the manifesto mobile Webflow layout hooks aligned with live', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    });

    const { container } = renderInApp('/manifesto', 'manifesto', <Manifesto />);

    expect(container.querySelector('section[data-wf-el="section-hero"]')).toHaveStyle({
      height: '217.077px',
      padding: '0px',
    });
    expect(container.querySelector('[data-wf-el="rich-text"]')?.children[1]?.tagName).toBe('P');

    const footerSection = Array.from(container.querySelectorAll('section[data-wf-el="section"]')).at(-1);

    await waitFor(() => {
      expect(footerSection).toHaveStyle({ height: '1370.58px' });
      expect(container.querySelector('[data-wf-el="footer-legal-row"]')).toBeInTheDocument();
    });
  });

  it.each([
    ['/about/', 'about', <About key='about' />],
    ['/contact/', 'contact', <Contact key='contact' />],
    ['/manifesto/', 'manifesto', <Manifesto key='manifesto' />],
    ['/press/', 'press', <Press key='press' />],
  ])('renders the shared marketing footer on %s even with a trailing slash', (initialEntry, routePath, element) => {
    renderInApp(initialEntry, routePath, element);

    expect(screen.getByText('Building the open standard for autonomous software development.')).toBeInTheDocument();
    expect(screen.getByText(/OpenHands - All rights reserved/)).toBeInTheDocument();
  });
});
