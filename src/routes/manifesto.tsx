import { CompanyPageShell } from '~/components/company-page-shell';
import type { Route } from './+types/manifesto';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Manifesto | The Future of Open, Autonomous Software Development' },
    {
      name: 'description',
      content:
        'We believe software development should be open, transparent, and autonomous. Discover OpenHands’ vision for the next era of agentic software development.',
    },
    {
      property: 'og:title',
      content: 'OpenHands Manifesto | The Future of Open, Autonomous Software Development',
    },
    {
      property: 'og:description',
      content:
        'We believe software development should be open, transparent, and autonomous. Discover OpenHands’ vision for the next era of agentic software development.',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

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

const SeparatorParagraph = () => <p className='h-4 font-sohne-buch text-[#5f5f5f]'>‍</p>;

const Manifesto = () => {
  return (
    <CompanyPageShell>
      <section data-wf-el='section-hero' className='px-6 pb-10 pt-12 lg:px-10 lg:pb-10 lg:pt-12'>
        <div className='mx-auto max-w-[520px] text-center'>
          <h1 className='fluid-h1 text-brand-fg'>
            Hands on the Future
          </h1>
          <p className='mt-4 fluid-body-lg font-medium text-[#5f5f5f]'>
            We believe in an open, autonomous future for software development
          </p>
        </div>
      </section>

      <section data-wf-el='section' className='px-6 pb-16 lg:px-10 lg:pb-20'>
        <div className='mx-auto max-w-[919px]'>
          <img
            src='/assets/webflow/misc/691645a7832560da97f475c5_Featured_manifesto.png'
            alt=''
            className='img-block w-full object-cover'
            style={{ borderRadius: '0px' }}
          />

          <div className='mx-auto mt-20 max-w-[820px] lg:mt-28'>
            <h3 className='fluid-h3 text-brand-fg'>
              We&apos;re at the beginning of a new era in software <em>development. Work is shifting from keystrokes to delegated tasks,</em> from single laptops to coordinated fleets of agents running in environments you control.
              <br />
              <br />
              <em>This is</em> our point of view <em>on how we build, what we ship, and</em> why it matters… <em>We believe</em>:
              <br />‍
            </h3>

            <div className='mt-8 space-y-8'>
              {MANIFESTO_POINTS.map((point, index) => (
                <div key={point.heading}>
                  <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]'>
                    <strong className='font-bold text-black'>{point.heading}</strong>
                    <br />
                    {point.body}
                  </p>
                  {index < MANIFESTO_POINTS.length - 1 ? <SeparatorParagraph /> : null}
                </div>
              ))}
            </div>

            <SeparatorParagraph />
            <SeparatorParagraph />

            <section data-wf-el='section' className='mt-12 space-y-3'>
              <h3 className='fluid-h3 text-brand-fg'>
                What this means for OpenHands
              </h3>
              <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]'>
                <strong className='font-bold text-black'>We are building the open, secure, and model-agnostic platform for cloud coding agents. Every agent runs in a containerized sandbox you control.</strong>{' '}
                Every outcome can be measured and reviewed. You can self-host the open source, or use our cloud. You can bring your own models and switch without drama. You can start local, then scale to thousands of concurrent agents running throughout your codebase.
              </p>
            </section>

            <SeparatorParagraph />

            <section data-wf-el='section' className='mt-10 space-y-3'>
              <h3 className='fluid-h3 text-brand-fg'>
                What this asks of you
              </h3>
              <p className='font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]'>
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
