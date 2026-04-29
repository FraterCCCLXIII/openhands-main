import type { Route } from './+types/manifesto';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Manifesto | The Future of Open, Autonomous Software Development' },
    { name: 'description', content: 'We believe software development should be open, transparent, and autonomous. Discover OpenHands’ vision for the next era of agentic software development.' },
    { property: 'og:title', content: 'OpenHands Manifesto | The Future of Open, Autonomous Software Development' },
    { property: 'og:description', content: 'We believe software development should be open, transparent, and autonomous. Discover OpenHands’ vision for the next era of agentic software development.' },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const MANIFESTO_POINTS = [
  {
    heading: 'The future of software development must be written by engineers',
    body: "Software development is changing. That change needs to happen in the open, driven by a community of professional developers. That's why OpenHands' software agent is MIT-licensed and trusted by a growing community.",
  },
  {
    heading: 'A new class of engineers are emerging',
    body: "Most engineers write lines of code, maybe with an AI assistant. But Agentic Engineers tackle code maintenance at scale by orchestrating tens to thousands of cloud-based agents. Agent orchestras aren't appropriate for every engineering task, but Agentic Engineers will automate away the toil and busywork weighing down their teams.",
  },
  {
    heading: 'Scale lives in the cloud',
    body: 'We believe local agents are a bridge, not the destination. Real leverage comes from agents that run in the cloud or your own VPC, so teams can parallelize thousands of tasks and treat automation as infrastructure.',
  },
  {
    heading: 'Openness is non-negotiable',
    body: "AI agents are a transformative technology and an increasingly critical part of the world's infrastructure. We need agents that are open source, transparent, and inspectable if we're going to deploy AI safely and responsibly.",
  },
  {
    heading: 'Model choice is a right',
    body: 'We believe you should pick the best model for each job and switch when economics or quality change. This will only become more important as models improve and new tradeoffs emerge. Vendor flexibility is a feature, not a footnote.',
  },
  {
    heading: 'Security is a runtime, not a promise',
    body: 'We believe agents must run in isolated, auditable environments with scoped credentials and a clear blast radius. Teams need visibility into how agents are behaving, and the ability to intervene when something breaks.',
  },
];

const Manifesto = () => {
  return (
    <main className='pt-[100px]'>
      <section className='px-6 pb-10 pt-16 lg:px-10 lg:pb-12 lg:pt-24'>
        <div className='mx-auto max-w-[720px] text-center'>
          <h1 className='font-quincy text-[48px] font-normal leading-[0.95] tracking-[-0.04em] text-brand-fg lg:text-[60px]'>
            Hands on the Future
          </h1>
          <p className='mt-4 text-lg leading-[1.5] text-brand-muted'>
            We believe in an open, autonomous future for software development
          </p>
        </div>
      </section>

      <section className='px-6 pb-16 lg:px-10 lg:pb-24'>
        <div className='mx-auto max-w-[980px]'>
          <img
            src='https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/691645a7832560da97f475c5_Featured%20manifesto.png'
            alt='Hands on the Future manifesto artwork'
            className='w-full rounded-[28px] object-cover'
          />

          <div className='mx-auto mt-12 max-w-[860px]'>
            <h2 className='text-[20px] font-medium leading-[1.6] text-brand-fg'>
              We&apos;re at the beginning of a new era in software <em>development. Work is shifting from keystrokes to delegated tasks,</em> from single laptops to coordinated fleets of agents running in environments you control. <em>This is</em> our point of view <em>on how we build, what we ship, and</em> why it matters… <em>We believe</em>:
            </h2>

            <div className='mt-10 space-y-8'>
              {MANIFESTO_POINTS.map((point) => (
                <section key={point.heading} className='space-y-3'>
                  <h3 className='text-[20px] font-semibold leading-[1.4] text-brand-fg'>{point.heading}</h3>
                  <p className='text-lg leading-[1.7] text-brand-fg'>{point.body}</p>
                </section>
              ))}
            </div>

            <section className='mt-12 space-y-3'>
              <h3 className='text-[20px] font-semibold leading-[1.4] text-brand-fg'>What this means for OpenHands</h3>
              <p className='text-lg leading-[1.7] text-brand-fg'>
                <strong>We are building the open, secure, and model-agnostic platform for cloud coding agents.</strong> Every agent runs in a containerized sandbox you control. Every outcome can be measured and reviewed. You can self-host the open source, or use our cloud. You can bring your own models and switch without drama. You can start local, then scale to thousands of concurrent agents running throughout your codebase.
              </p>
            </section>

            <section className='mt-10 space-y-3'>
              <h3 className='text-[20px] font-semibold leading-[1.4] text-brand-fg'>What this asks of you</h3>
              <p className='text-lg leading-[1.7] text-brand-fg'>
                <strong>Adopt an agentic mindset. Identify toil. Delegate clearly. Measure success. Invest in agent orchestration as a core engineering skill.</strong>
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Manifesto;
