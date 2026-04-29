import { MemberCard } from '~/components/member-card';
import { teamMembers } from '~/constants/members';
import type { Route } from './+types/about';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'About OpenHands | Our Mission, Team, and Community' },
    { name: 'description', content: 'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global OSS community and trusted by enterprises.' },
    { property: 'og:title', content: 'About OpenHands | Our Mission, Team, and Community' },
    { property: 'og:description', content: 'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global OSS community and trusted by enterprises.' },
    { property: 'og:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'About OpenHands | Our Mission, Team, and Community' },
    { name: 'twitter:description', content: 'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global OSS community and trusted by enterprises.' },
    { name: 'twitter:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const MILESTONES = [
  {
    value: '65k',
    suffix: '+',
    label: 'GitHub stars',
    icon: 'https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/690e2b7b51667746d95adc9d_Vector-2.svg',
  },
  {
    value: '400',
    suffix: '+',
    label: 'OSS contributors',
    icon: 'https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/690e2b7b9fc429c82f202491_Vector-1.svg',
  },
  {
    value: '5M+',
    label: 'Over 5 million open source downloads',
    icon: 'https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/690e2b7b8bbe39907a82a9a7_Vector.svg',
  },
];

const About = () => {
  return (
    <main className='pt-[100px]'>
      <section className='px-6 pb-16 pt-16 lg:px-10 lg:pb-24 lg:pt-24'>
        <div className='mx-auto max-w-[720px] text-center'>
          <h1 className='font-quincy text-[44px] font-normal leading-[0.95] tracking-[-0.04em] lg:text-[60px]'>
            Empowering every team to build software autonomously.
          </h1>
          <p className='mx-auto mt-4 max-w-[540px] text-lg leading-[1.5] text-brand-muted'>
            OpenHands is the open, secure, and model-agnostic platform
          </p>
        </div>

        <div className='mx-auto mt-12 max-w-[1238px]'>
          <h2 className='section-title text-center'>Milestones</h2>
          <div className='relative mt-6 overflow-hidden rounded-[28px] bg-brand-fg px-6 py-8 text-brand-bg lg:px-10 lg:py-10'>
            <img
              src='https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/690e289157a957d4d32ee88d_ascii-art%20(20)%201.png'
              alt='Grid of multiple black-and-white ASCII art portraits of various people and objects, arranged in rows and columns.'
              className='pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15'
            />
            <div className='relative grid gap-4 lg:grid-cols-3'>
              {MILESTONES.map((milestone) => (
                <div key={milestone.label} className='rounded-[24px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm'>
                  <div className='flex items-end justify-center gap-1 text-center lg:justify-end'>
                    <span className='font-quincy text-[52px] font-normal leading-none tracking-[-0.04em] lg:text-[64px]'>
                      {milestone.value}
                    </span>
                    {milestone.suffix ? <span className='pb-1 text-[36px] leading-none'>{milestone.suffix}</span> : null}
                  </div>
                  <div className='mt-4 flex items-center justify-center gap-3 text-center lg:justify-start lg:text-left'>
                    <img src={milestone.icon} alt='' className='h-6 w-6 shrink-0' />
                    <p className='text-base leading-[1.4] text-brand-bg'>{milestone.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='px-6 pb-16 lg:px-10 lg:pb-24'>
        <div className='mx-auto max-w-[1238px]'>
          <div className='mb-10 text-center'>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted'>Team</p>
            <h2 className='mt-3 text-[32px] font-medium leading-[1.15] tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
              Built by developers, for developers.
            </h2>
            <a
              href='https://jobs.ashbyhq.com/OpenHands'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-primary mt-6'
            >
              Join us
            </a>
          </div>

          <div className='flex flex-wrap justify-center'>
            {teamMembers.map((member) => (
              <MemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
