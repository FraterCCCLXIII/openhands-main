import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InternalComponentExamplesRoute, { meta } from '../../src/routes/internal.component-examples';

describe('internal component examples route', () => {
  it('exposes a noindex internal archive page', () => {
    expect(meta({} as never)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'robots', content: 'noindex, nofollow' }),
      ]),
    );
  });

  it('renders archived Agent Canvas section examples', () => {
    render(<InternalComponentExamplesRoute />);

    expect(screen.getByRole('heading', { name: 'Removed Agent Canvas section examples' })).toBeInTheDocument();
    expect(screen.getByText('Web GUI intro band')).toBeInTheDocument();
    expect(screen.getByText('Key capabilities and use cases showcase')).toBeInTheDocument();
    expect(screen.getByText('Product comparison table')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Key capabilities' })).toBeInTheDocument();
    expect(screen.getByText('Legacy Web GUI FAQ')).toBeInTheDocument();
    expect(screen.getByText('A collaborative interface for agentic workflows.')).toBeInTheDocument();
    expect(
      screen.getByText('The only open, secure, and scalable agent platform built for real engineering work'),
    ).toBeInTheDocument();
    expect(screen.getByText('What is the OpenHands GUI?')).toBeInTheDocument();
  });
});
