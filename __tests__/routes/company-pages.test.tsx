import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import About from '../../src/routes/about';
import Contact from '../../src/routes/contact';
import Manifesto from '../../src/routes/manifesto';
import Press from '../../src/routes/press';

const renderRoute = (element: ReactElement) => {
  render(<MemoryRouter>{element}</MemoryRouter>);
};

describe('company information pages parity', () => {
  it('renders the synced about page team roster and milestone content', () => {
    renderRoute(<About />);

    expect(screen.getByRole('heading', { name: 'Empowering every team to build software autonomously.' })).toBeInTheDocument();
    expect(screen.getByText('Milestones')).toBeInTheDocument();
    expect(screen.getByText('GitHub stars')).toBeInTheDocument();
    expect(screen.getByText('OSS contributors')).toBeInTheDocument();
    expect(screen.getByText('Over 5 million open source downloads')).toBeInTheDocument();
    expect(screen.getByText('Built by developers, for developers.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join us' })).toHaveAttribute('href', 'https://jobs.ashbyhq.com/OpenHands');
    expect(screen.getByText('Ash Clarke')).toBeInTheDocument();
    expect(screen.getByText('Ben Solari')).toBeInTheDocument();
    expect(screen.getByText('Vasco Schiavo')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
    expect(screen.queryByText('OUR CONTRIBUTORS')).not.toBeInTheDocument();
  });

  it('renders the synced contact page copy and enterprise form fields', () => {
    renderRoute(<Contact />);

    expect(screen.getByRole('heading', { name: 'Talk to the OpenHands Team' })).toBeInTheDocument();
    expect(screen.getByText(/Get a custom demo and explore pricing, private deployments/)).toBeInTheDocument();
    expect(screen.getByText('Why enterprises choose OpenHands')).toBeInTheDocument();
    expect(screen.getByText('Containerized sandbox runtime for safe autonomy')).toBeInTheDocument();
    expect(screen.getByText('Designated support, training, and services offerings')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('James')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Acme')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Send us a note here....')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1-50' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '50-100' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '501+' })).toBeInTheDocument();
    expect(screen.getByText('We’ll be in touch soon')).toBeInTheDocument();
    expect(screen.getByText('Oops! Something went wrong while submitting the form.')).toBeInTheDocument();
  });

  it('renders the synced newsroom cards with live headlines and links', () => {
    renderRoute(<Press />);

    expect(screen.getByRole('heading', { name: 'In the news' })).toBeInTheDocument();
    expect(screen.getByText('Read how OpenHands is reshaping the future of AI-powered software development.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact');
    expect(screen.getByText('November 18, 2025')).toBeInTheDocument();
    expect(screen.getByText('OpenHands Raises $18.8M Series A to Bring Open-Source Cloud Coding Agents to Enterprises')).toBeInTheDocument();
    expect(screen.getByText('All Hands AI Announces $5M to Advance Open-source AI Agents for Developers')).toBeInTheDocument();
    expect(screen.getByText('All Hands AI raises $5M to build open source agents for developers')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Read more' })).toHaveLength(3);
    expect(screen.queryByText('Media Kit')).not.toBeInTheDocument();
  });

  it('renders the synced manifesto copy and section headings', () => {
    renderRoute(<Manifesto />);

    expect(screen.getByRole('heading', { name: 'Hands on the Future' })).toBeInTheDocument();
    expect(screen.getByText('We believe in an open, autonomous future for software development')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /We're at the beginning of a new era in software/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The future of software development must be written by engineers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A new class of engineers are emerging' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Scale lives in the cloud' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Openness is non-negotiable' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Model choice is a right' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Security is a runtime, not a promise' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What this means for OpenHands' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What this asks of you' })).toBeInTheDocument();
    expect(screen.getByText(/Adopt an agentic mindset\. Identify toil\. Delegate clearly\./)).toBeInTheDocument();
  });
});
