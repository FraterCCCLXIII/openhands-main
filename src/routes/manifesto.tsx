import type { CSSProperties } from 'react';
import ASCIIAnimation from '~/components/ascii-animation';
import { CompanyPageShell } from '~/components/company-page-shell';
import type { Route } from './+types/manifesto';
import { createSocialPreviewMeta } from '~/utils/seo';

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: 'OpenHands Manifesto | The Future of Open, Autonomous Software Development',
    description:
      'We believe software development should be open, transparent, and autonomous. Discover OpenHands’ vision for the next era of agentic software development.',
    pathname: location.pathname,
  });

const MANIFESTO_POINTS = [
  {
    heading: 'The future of software development must be written by engineers',
    body:
      "Software development is changing. That change needs to happen in the open, driven by a community of professional developers. That's why OpenHands' software agent is MIT-licensed and trusted by a growing community.",
  },
  {
    heading: 'A new class of engineers are emerging',
    body:
      "Most engineers write lines of code, maybe with an AI assistant. But Agentic Engineers tackle code maintenance at scale by orchestrating tens to thousands of cloud-based agents. Agent orchestras aren't appropriate for every engineering task, but Agentic Engineers will automate away the toil and busywork weighing down their teams",
  },
  {
    heading: 'Scale lives in the cloud',
    body:
      'We believe local agents are a bridge, not the destination. Real leverage comes from agents that run in the cloud or your own VPC, so teams can parallelize thousands of tasks and treat automation as infrastructure.',
  },
  {
    heading: 'Openness is non-negotiable',
    body:
      "AI agents are a transformative technology and an increasingly critical part of the world's infrastructure. We need agents that are open source, transparent, and inspectable if we're going to deploy AI safely and responsibly.",
  },
  {
    heading: 'Model choice is a right',
    body:
      'We believe you should pick the best model for each job and switch when economics or quality change. This will only become more important as models improve and new tradeoffs emerge. Vendor flexibility is a feature, not a footnote.',
  },
  {
    heading: 'Security is a runtime, not a promise',
    body:
      'We believe agents must run in isolated, auditable environments with scoped credentials and a clear blast radius. Teams need visibility into how agents are behaving, and the ability to intervene when something breaks',
  },
] as const;

const SeparatorParagraph = () => <p className='font-sohne-buch text-[#5f5f5f]' style={{ marginBottom: '1em', lineHeight: '22.4px' }}>‍</p>;
const MutedEm = ({ children }: { children: React.ReactNode }) => (
  <em className='not-italic text-[#7a7a7a]'>{children}</em>
);

const Manifesto = () => {
  return (
    <CompanyPageShell>
      <section data-wf-el='section-hero' className='relative px-6 pb-10 pt-12 lg:px-10 lg:pb-10 lg:pt-12' style={{ height: '241.484px', padding: '0px' }}>
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-0 overflow-hidden' style={{ '--ascii-opacity': '0.12' } as CSSProperties} aria-hidden='true'>
          <ASCIIAnimation className='h-full w-full' />
        </div>
        <div className='relative mx-auto max-w-[493px] pt-14 text-center'>
          <h1 className='fluid-h1 h1-flow-root text-brand-fg'>
            Hands on the Future
          </h1>
          <p className='fluid-body-lg font-medium text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
            We believe in an open, autonomous future for software development
          </p>
        </div>
      </section>

      <section data-wf-el='section' className='px-6 pb-16 lg:px-10 lg:pb-20' style={{ height: '2018.94px', paddingTop: '50px', paddingLeft: '0px', paddingRight: '0px' }}>
        <div className='mx-auto max-w-[919px]'>
          <img
            src='/assets/webflow/misc/691645a7832560da97f475c5_Featured_manifesto.png'
            alt=''
            className='img-block w-full object-cover'
            style={{ borderRadius: '0px' }}
          />

          <div className='mx-auto max-w-[820px]' style={{ marginTop: '127px' }}>
            <h3 className='fluid-h3 text-brand-fg'>
              We&apos;re at the beginning of a new era in software <MutedEm>development. Work is shifting from keystrokes to delegated tasks,</MutedEm> from single laptops to coordinated fleets of agents running in environments you control.
              <br />
              <br />
              <MutedEm>This is</MutedEm> our point of view <MutedEm>on how we build, what we ship, and</MutedEm> why it matters… <MutedEm>We believe</MutedEm>:
              <br />‍
            </h3>

            <div style={{ marginTop: '10px' }}>
              {MANIFESTO_POINTS.map((point, index) => (
                <div key={point.heading}>
                  <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]' style={{ marginBottom: '1em' }}>
                    <strong className='font-bold text-black'>{point.heading}</strong>
                    <br />
                    {point.body}
                    {index > 0 && index < MANIFESTO_POINTS.length - 1 ? <><br />‍</> : null}
                  </p>
                  {index === 0 ? <SeparatorParagraph /> : null}
                </div>
              ))}
            </div>

            <SeparatorParagraph />
            <SeparatorParagraph />

            <section data-wf-el='section'>
              {/* Live's manifesto sub-section H3 has explicit
                  margin-top: 32px (separate from the section's mt). */}
              <h3 className='fluid-h3 text-brand-fg' style={{ marginTop: '32px' }}>
                What this means for OpenHands
              </h3>
              <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]' style={{ marginBottom: '1em' }}>
                <strong className='font-bold text-black'>We are building the open, secure, and model-agnostic platform for cloud coding agents. Every agent runs in a containerized sandbox you control.</strong>{' '}
                Every outcome can be measured and reviewed. You can self-host the open source, or use our cloud. You can bring your own models and switch without drama. You can start local, then scale to thousands of concurrent agents running throughout your codebase.
              </p>
            </section>

            <SeparatorParagraph />

            <section data-wf-el='section' className='mt-8'>
              <h3 className='fluid-h3 text-brand-fg' style={{ marginTop: '32px' }}>
                What this asks of you
              </h3>
              <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]' style={{ marginBottom: '1em' }}>
                <strong className='font-bold text-black'>Adopt an agentic mindset. Identify toil. Delegate clearly. Measure success. Invest in agent orchestration as a core engineering skill</strong>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </CompanyPageShell>
  );
};

export default Manifesto;
