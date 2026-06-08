import type { LucideIcon } from 'lucide-react';
import { Building2, Laptop, Users } from 'lucide-react';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { GET_OPENHANDS_CTA } from '~/constants/site-shell';

const JOURNEY_TITLE = 'Start on your laptop. Scale to your whole org.';
const MAX_JOURNEY_BULLETS = 5;

const JOURNEY_STAGES = [
  {
    label: 'Individual developer',
    title: 'Start running agents your way.',
    bullets: [
      'Install locally and connect your tools',
      'Run parallel agents on your machine',
      'Build your first automation',
      'Agent Canvas with VM backend',
      'Free and open source — no infra cost',
    ],
    ctaLabel: 'Download free',
    ctaHref: GET_OPENHANDS_CTA.href,
    ctaVariant: 'primary' as const,
    icon: Laptop,
  },
  {
    label: 'Team',
    title: 'Turn wins into team workflows.',
    bullets: [
      'Invite teammates to a shared org',
      'Share automations across the team',
      'Keep agents running in the cloud',
      'Respond in GitHub and Slack when you are offline',
      'RBAC and integrations hub',
    ],
    ctaLabel: 'Create account',
    ctaHref: 'https://app.all-hands.dev/',
    ctaVariant: 'outline' as const,
    icon: Users,
  },
  {
    label: 'Enterprise',
    title: 'Run agents at scale, with full control.',
    bullets: [
      'SSO and RBAC for org-wide access',
      'Audit logs and budget controls',
      'Sandboxed execution in your VPC',
      'Self-hosted — data never leaves your environment',
      'Scale agent usage with full governance',
    ],
    ctaLabel: 'Talk to sales',
    ctaHref: '/contact',
    ctaVariant: 'outline' as const,
    icon: Building2,
  },
] as const;

function JourneyStageIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-fg text-brand-accent'
      aria-hidden='true'
    >
      <Icon className='h-5 w-5' strokeWidth={1.75} />
    </div>
  );
}

export function HomeFullJourneySection() {
  return (
    <section
      data-wf-el='section'
      style={{
        display: 'block',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: '0px',
        paddingRight: '0px',
        position: 'relative',
      }}
    >
      <div className='mx-auto max-w-[1238px] px-5'>
        <div className='mx-auto text-center'>
          <h2
            className='section-title text-brand-fg md:whitespace-nowrap'
            style={{ marginBottom: 0 }}
          >
            {JOURNEY_TITLE}
          </h2>
        </div>

        <div className='mt-12 grid gap-6 md:grid-cols-3'>
          {JOURNEY_STAGES.map((stage) => (
            <article
              key={stage.label}
              className='flex flex-col gap-4 rounded-lg border border-[#b3a88c] bg-white px-6 pt-6 pb-5'
            >
              <div className='flex flex-col gap-3'>
                <JourneyStageIcon icon={stage.icon} />
                <p
                  className='font-mono text-sm font-normal uppercase tracking-[0.08em] text-brand-muted'
                  style={{ lineHeight: '16.896px' }}
                >
                  {stage.label}
                </p>
              </div>

              <div className='flex flex-1 flex-col gap-3'>
                <h3 className='fluid-h4 font-medium text-brand-fg' style={{ marginBottom: 0 }}>
                  {stage.title}
                </h3>
                <ul
                  className='w-full list-none fluid-body-lg font-medium text-brand-muted'
                  style={{ margin: 0, paddingLeft: 0 }}
                >
                  {stage.bullets.slice(0, MAX_JOURNEY_BULLETS).map((bullet, index, bullets) => (
                    <li
                      key={bullet}
                      style={{
                        paddingTop: index === 0 ? '4px' : '11px',
                        paddingBottom: '11px',
                        listStyleType: 'none',
                        borderBottom:
                          index < bullets.length - 1 ? '1px solid rgba(179, 168, 140, 0.5)' : undefined,
                      }}
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <OverlayLinkButton
                href={stage.ctaHref}
                label={stage.ctaLabel}
                variant={stage.ctaVariant}
                className='mt-auto w-fit'
                wrapperStyle={{ marginBottom: '4px' }}
                wfEl='button'
                textWfEl='btn-text'
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
