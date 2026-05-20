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

    const emailField = screen.getByPlaceholderText('Share your email');
    const submitButton = screen.getByRole('button', { name: 'Subscribe' });

    expect(emailField).toBeInTheDocument();
    expect(emailField.className).toContain('min-h-[52px]');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('data-wf-el', 'button');
    expect(submitButton.className).toContain('min-h-[52px]');
    expect(document.querySelector('[data-wf-el="is-blog"]')).toBeInTheDocument();
    expect(document.querySelector('[data-wf-el="input-group"]')).toBeInTheDocument();

    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(privacyLink.className).toContain('text-[#5f5f5f]');
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
