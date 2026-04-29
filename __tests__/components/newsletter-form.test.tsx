import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NewsletterForm } from '../../src/components/newsletter-form';

vi.mock('react-router', () => ({
  // @ts-expect-error - children is any
  Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

describe('NewsletterForm', () => {
  it('renders the live-style email field and privacy copy', () => {
    render(<NewsletterForm centered />);

    expect(screen.getByPlaceholderText('Share your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();

    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(privacyLink.className).toContain('text-brand-brown');
  });

  it('should display an error message', () => {
    render(<NewsletterForm error='Sample error message' />);

    expect(screen.getByText('Sample error message')).toBeInTheDocument();
  });

  it('should display a success message', () => {
    render(<NewsletterForm success='You have successfully subscribed!' />);

    expect(screen.getByText('You have successfully subscribed!')).toBeInTheDocument();
    expect(screen.getByText('Thank you for your submission!')).toBeInTheDocument();
  });
});
