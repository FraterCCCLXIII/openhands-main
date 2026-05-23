import type { CSSProperties } from 'react';
import ASCIIAnimation from '~/components/ascii-animation';
import { CompanyPageShell } from '~/components/company-page-shell';
import type { Route } from './+types/manifesto';
import { createSocialPreviewMeta } from '~/utils/seo';
import { useWidth } from '~/hooks/use-media';

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

const paragraphStyle: CSSProperties = {
  marginBottom: '1em',
  lineHeight: '22.385px',
  textWrap: 'pretty',
};

const SeparatorParagraph = () => (
  <p className='font-sohne-buch text-[#5f5f5f]' style={paragraphStyle}>‍</p>
);

const MutedEm = ({ children }: { children: React.ReactNode }) => (
  <em className='not-italic text-[#7d7d7d]'>{children}</em>
);

const ManifestoPoint = ({
  point,
  index,
}: {
  point: (typeof MANIFESTO_POINTS)[number];
  index: number;
}) => (
  <>
    <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]' style={paragraphStyle}>
      <strong className='font-bold text-black'>
        {point.heading}
        <br />
      </strong>
      {point.body}
      {index > 0 && index < MANIFESTO_POINTS.length - 1 ? <><br />‍</> : null}
    </p>
    {index === 0 ? <SeparatorParagraph /> : null}
  </>
);

const Manifesto = () => {
  const width = useWidth();
  const isMobile = width < 768;
  const heroHeight = isMobile ? '217.077px' : '241.484375px';
  const h3Spacing = isMobile
    ? { marginTop: '24.3929px', marginBottom: '7.31786px' }
    : { marginTop: '32px', marginBottom: '9.6px' };

  return (
    <CompanyPageShell layoutPath='/manifesto' showBackground={false}>
      <section data-wf-el='section-hero' className='relative' style={{ height: heroHeight, padding: '0px' }}>
        <div data-wf-el='standard-collection' style={isMobile ? undefined : { height: heroHeight }}>
          <div data-wf-el='standard-collection-list' style={isMobile ? undefined : { height: heroHeight }}>
            <div data-wf-el='standard-collection-list-item' style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px', ...(isMobile ? {} : { height: heroHeight }) }}>
              <div
                data-wf-el='hero-content'
                className='relative flex flex-col items-center justify-center text-center'
                style={{ padding: '56px 0px', ...(isMobile ? {} : { height: heroHeight }) }}
              >
                <div
                  data-wf-el='asci-wrap'
                  className='manifesto-ascii pointer-events-auto absolute inset-0 overflow-hidden'
                  style={{ '--ascii-opacity': '0.12', maxHeight: isMobile ? '812px' : '2400px', textAlign: 'center' } as CSSProperties}
                  aria-hidden='true'
                >
                  <ASCIIAnimation className='h-full w-full' />
                </div>
                <div data-wf-el='container' className='text-center' style={{ width: '90%', maxWidth: '1238px', marginLeft: 'auto', marginRight: 'auto' }}>
                  <div style={{ maxWidth: isMobile ? '493px' : '492.5px', marginLeft: 'auto', marginRight: 'auto' }}>
                    <h1 className='fluid-h1 h1-flow-root text-brand-fg'>
                      Hands on the Future
                    </h1>
                    <p
                      data-wf-el='paragraph-lg'
                      className='fluid-body-lg font-medium text-[#5f5f5f]'
                      style={{ marginTop: isMobile ? '8.87857px' : '10.4px', marginBottom: isMobile ? '17.7571px' : '20.8px' }}
                    >
                      We believe in an open, autonomous future for software development
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        data-wf-el='section'
        style={{ padding: isMobile ? '0px 0px 49.5714px' : '0px 0px 80px', position: 'relative' }}
      >
        <div data-wf-el='standard-collection'>
          <div data-wf-el='standard-collection-list'>
            <div data-wf-el='standard-collection-list-item' style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div aria-hidden='true' style={{ display: 'table' }} />
              <div data-wf-el='container' style={{ width: '90%', maxWidth: '1238px', margin: '49.6px auto 0px' }}>
                <div style={{ maxWidth: isMobile ? '919px' : '918.5px', marginLeft: 'auto', marginRight: 'auto' }}>
                  <div
                    data-wf-el='standard-media'
                    className='overflow-hidden'
                    style={{ display: 'flex', position: 'relative', justifyContent: 'center', alignItems: 'center', borderRadius: '6.4px', width: '100%', minHeight: isMobile ? '200px' : 'auto', height: isMobile ? '310px' : '363.375px' }}
                  >
                    <img
                      data-wf-el='standard-media-img'
                      src='/assets/webflow/misc/691645a7832560da97f475c5_Featured_manifesto.png'
                      alt=''
                      className='img-block object-cover'
                      style={{ borderRadius: '0px', width: '100%', height: isMobile ? '310px' : '363.375px', minHeight: isMobile ? '310px' : 'auto' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: isMobile ? '64px' : '128px' }}>
                  <div data-wf-el='rich-text' className='webflow-rich-text font-sohne-buch' style={{ width: '95%', maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto' }}>
                    <h3 className='fluid-h3 font-sohne text-brand-fg' style={{ marginBottom: h3Spacing.marginBottom }}>
                    We&apos;re at the beginning of a new era in software <MutedEm>development. Work is shifting from keystrokes to delegated tasks,</MutedEm> from single laptops to coordinated fleets of agents running in environments you control.
                    <br />
                    <br />
                    <MutedEm>This is</MutedEm> our point of view <MutedEm>on how we build, what we ship, and</MutedEm> why it matters… <MutedEm>We believe</MutedEm>:
                    <br />‍
                  </h3>

                  {MANIFESTO_POINTS.map((point, index) => (
                    <ManifestoPoint key={point.heading} point={point} index={index} />
                  ))}

                  <SeparatorParagraph />
                  <SeparatorParagraph />

                  <h3 className='fluid-h3 font-sohne text-brand-fg' style={h3Spacing}>
                    What this means for OpenHands
                  </h3>
                  <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]' style={paragraphStyle}>
                    <strong className='font-bold text-black'>
                      {'We are building the open, secure, and model-agnostic platform for cloud coding agents.\u2028\u2028'}
                      <br />
                      Every agent runs in a containerized sandbox you control.
                    </strong>{' '}
                    Every outcome can be measured and reviewed. You can self-host the open source, or use our cloud. You can bring your own models and switch without drama. You can start local, then scale to thousands of concurrent agents running throughout your codebase.
                  </p>

                  <SeparatorParagraph />

                  <h3 className='fluid-h3 font-sohne text-brand-fg' style={h3Spacing}>
                    What this asks of you
                  </h3>
                  <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]' style={paragraphStyle}>
                    <strong className='font-bold text-black'>Adopt an agentic mindset. Identify toil. Delegate clearly. Measure success. Invest in agent orchestration as a core engineering skill</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>
    </CompanyPageShell>
  );
};

export default Manifesto;
