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

    expect(container.querySelector('main')).toHaveClass('text-brand-fg');
    expect(container.querySelector('main > section')).toHaveStyle({ paddingTop: '80px', paddingBottom: '80px' });
    expect(container.querySelector('main [data-wf-el="container"]')).toHaveClass('max-w-[900px]');
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toHaveClass('text-center', 'fluid-h3');
    expect(screen.getByText('Effective Date: September 3, 2025').closest('p')).toHaveClass('leading-[1.6]');

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

  });
});
