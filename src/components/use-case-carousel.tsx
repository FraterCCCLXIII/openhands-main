import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import { Link } from 'react-router';

// Use case data with CTAs matching the issue requirements
const USE_CASES = [
  {
    id: 'fix-vulnerabilities',
    title: 'Fix vulnerabilities in your codebase',
    ctas: [
      { label: 'Try Online', href: 'https://openhands-vulnerability-fixer.vercel.app/', external: true },
      { label: 'Install GitHub Action', href: 'https://github.com/OpenHands/extensions/tree/main/plugins/vulnerability-remediation', external: true },
    ],
    diagram: 'vulnerability',
  },
  {
    id: 'review-code',
    title: 'Review your code',
    ctas: [
      { label: 'Install GitHub Action', href: 'https://github.com/OpenHands/extensions/tree/main/plugins/pr-review', external: true },
    ],
    diagram: 'code-review',
  },
  {
    id: 'update-docs',
    title: 'Update your docs',
    ctas: [
      { label: 'Install the CLI', href: 'https://docs.openhands.dev/openhands/usage/cli/installation', external: true },
      { label: 'Try the Skill', href: 'https://github.com/OpenHands/extensions/tree/main/skills/add-javadoc', external: true },
    ],
    diagram: 'docs',
  },
  {
    id: 'modernize-apps',
    title: 'Modernize your apps',
    ctas: [
      { label: 'Read the Blog', href: '/blog/cobol-to-java-refactoring' },
      { label: 'Try the Plugin', href: 'https://github.com/OpenHands/extensions/tree/main/plugins/cobol-modernization', external: true },
    ],
    diagram: 'modernize',
  },
];

// Animated diagram components for each use case
const VulnerabilityDiagram = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 120" className="w-full h-full max-w-[280px]">
      {/* Code file icon */}
      <m.g 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <rect x="20" y="25" width="50" height="70" rx="4" fill="#22150d" opacity="0.1" stroke="#22150d" strokeWidth="1.5" />
        <line x1="30" y1="40" x2="60" y2="40" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <line x1="30" y1="50" x2="55" y2="50" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <m.line 
          x1="30" y1="60" x2="60" y2="60" 
          stroke="#dc2626" strokeWidth="2"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <line x1="30" y1="70" x2="50" y2="70" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <line x1="30" y1="80" x2="58" y2="80" stroke="#22150d" strokeWidth="2" opacity="0.3" />
      </m.g>
      
      {/* OpenHands agent */}
      <m.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <circle cx="100" cy="60" r="22" fill="#FFFF8B" stroke="#22150d" strokeWidth="1.5" />
        <text x="100" y="65" textAnchor="middle" fontSize="20" fill="#22150d">🤲</text>
      </m.g>
      
      {/* Arrow from file to agent */}
      <m.path
        d="M75 60 L78 60"
        stroke="#22150d"
        strokeWidth="2"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      
      {/* Fixed code file icon */}
      <m.g 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <rect x="130" y="25" width="50" height="70" rx="4" fill="#22150d" opacity="0.1" stroke="#22150d" strokeWidth="1.5" />
        <line x1="140" y1="40" x2="170" y2="40" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <line x1="140" y1="50" x2="165" y2="50" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <m.line 
          x1="140" y1="60" x2="170" y2="60" 
          stroke="#16a34a" strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        />
        <line x1="140" y1="70" x2="160" y2="70" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <line x1="140" y1="80" x2="168" y2="80" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        {/* Checkmark */}
        <m.circle 
          cx="170" cy="35" r="8" fill="#16a34a"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
        />
        <m.path
          d="M166 35 L169 38 L174 32"
          stroke="white"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        />
      </m.g>
      
      {/* Arrow from agent to fixed file */}
      <m.path
        d="M122 60 L125 60"
        stroke="#22150d"
        strokeWidth="2"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
    </svg>
  </div>
);

const CodeReviewDiagram = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 120" className="w-full h-full max-w-[280px]">
      {/* PR icon */}
      <m.g
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <rect x="20" y="30" width="60" height="60" rx="6" fill="#22150d" opacity="0.1" stroke="#22150d" strokeWidth="1.5" />
        <circle cx="35" cy="50" r="6" fill="#22150d" opacity="0.3" />
        <circle cx="35" cy="70" r="6" fill="#22150d" opacity="0.3" />
        <line x1="35" y1="56" x2="35" y2="64" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <line x1="45" y1="50" x2="70" y2="50" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <line x1="45" y1="60" x2="65" y2="60" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <line x1="45" y1="70" x2="70" y2="70" stroke="#22150d" strokeWidth="2" opacity="0.3" />
      </m.g>
      
      {/* OpenHands agent reviewing */}
      <m.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <circle cx="120" cy="40" r="22" fill="#FFFF8B" stroke="#22150d" strokeWidth="1.5" />
        <text x="120" y="45" textAnchor="middle" fontSize="20" fill="#22150d">🤲</text>
      </m.g>
      
      {/* Comment bubbles */}
      <m.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <rect x="100" y="70" width="70" height="35" rx="6" fill="#FFFF8B" stroke="#22150d" strokeWidth="1" />
        <line x1="110" y1="80" x2="160" y2="80" stroke="#22150d" strokeWidth="2" opacity="0.5" />
        <line x1="110" y1="90" x2="150" y2="90" stroke="#22150d" strokeWidth="2" opacity="0.5" />
        <polygon points="115,70 125,70 120,62" fill="#FFFF8B" stroke="#22150d" strokeWidth="1" />
      </m.g>
      
      {/* Animated review line */}
      <m.path
        d="M80 60 L95 50"
        stroke="#22150d"
        strokeWidth="2"
        strokeDasharray="4 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />
    </svg>
  </div>
);

const DocsDiagram = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 120" className="w-full h-full max-w-[280px]">
      {/* Code file */}
      <m.g
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <rect x="15" y="30" width="45" height="60" rx="4" fill="#22150d" opacity="0.1" stroke="#22150d" strokeWidth="1.5" />
        <text x="37" y="55" textAnchor="middle" fontSize="10" fill="#22150d" opacity="0.6">{'{ }'}</text>
        <line x1="25" y1="70" x2="50" y2="70" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        <line x1="25" y1="78" x2="45" y2="78" stroke="#22150d" strokeWidth="2" opacity="0.3" />
      </m.g>
      
      {/* OpenHands agent */}
      <m.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <circle cx="100" cy="60" r="22" fill="#FFFF8B" stroke="#22150d" strokeWidth="1.5" />
        <text x="100" y="65" textAnchor="middle" fontSize="20" fill="#22150d">🤲</text>
      </m.g>
      
      {/* Arrow */}
      <m.path
        d="M65 60 L75 60"
        stroke="#22150d"
        strokeWidth="2"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      
      {/* Docs output */}
      <m.g
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <rect x="140" y="25" width="45" height="70" rx="4" fill="#22150d" opacity="0.1" stroke="#22150d" strokeWidth="1.5" />
        <text x="162" y="42" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#22150d" opacity="0.7">DOC</text>
        <m.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          <line x1="148" y1="52" x2="178" y2="52" stroke="#16a34a" strokeWidth="2" />
          <line x1="148" y1="62" x2="175" y2="62" stroke="#22150d" strokeWidth="2" opacity="0.3" />
          <line x1="148" y1="72" x2="170" y2="72" stroke="#22150d" strokeWidth="2" opacity="0.3" />
          <line x1="148" y1="82" x2="176" y2="82" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        </m.g>
      </m.g>
      
      {/* Arrow */}
      <m.path
        d="M125 60 L135 60"
        stroke="#22150d"
        strokeWidth="2"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />
    </svg>
  </div>
);

const ModernizeDiagram = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 120" className="w-full h-full max-w-[280px]">
      {/* Legacy code (COBOL style) */}
      <m.g
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <rect x="15" y="25" width="50" height="70" rx="4" fill="#7b6d5d" opacity="0.2" stroke="#7b6d5d" strokeWidth="1.5" />
        <text x="40" y="45" textAnchor="middle" fontSize="8" fill="#7b6d5d" fontWeight="bold">COBOL</text>
        <line x1="23" y1="55" x2="57" y2="55" stroke="#7b6d5d" strokeWidth="2" opacity="0.4" />
        <line x1="23" y1="65" x2="50" y2="65" stroke="#7b6d5d" strokeWidth="2" opacity="0.4" />
        <line x1="23" y1="75" x2="55" y2="75" stroke="#7b6d5d" strokeWidth="2" opacity="0.4" />
        <line x1="23" y1="85" x2="48" y2="85" stroke="#7b6d5d" strokeWidth="2" opacity="0.4" />
      </m.g>
      
      {/* OpenHands agent */}
      <m.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <circle cx="100" cy="60" r="22" fill="#FFFF8B" stroke="#22150d" strokeWidth="1.5" />
        <text x="100" y="65" textAnchor="middle" fontSize="20" fill="#22150d">🤲</text>
      </m.g>
      
      {/* Arrow */}
      <m.path
        d="M70 60 L75 60"
        stroke="#22150d"
        strokeWidth="2"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      
      {/* Modern code */}
      <m.g
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <rect x="135" y="25" width="50" height="70" rx="4" fill="#22150d" opacity="0.1" stroke="#22150d" strokeWidth="1.5" />
        <m.text 
          x="160" y="45" 
          textAnchor="middle" 
          fontSize="8" 
          fill="#16a34a" 
          fontWeight="bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          Java
        </m.text>
        <m.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          <line x1="143" y1="55" x2="177" y2="55" stroke="#22150d" strokeWidth="2" opacity="0.3" />
          <line x1="143" y1="65" x2="170" y2="65" stroke="#22150d" strokeWidth="2" opacity="0.3" />
          <line x1="143" y1="75" x2="175" y2="75" stroke="#22150d" strokeWidth="2" opacity="0.3" />
          <line x1="143" y1="85" x2="168" y2="85" stroke="#22150d" strokeWidth="2" opacity="0.3" />
        </m.g>
        {/* Sparkle */}
        <m.text
          x="175"
          y="35"
          fontSize="12"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 1.1 }}
        >
          ✨
        </m.text>
      </m.g>
      
      {/* Arrow */}
      <m.path
        d="M125 60 L130 60"
        stroke="#22150d"
        strokeWidth="2"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />
    </svg>
  </div>
);

// Map diagram types to components
const DIAGRAM_COMPONENTS: Record<string, React.FC> = {
  'vulnerability': VulnerabilityDiagram,
  'code-review': CodeReviewDiagram,
  'docs': DocsDiagram,
  'modernize': ModernizeDiagram,
};

const AUTOPLAY_INTERVAL = 5000;

export const UseCaseCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % USE_CASES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + USE_CASES.length) % USE_CASES.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(goToNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [goToNext, isPaused]);

  const currentCase = USE_CASES[currentIndex];
  const DiagramComponent = DIAGRAM_COMPONENTS[currentCase.diagram];

  return (
    <div 
      className="w-full max-w-2xl mx-auto bg-brand-bg rounded-2xl p-6 sm:p-8 shadow-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="use-case-carousel"
      style={{ 
        backgroundColor: '#F9F0D9',
        border: '1px solid rgba(34, 21, 13, 0.1)'
      }}
    >
      {/* Header */}
      <p className="text-brand-muted mb-4 text-left" style={{
        fontSize: 'clamp(1.1rem, 1rem + 0.5vw, 1.3rem)',
        lineHeight: '1.2',
        fontWeight: 500
      }}>
        OpenHands can...
      </p>

      {/* Carousel Content */}
      <div className="relative min-h-[300px] sm:min-h-[260px]">
        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait">
            <m.div
              key={currentCase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Use Case Title */}
              <h2 
                className="text-brand-fg mb-6 font-bold"
                style={{
                  fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 2rem)',
                  lineHeight: '1.2',
                }}
                data-testid="carousel-title"
              >
                {currentCase.title}
              </h2>

              {/* Diagram */}
              <div className="h-[120px] sm:h-[140px] mb-6 flex items-center justify-center" data-testid="carousel-diagram">
                <DiagramComponent />
              </div>

              {/* CTAs */}
              <div className="flex gap-3 justify-center flex-wrap" data-testid="carousel-ctas">
                {currentCase.ctas.map((cta, index) => (
                  cta.external ? (
                    <a
                      key={`${currentCase.id}-cta-${index}`}
                      href={cta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn ${index === 0 ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '12px 24px', fontSize: '14px' }}
                    >
                      {cta.label}
                    </a>
                  ) : (
                    <Link
                      key={`${currentCase.id}-cta-${index}`}
                      to={cta.href}
                      className={`btn ${index === 0 ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '12px 24px', fontSize: '14px' }}
                    >
                      {cta.label}
                    </Link>
                  )
                ))}
              </div>
            </m.div>
          </AnimatePresence>
        </LazyMotion>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {/* Previous Button */}
        <button
          onClick={goToPrev}
          className="w-10 h-10 rounded-full border border-brand-fg/20 flex items-center justify-center hover:bg-brand-fg/10 transition-colors"
          aria-label="Previous use case"
          data-testid="carousel-prev"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Dots indicator */}
        <div className="flex gap-2" role="tablist" aria-label="Use case slides">
          {USE_CASES.map((useCase, index) => (
            <button
              key={useCase.id}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-brand-fg w-6' 
                  : 'bg-brand-fg/30 hover:bg-brand-fg/50'
              }`}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to ${useCase.title}`}
              data-testid={`carousel-dot-${index}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="w-10 h-10 rounded-full border border-brand-fg/20 flex items-center justify-center hover:bg-brand-fg/10 transition-colors"
          aria-label="Next use case"
          data-testid="carousel-next"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default UseCaseCarousel;

// Export USE_CASES for testing
export { USE_CASES };
