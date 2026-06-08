import React from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitPullRequest,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';

type WorkflowItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const WORKFLOWS: WorkflowItem[] = [
  {
    title: 'Fix Vulnerabilities',
    description: 'Scans repositories, fixes vulnerabilities, and opens reviewable PRs.',
    icon: ShieldAlert,
  },
  {
    title: 'Review PRs',
    description: 'Reviews PRs for quality, security, and best practices.',
    icon: GitPullRequest,
  },
  {
    title: 'Migrate Code',
    description: 'Migrates legacy COBOL systems to Java with testing and validation built in.',
    icon: ArrowRightCircle,
  },
  {
    title: 'Triage Incidents',
    description: 'Investigates errors, finds root causes, and posts actionable debugging insights.',
    icon: TriangleAlert,
  },
  {
    title: 'See all use cases',
    description: '',
    icon: Eye,
  },
];

const WORKFLOW_CARD_CLASS =
  'flex w-[270px] flex-shrink-0 flex-col gap-4 rounded-2xl border border-[rgba(24,24,24,0.2)] bg-[#f7f3ee] p-6 md:w-[352px]';

const WORKFLOW_ARROW_BTN_CLASS =
  'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(24,24,24,0.2)] bg-transparent text-brand-fg transition-all duration-200 ease-out';

const WORKFLOW_ARROW_BTN_HOVER =
  'cursor-pointer hover:border-[rgb(24,24,24)] hover:bg-[rgba(255,255,255,0.34)] hover:backdrop-blur-[5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(24,24,24)]/30 active:scale-95';

function WorkflowCarouselIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      data-wf-el='capabilities_card_icon'
      className='flex flex-shrink-0 text-brand-fg'
      style={{ marginTop: '0px' }}
      aria-hidden='true'
    >
      <Icon className='h-5 w-5' strokeWidth={1.75} aria-hidden='true' />
    </div>
  );
}

type HeroWorkflowCarouselProps = {
  topSpacing?: number;
};

export function HeroWorkflowCarousel({ topSpacing = 0 }: HeroWorkflowCarouselProps) {
  const [workflowOffset, setWorkflowOffset] = React.useState(0);
  const workflowViewportRef = React.useRef<HTMLDivElement>(null);
  const workflowTrackRef = React.useRef<HTMLDivElement>(null);
  const [workflowCardStep, setWorkflowCardStep] = React.useState(294);
  const [maxWorkflowOffset, setMaxWorkflowOffset] = React.useState(WORKFLOWS.length - 1);
  const [maxWorkflowTranslate, setMaxWorkflowTranslate] = React.useState(0);

  React.useEffect(() => {
    const measureWorkflowCarousel = () => {
      const track = workflowTrackRef.current;
      const viewport = workflowViewportRef.current;
      const firstCard = track?.firstElementChild as HTMLElement | null;
      if (!track || !viewport || !firstCard) return;

      const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '24') || 24;
      const step = firstCard.offsetWidth + gap;
      const maxTranslate = Math.max(0, track.scrollWidth - viewport.clientWidth);
      const lastOffset = step > 0 ? Math.ceil(maxTranslate / step) : 0;

      setWorkflowCardStep(step);
      setMaxWorkflowTranslate(maxTranslate);
      setMaxWorkflowOffset(lastOffset);
      setWorkflowOffset((current) => Math.min(current, lastOffset));
    };

    measureWorkflowCarousel();
    window.addEventListener('resize', measureWorkflowCarousel);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measureWorkflowCarousel);
      if (workflowTrackRef.current) resizeObserver.observe(workflowTrackRef.current);
      if (workflowViewportRef.current) resizeObserver.observe(workflowViewportRef.current);
    }

    return () => {
      window.removeEventListener('resize', measureWorkflowCarousel);
      resizeObserver?.disconnect();
    };
  }, []);

  const shiftWorkflow = (direction: -1 | 1) => {
    setWorkflowOffset((current) => {
      if (direction === -1) return Math.max(0, current - 1);
      return Math.min(maxWorkflowOffset, current + 1);
    });
  };

  const isAtWorkflowStart = workflowOffset === 0;
  const isAtWorkflowEnd = workflowOffset >= maxWorkflowOffset;
  const workflowTranslateX = workflowOffset >= maxWorkflowOffset
    ? maxWorkflowTranslate
    : workflowOffset * workflowCardStep;

  return (
    <div
      data-wf-el='container'
      className='relative z-10 mx-auto w-full max-w-[1238px]'
      style={topSpacing > 0 ? { marginTop: `${topSpacing}px` } : undefined}
    >
      <div className='flex items-center gap-3 pb-8 md:gap-4 md:pb-10'>
        <button
          type='button'
          onClick={() => shiftWorkflow(-1)}
          disabled={isAtWorkflowStart}
          className={`${WORKFLOW_ARROW_BTN_CLASS} ${
            isAtWorkflowStart ? 'cursor-default opacity-40' : WORKFLOW_ARROW_BTN_HOVER
          }`}
          style={{ boxSizing: 'border-box' }}
          aria-label='Previous workflow'
          aria-disabled={isAtWorkflowStart}
        >
          <span data-wf-el='hero-splide_button' className='flex items-center justify-center' aria-hidden='true'>
            <ChevronLeft className='h-6 w-6' strokeWidth={1.75} />
          </span>
        </button>

        <div ref={workflowViewportRef} className='min-w-0 flex-1 overflow-hidden'>
          <LazyMotion features={domAnimation}>
            <m.div
              ref={workflowTrackRef}
              data-splide='workflows'
              className='flex w-max gap-6'
              animate={{ x: -workflowTranslateX }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {WORKFLOWS.map((workflow) => (
                <article
                  key={workflow.title}
                  data-testid='workflow-card'
                  data-wf-el='capabilities_card_wrap'
                  className={WORKFLOW_CARD_CLASS}
                  style={{ scrollSnapAlign: 'start', justifyContent: 'flex-start', alignItems: 'flex-start' }}
                >
                  <WorkflowCarouselIcon icon={workflow.icon} />
                  <div data-wf-el='capabilities_card_content' className='flex flex-col gap-1'>
                    <h3
                      data-wf-el='capabilities_card_heading'
                      className='text-[20px] font-medium leading-[1.2] text-brand-fg'
                      style={{ marginBottom: 0 }}
                    >
                      {workflow.title}
                    </h3>
                    {workflow.description ? (
                      <p data-wf-el='capabilities_card_paragraph' className='fluid-sm font-medium text-brand-muted' style={{ margin: 0 }}>
                        {workflow.description}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </m.div>
          </LazyMotion>
        </div>

        <button
          type='button'
          onClick={() => shiftWorkflow(1)}
          disabled={isAtWorkflowEnd}
          className={`${WORKFLOW_ARROW_BTN_CLASS} ${
            isAtWorkflowEnd ? 'cursor-default opacity-40' : WORKFLOW_ARROW_BTN_HOVER
          }`}
          style={{ boxSizing: 'border-box' }}
          aria-label='Next workflow'
          aria-disabled={isAtWorkflowEnd}
        >
          <span data-wf-el='hero-splide_button' className='flex items-center justify-center' aria-hidden='true'>
            <ChevronRight className='h-6 w-6' strokeWidth={1.75} />
          </span>
        </button>
      </div>
    </div>
  );
}
