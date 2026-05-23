import type { CSSProperties } from 'react';
import ASCIIAnimation from '~/components/ascii-animation';
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
    { tagName: 'link', rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const MILESTONES = [
  {
    value: '74K',
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

const MilestoneCard = ({ milestone, index }: { milestone: (typeof MILESTONES)[number]; index: number }) => (
  <div
    data-wf-el='card-2'
    className='about-milestone-card relative flex flex-col justify-start overflow-hidden rounded-[8px]'
    style={{
      width: index === 2 ? '360.5px' : '359.75px',
      height: '330.562px',
      backgroundColor: 'rgba(255, 255, 255, 0.34)',
      borderStyle: 'none',
    }}
  >
    <div
      data-wf-el='card-body-2'
      className='about-milestone-card-body relative flex h-full w-full flex-col items-center justify-center p-6'
    >
      <div data-wf-el='standard-wrap' className='about-milestone-value-row flex items-end justify-end' style={{ marginTop: '49.6px' }}>
        <div
          data-wf-el='eye-catch-2'
          className='about-milestone-value font-sohne-buch text-white'
          style={{ fontSize: '154.08px', lineHeight: '154.08px', fontWeight: 400, letterSpacing: 'normal' }}
        >
          {milestone.value}
        </div>
        {'suffix' in milestone && milestone.suffix ? (
          <div data-wf-el='h2-2' className='about-milestone-suffix section-title text-white' style={{ marginBottom: '8.8px' }}>
            {milestone.suffix}
          </div>
        ) : null}
      </div>
      <div data-wf-el='standard-wrap' className='about-milestone-label-wrap flex flex-col items-center justify-center' style={index === 1 ? { width: '135.156px', height: '78.89px' } : undefined}>
        <img data-wf-el='icon-2' src={milestone.icon} alt='' className='h-6 w-[17px] shrink-0' style={{ display: 'flex', borderStyle: 'none' }} />
        <div data-wf-el='eyebrow-2' className='about-milestone-label font-mono text-[14.08px] leading-[16.896px] text-white' style={{ width: index === 1 ? '135.156px' : 'auto', height: index === 1 ? '33.78px' : 'auto', marginBottom: '21.12px', textAlign: index === 2 ? 'center' : 'start' }}>
          {milestone.label}
          {index === 1 ? <br /> : null}
        </div>
      </div>
    </div>
  </div>
);

const About = () => {
  return (
    <CompanyPageShell layoutPath='/about'>
      <div className='about-page'>
      <section data-wf-el='section-hero' className='about-hero-section relative pt-0 pb-0' style={{ height: '1152.27px', borderStyle: 'none' }}>
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-0 overflow-hidden' style={{ '--ascii-opacity': '0.12', '--ascii-filter': 'drop-shadow(0 0 6px rgba(160, 200, 255, 0.1))', maxHeight: '2400px', borderStyle: 'none' } as CSSProperties} aria-hidden='true'>
          <div className='h-full w-full overflow-hidden'>
            <ASCIIAnimation className='h-full w-full' />
          </div>
        </div>

        <div data-wf-el='standard-collection' className='h-full'>
          <div data-wf-el='standard-collection-list' className='h-full'>
            <div data-wf-el='standard-collection-list-item' className='h-full' style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div data-wf-el='hero-content' className='about-hero-content flex h-full w-full flex-col items-center justify-center py-16'>
                <div data-wf-el='container' className='about-container mx-auto w-[95%] max-w-[1238px]'>
                  <div className='about-hero-copy mx-auto flex max-w-[600px] flex-col items-center px-5 text-center'>
                    <h1 className='fluid-h1 h1-flow-root text-brand-fg'>
                      Empowering every team to build software autonomously.
                    </h1>
                    <p data-wf-el='paragraph-lg' className='fluid-body-lg font-medium text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
                      OpenHands is the open, secure, and model-agnostic platform
                    </p>
                  </div>

                  <div className='about-milestones-block mt-[149px]'>
                    <div className='about-milestones-title-row mb-12 flex justify-center'>
                      <h2 className='inline-block section-title text-brand-fg'>
                        Milestones
                      </h2>
                    </div>

                    <div data-wf-el='row-2' className='about-milestone-row relative -mx-5 flex' style={{ height: '636.562px', gap: '40px' }}>
                      <div data-wf-el='col-2' className='about-milestone-col relative flex w-full flex-col px-5'>
                        <div data-wf-el='card-2' className='about-milestone-shell relative flex h-full w-full flex-col justify-start overflow-hidden rounded-[8px] bg-brand-fg' style={{ border: '1px solid #b3a88c' }}>
                          <div data-wf-el='card-body-2' className='about-milestone-shell-body relative h-full w-full p-6' style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                            <div data-wf-el='card-bg' className='absolute inset-0'>
                              <img
                                data-wf-el='card-bg-img'
                                aria-hidden='true'
                                src='/assets/webflow/backgrounds/690e289157a957d4d32ee88d_ascii-art_(20)_1-p-500.png'
                                alt=''
                                className='h-full w-full object-cover'
                                style={{ display: 'inline-block', borderStyle: 'none' }}
                              />
                            </div>

                            <div aria-hidden='true' style={{ height: '128px' }} />
                            <div data-wf-el='container' className='about-milestone-inner-container mx-auto' style={{ marginTop: '0px', marginLeft: '29.7px', marginRight: '29.7px', width: '1129px', height: '331px', maxWidth: '1238px' }}>
                              <div className='about-milestone-cards flex h-full justify-between'>
                                {MILESTONES.map((milestone, index) => (
                                  <MilestoneCard key={milestone.label} milestone={milestone} index={index} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='about-team-section relative pt-20 pb-20' style={{ height: '2450.45px', borderStyle: 'none' }}>
        <div data-wf-el='container' className='about-container mx-auto max-w-[1238px]'>
          <div data-wf-el='standard-collection'>
            <div data-wf-el='standard-collection-list'>
              <div data-wf-el='standard-collection-list-item' style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div className='about-team-intro px-5'>
                  <h3 className='section-title text-brand-fg' style={{ marginBottom: '8.8px' }}>
                    Team
                  </h3>
                  <p data-wf-el='paragraph-lg' className='fluid-body-lg font-medium text-[#5f5f5f]' style={{ marginTop: '0px', marginBottom: '20.8px' }}>
                    Built by developers, for developers.
                  </p>
                  <div data-wf-el='standard-wrap' className='w-full'>
                    <OverlayLinkButton
                      href='https://jobs.ashbyhq.com/OpenHands'
                      label='Join us'
                      variant='outline'
                      className='w-fit'
                      wrapperStyle={{ marginBottom: '0px' }}
                      wfEl='button'
                      textWfEl='btn-text'
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div data-wf-el='standard-collection' className='about-team-collection mt-[128px]'>
            <div data-wf-el='standard-collection-list' className='about-team-list flex flex-wrap' style={{ rowGap: '40px' }}>
              {teamMembers.map((member) => (
                <MemberCard key={member.name} member={member} />
              ))}
            </div>
          </div>
        </div>
      </section>
      </div>
    </CompanyPageShell>
  );
};

export default About;
