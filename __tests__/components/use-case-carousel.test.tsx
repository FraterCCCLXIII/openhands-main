import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UseCaseCarousel, USE_CASES } from '~/components/use-case-carousel';

// Mock react-router's Link component
vi.mock('react-router', () => ({
  // @ts-expect-error - mock implementation
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

// Mock framer-motion to avoid animation delays in tests
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  LazyMotion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  m: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
    g: (props: React.SVGProps<SVGGElement>) => <g {...props} />,
    line: (props: React.SVGProps<SVGLineElement>) => <line {...props} />,
    path: (props: React.SVGProps<SVGPathElement>) => <path {...props} />,
    circle: (props: React.SVGProps<SVGCircleElement>) => <circle {...props} />,
    text: (props: React.SVGProps<SVGTextElement>) => <text {...props} />,
  },
  domAnimation: {},
}));

describe('UseCaseCarousel component', () => {
  it('renders the carousel with initial content', () => {
    render(<UseCaseCarousel />);
    
    // Check for the "OpenHands can..." header
    expect(screen.getByText('OpenHands can...')).toBeInTheDocument();
    
    // Check that the carousel container is rendered
    expect(screen.getByTestId('use-case-carousel')).toBeInTheDocument();
    
    // Check that the first use case title is displayed
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[0].title);
  });

  it('renders all navigation dots', () => {
    render(<UseCaseCarousel />);
    
    // Should have dots for all use cases
    USE_CASES.forEach((_, index) => {
      expect(screen.getByTestId(`carousel-dot-${index}`)).toBeInTheDocument();
    });
  });

  it('navigates to next slide when next button is clicked', () => {
    render(<UseCaseCarousel />);
    
    const nextButton = screen.getByTestId('carousel-next');
    
    // Initial title should be first use case
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[0].title);
    
    // Click next
    fireEvent.click(nextButton);
    
    // Check second use case
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[1].title);
  });

  it('navigates to previous slide when prev button is clicked', () => {
    render(<UseCaseCarousel />);
    
    const prevButton = screen.getByTestId('carousel-prev');
    
    // Click previous (should wrap around to last slide)
    fireEvent.click(prevButton);
    
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[USE_CASES.length - 1].title);
  });

  it('navigates to specific slide when dot is clicked', () => {
    render(<UseCaseCarousel />);
    
    // Click third dot (index 2)
    const thirdDot = screen.getByTestId('carousel-dot-2');
    fireEvent.click(thirdDot);
    
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[2].title);
  });

  it('renders CTAs for each use case', () => {
    render(<UseCaseCarousel />);
    
    // Check first use case has CTAs
    const ctaContainer = screen.getByTestId('carousel-ctas');
    expect(ctaContainer).toBeInTheDocument();
    
    // First use case should have 2 CTAs
    const links = ctaContainer.querySelectorAll('a');
    expect(links.length).toBe(USE_CASES[0].ctas.length);
    
    // Verify first CTA text
    expect(links[0]).toHaveTextContent(USE_CASES[0].ctas[0].label);
  });

  it('renders diagram for each use case', () => {
    render(<UseCaseCarousel />);
    
    // Check diagram container is present
    expect(screen.getByTestId('carousel-diagram')).toBeInTheDocument();
  });

  it('wraps around from last to first slide', () => {
    render(<UseCaseCarousel />);
    
    // Navigate to last slide
    const lastDot = screen.getByTestId(`carousel-dot-${USE_CASES.length - 1}`);
    fireEvent.click(lastDot);
    
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[USE_CASES.length - 1].title);
    
    // Click next
    const nextButton = screen.getByTestId('carousel-next');
    fireEvent.click(nextButton);
    
    // Should wrap to first slide
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[0].title);
  });

  it('has correct use case data structure', () => {
    expect(USE_CASES).toHaveLength(4);
    
    // Verify all required properties exist for each use case
    USE_CASES.forEach((useCase) => {
      expect(useCase).toHaveProperty('id');
      expect(useCase).toHaveProperty('title');
      expect(useCase).toHaveProperty('ctas');
      expect(useCase).toHaveProperty('diagram');
      expect(useCase.ctas.length).toBeGreaterThan(0);
      
      // Verify CTA structure
      useCase.ctas.forEach((cta) => {
        expect(cta).toHaveProperty('label');
        expect(cta).toHaveProperty('href');
      });
    });
  });

  it('renders external links with correct attributes', () => {
    render(<UseCaseCarousel />);
    
    const ctaContainer = screen.getByTestId('carousel-ctas');
    const externalLinks = ctaContainer.querySelectorAll('a[target="_blank"]');
    
    // First use case has external links
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('cycles through all use cases with next button', () => {
    render(<UseCaseCarousel />);
    
    const nextButton = screen.getByTestId('carousel-next');
    
    // Start at first slide
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[0].title);
    
    // Click through all slides
    for (let i = 1; i < USE_CASES.length; i++) {
      fireEvent.click(nextButton);
      expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[i].title);
    }
    
    // Wrap around to first
    fireEvent.click(nextButton);
    expect(screen.getByTestId('carousel-title')).toHaveTextContent(USE_CASES[0].title);
  });

  it('has navigation buttons with accessible labels', () => {
    render(<UseCaseCarousel />);
    
    expect(screen.getByLabelText('Previous use case')).toBeInTheDocument();
    expect(screen.getByLabelText('Next use case')).toBeInTheDocument();
  });
});
