import { useLayoutEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bot, Box, CircleCheck } from 'lucide-react';
import { BootstrapIcon, type BootstrapIconName } from '~/components/icons/bootstrap-icons';
import { useEnterpriseScrollReveal } from '~/components/enterprise/use-enterprise-scroll-reveal';

type AutomationStepIcon =
  | { kind: 'bootstrap'; name: BootstrapIconName }
  | { kind: 'lucide'; Icon: LucideIcon };

type AutomationStep = {
  icon: AutomationStepIcon;
  label: string;
  title: string;
};

const AUTOMATION_STEPS: AutomationStep[] = [
  {
    icon: { kind: 'bootstrap', name: 'github' },
    label: 'Trigger',
    title: 'Github issue opened',
  },
  {
    icon: { kind: 'lucide', Icon: Bot },
    label: 'Agent',
    title: 'OpenHands fires automatically',
  },
  {
    icon: { kind: 'lucide', Icon: Box },
    label: 'Runtime',
    title: 'Isolated container – Kubernetes-native',
  },
  {
    icon: { kind: 'lucide', Icon: CircleCheck },
    label: 'Output',
    title: 'PR opened. Logs captured. Done.',
  },
];

const StepIcon = ({ icon }: { icon: AutomationStepIcon }) => {
  if (icon.kind === 'bootstrap') {
    return <BootstrapIcon name={icon.name} className='h-6 w-6' />;
  }

  const LucideStepIcon = icon.Icon;
  return <LucideStepIcon className='h-6 w-6' strokeWidth={1.75} aria-hidden='true' />;
};

const RAIL_DURATION_MS = 1750;
const CARD_REVEAL_OFFSET_MS = 90;

function layoutAutomationSteps(root: HTMLElement) {
  const railTrack = root.querySelector<HTMLElement>('.enterprise-automation-steps__rail-track');
  const items = root.querySelectorAll<HTMLElement>('.enterprise-automation-steps__item');

  if (!railTrack || items.length === 0) return;

  const firstDot = items[0]?.querySelector<HTMLElement>('.enterprise-automation-steps__dot');
  const lastDot = items[items.length - 1]?.querySelector<HTMLElement>('.enterprise-automation-steps__dot');

  if (!firstDot || !lastDot) return;

  const rootRect = root.getBoundingClientRect();
  const firstDotRect = firstDot.getBoundingClientRect();
  const lastDotRect = lastDot.getBoundingClientRect();
  const firstCenter = firstDotRect.top + firstDotRect.height / 2;
  const lastCenter = lastDotRect.top + lastDotRect.height / 2;

  const railTop = firstCenter - rootRect.top;
  const railHeight = Math.max(0, lastCenter - firstCenter);

  root.style.setProperty('--rail-top', `${railTop}px`);
  root.style.setProperty('--rail-height', `${railHeight}px`);

  if (railHeight <= 0) return;

  items.forEach((item) => {
    const dot = item.querySelector<HTMLElement>('.enterprise-automation-steps__dot');
    if (!dot) return;

    const dotRect = dot.getBoundingClientRect();
    const dotCenter = dotRect.top + dotRect.height / 2;
    const progress = Math.min(1, Math.max(0, (dotCenter - firstCenter) / railHeight));
    const delayMs = progress * RAIL_DURATION_MS;

    item.style.setProperty('--step-delay', `${delayMs}ms`);
    item.style.setProperty('--card-delay', `${delayMs + CARD_REVEAL_OFFSET_MS}ms`);
  });
}

export const AutomationStepsFlow = () => {
  const { rootRef, shouldAnimate, isActive } = useEnterpriseScrollReveal();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    layoutAutomationSteps(root);

    const handleResize = () => layoutAutomationSteps(root);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [shouldAnimate, isActive, rootRef]);

  const rootClassName = [
    'enterprise-automation-steps',
    shouldAnimate ? 'enterprise-automation-steps--animate' : '',
    isActive ? 'is-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={rootRef} data-wf-el='acp_automation_steps' className={rootClassName}>
      <div aria-hidden='true' className='enterprise-automation-steps__rail-track' />
      <div aria-hidden='true' className='enterprise-automation-steps__rail' />
      <ol className='enterprise-automation-steps__list'>
        {AUTOMATION_STEPS.map((step) => (
          <li
            key={step.label}
            data-wf-el='acp_automation_step'
            className='enterprise-automation-steps__item'
          >
            <div aria-hidden='true' className='enterprise-automation-steps__dot' />
            <article data-wf-el='card' className='card-dark'>
              <div data-wf-el='card-body' className='flex items-center gap-4 p-6'>
                <div
                  data-wf-el='acp_features_icon'
                  className='enterprise-automation-steps__icon text-brand-bg'
                >
                  <StepIcon icon={step.icon} />
                </div>
                <div className='min-w-0'>
                  <p
                    data-wf-el='acp_automation_step_label'
                    className='font-mono text-[14px] font-normal leading-[16.896px]'
                    style={{ marginBottom: '0px', color: 'var(--neutral-card-dark-muted)' }}
                  >
                    {step.label}
                  </p>
                  <p
                    data-wf-el='acp_automation_step_title'
                    className='fluid-body-lg font-medium text-white'
                    style={{ marginBottom: '0px' }}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
};
