import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimatedHeaderLogo } from '../../src/components/animated-header-logo';

describe('AnimatedHeaderLogo', () => {
  it('does not expose an OpenHands image alt signature', () => {
    render(<AnimatedHeaderLogo />);

    expect(screen.queryByAltText('OpenHands')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
