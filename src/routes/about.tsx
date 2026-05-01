import { CompanyPageShell } from '~/components/company-page-shell';
import { MemberCard } from '~/components/member-card';
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

const MILESTONES = [
  {
    value: '72K',
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
      <section className='px-6 pb-16 pt-12 lg:px-10 lg:pb-20 lg:pt-12'>
        <div className='mx-auto max-w-[560px] text-center'>
          <h1 className='text-[37px] font-medium leading-[40.7px] tracking-[-0.03em] text-brand-fg lg:text-[44px] lg:leading-[48.4px]'>
            Empowering every team to build software autonomously.
          </h1>
          <p className='mt-4 text-[20.8px] font-medium leading-[24.96px] text-[#5f5f5f]'>
            OpenHands is the open, secure, and model-agnostic platform
          </p>
        </div>

        <div className='mx-auto mt-12 max-w-[1238px]'>
          <div className='flex justify-center'>
            <h2 className='inline-block text-[32px] font-medium leading-[38.4px] tracking-[-0.02em] text-brand-fg lg:text-[44px] lg:leading-[48.4px]'>
              Milestones
            </h2>
          </div>

          <div className='relative mt-6 min-h-[740px] overflow-hidden rounded-[8px] bg-brand-fg px-6 py-8 text-brand-bg lg:px-8 lg:py-10'>
            <div
              aria-hidden='true'
              className='absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20'
              style={{
                backgroundImage:
                  "url('/assets/webflow/backgrounds/690e289157a957d4d32ee88d_ascii-art_(20)_1.png')",
              }}
            />

            <div className='relative grid gap-4 md:grid-cols-3'>
              {MILESTONES.map((milestone) => (
                <div
                  key={milestone.label}
                  className='flex min-h-[195px] flex-col justify-between rounded-[8px] bg-white/8 p-5 backdrop-blur-sm'
                >
                  <div className='flex items-end justify-end gap-1'>
                    <span className='text-[56px] font-medium leading-none tracking-[-0.04em] lg:text-[72px]'>
                      {milestone.value}
                    </span>
                    {milestone.suffix ? <span className='pb-1 text-[36px] leading-none'>{milestone.suffix}</span> : null}
                  </div>
                  <div className='mt-6 flex items-center gap-3'>
                    <img src={milestone.icon} alt='' className='h-[17px] w-auto shrink-0' />
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

      <section className='px-6 pb-20 lg:px-10 lg:pb-48'>
        <div className='mx-auto max-w-[1238px]'>
          <div>
            <h3 className='text-[32px] font-medium leading-[38.4px] tracking-[-0.02em] text-brand-fg lg:text-[44px] lg:leading-[48.4px]'>
              Team
            </h3>
            <p className='mt-3 text-[20.8px] font-medium leading-[24.96px] text-[#5f5f5f]'>
              Built by developers, for developers.
            </p>
            <a
              href='https://jobs.ashbyhq.com/OpenHands'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline mt-6 rounded-none'
            >
              Join us
            </a>
          </div>

          <div className='mt-16 grid justify-items-start gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4'>
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
