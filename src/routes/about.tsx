import { CompanyPageShell } from '~/components/company-page-shell';
import { MemberCard } from '~/components/member-card';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { teamMembers } from '~/constants/members';
import type { Route } from './+types/about';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'About OpenHands | Our Mission, Team, and Community' },
    {
      name: 'description',
      content:
        'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global OSS community and trusted by enterprises.',
    },
    { property: 'og:title', content: 'About OpenHands | Our Mission, Team, and Community' },
    {
      property: 'og:description',
      content:
        'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global OSS community and trusted by enterprises.',
    },
    {
      property: 'og:image',
      content:
        'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'About OpenHands | Our Mission, Team, and Community' },
    {
      name: 'twitter:description',
      content:
        'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global OSS community and trusted by enterprises.',
    },
    {
      name: 'twitter:image',
      content:
        'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const MILESTONE_LABEL_POSITIONS = [
  { left: '226px', top: '388.7px' },
  { left: '197px', top: '380.7px' },
  { left: '169px', top: '388.7px' },
] as const;

const MILESTONES = [
  {
    value: '73K',
    suffix: '+',
    label: 'GitHub stars',
    icon: '/assets/webflow/icons/690e2b7b51667746d95adc9d_Vector-2.svg',
  },
  {
    value: '400',
    suffix: '+',
    label: 'OSS contributors',
    icon: '/assets/webflow/icons/690e2b7b9fc429c82f202491_Vector-1.svg',
  },
  {
    value: '5M+',
    label: 'Over 5 million open source downloads',
    icon: '/assets/webflow/icons/690e2b7b8bbe39907a82a9a7_Vector.svg',
  },
] as const;

const About = () => {
  return (
    <CompanyPageShell>
      <section data-wf-el='section-hero' className='pt-0 pb-0' style={{ height: '1152.27px' }}>
        {/* Live wraps hero content in `.hero-content` (`padding: 4rem 0 4rem`).
            Move that padding onto the inner content wrappers so the SECTION
            keeps `padding: 0` (matches live) while H1 starts at live top:148. */}
        <div className='mx-auto max-w-[600px] pt-16 text-center'>
          <h1 className='fluid-h1 h1-flow-root text-brand-fg'>
            Empowering every team to build software autonomously.
          </h1>
          <p className='fluid-body-lg font-medium text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
            OpenHands is the open, secure, and model-agnostic platform
          </p>
        </div>

        <div className='mx-auto mt-[149px] max-w-[1238px]'>
          <div className='mb-12 flex justify-center'>
            <h2 className='inline-block section-title text-brand-fg'>
              Milestones
            </h2>
          </div>

          <div className='relative min-h-[635px] overflow-hidden rounded-[8px] bg-brand-fg text-brand-bg' style={{ height: '636.562px', border: '1px solid rgba(0, 0, 0, 0)' }}>
            <img
              aria-hidden='true'
              src='/assets/webflow/backgrounds/690e289157a957d4d32ee88d_ascii-art_(20)_1.png'
              alt=''
              className='object-cover opacity-20'
              style={{ position: 'static', display: 'inline-block', width: '1236px', height: '634.562px' }}
            />

            <div className='absolute inset-0'>
              {MILESTONES.map((milestone, index) => (
                <div
                  key={milestone.label}
                  className='absolute'
                  style={{ left: `${index * 33.333333}%`, top: '0px', width: '33.333333%', height: '100%' }}
                >
                  <div className='absolute flex items-end gap-1' style={{ top: index === 1 ? '225.6px' : '234px', left: '50%', transform: 'translateX(-50%)' }}>
                    <span className='font-medium leading-none tracking-[-0.04em]' style={{ fontSize: '154.08px', lineHeight: '154.08px' }}>
                      {milestone.value}
                    </span>
                    {'suffix' in milestone && milestone.suffix ? (
                      <span className='pb-1 text-[56px] leading-none'>{milestone.suffix}</span>
                    ) : null}
                  </div>
                  <div className='absolute flex items-start gap-3' style={MILESTONE_LABEL_POSITIONS[index]}>
                    <img src={milestone.icon} alt='' className='shrink-0' style={{ display: 'flex', width: '17px', height: '24px' }} />
                    <div className='font-mono text-[14px] leading-[1.2] text-brand-bg'>
                      {milestone.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='pt-20 pb-20' style={{ height: '2450.45px' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='px-5'>
            <h3 className='section-title text-brand-fg' style={{ marginBottom: '8.8px' }}>
              Team
            </h3>
            <p className='fluid-body-lg font-medium text-[#5f5f5f]' style={{ marginTop: '0px', marginBottom: '20.8px' }}>
              Built by developers, for developers.
            </p>
            <OverlayLinkButton
              href='https://jobs.ashbyhq.com/OpenHands'
              label='Join us'
              variant='outline'
              className='w-fit'
              wrapperStyle={{ marginBottom: '0px' }}
            />
          </div>

          <div className='mt-[128px] grid justify-items-start gap-x-0 gap-y-10 sm:grid-cols-2 lg:grid-cols-4'>
            {teamMembers.map((member) => (
              <MemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>
    </CompanyPageShell>
  );
};

export default About;
