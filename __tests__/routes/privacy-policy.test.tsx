import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import PrivacyPolicy from '../../src/routes/privacy-policy';

const renderRoute = () => {
  return render(
    <MemoryRouter>
      <PrivacyPolicy />
    </MemoryRouter>,
  );
};

describe('Privacy policy route', () => {
  it('renders the live privacy heading hierarchy and CTA block', () => {
    const { container } = renderRoute();

    expect(container.querySelector('main')).toHaveClass('pt-16', 'pb-20');
    expect(container.querySelector('main > div')).toHaveClass('max-w-[900px]');
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toHaveClass('mb-12', 'leading-[1.15]');
    expect(screen.getByText('Effective Date: September 3, 2025').closest('p')).toHaveClass(
      'tracking-[-0.015em]',
      'leading-[1.6]',
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Personal information we collect' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How we use personal information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How we share your personal information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Other sites, mobile applications and services' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Retention' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'How to contact us' })).toBeInTheDocument();
    expect(screen.getByText(/This Privacy Policy explains how we handle personal information/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Brave' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'contact@all-hands.dev' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://all-hands.dev' })).toHaveAttribute(
      'href',
      'https://all-hands.dev',
    );

    expect(screen.getByText('Building the open standard for autonomous software development.')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Building the open standard for autonomous software development.' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Build with SDK' })).toHaveAttribute('href', 'https://docs.openhands.dev/sdk');
    expect(screen.getByRole('link', { name: 'Try it live' })).toHaveAttribute('href', 'https://app.all-hands.dev/');
  });
});
