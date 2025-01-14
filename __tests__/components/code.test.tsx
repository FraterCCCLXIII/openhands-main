import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { code as Code } from '~/components/code';

describe('Code component', () => {
  it('applies correct font size to code blocks', () => {
    const props = {
      children: 'test code',
      className: 'language-javascript',
      customStyle: {}
    };
    
    const { container } = render(<Code {...props} />);
    
    // Get the rendered SyntaxHighlighter element
    const syntaxHighlighter = screen.getByTestId('syntax-highlighter');
    expect(syntaxHighlighter).toHaveStyle({
      fontSize: '14px',
      lineHeight: '20px'
    });
  });
});
