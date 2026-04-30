import type { Route } from './+types/enterprise';
import { OverlayLinkButton } from '~/components/overlay-link-button';

const ENTERPRISE_FEATURES = [
  {
    title: 'Containerized sandbox runtime for safe autonomy',
    icon: '/assets/webflow/features/690b95b580671251fa0903f4_Frame48095772.svg',
  },
  {
    title: 'Secure enterprise platform with fine-grained access control',
    icon: '/assets/webflow/features/690b95bf82d3695da1690cb8_Frame48095773.svg',
  },
  {
    title: 'Self-host or private-cloud deployment',
    icon: '/assets/webflow/features/690b95ca541b813083e0b38a_Frame48095774.svg',
  },
  {
    title: 'Bring your own LLM via Anthropic, OpenAI, Bedrock, or any other model provider',
    icon: '/assets/webflow/features/690b95d3c92c94a6a9b249f8_Frame48095775.svg',
  },
  {
    title: 'Integrations with enterprise ecosystems',
    icon: '/assets/webflow/features/690b95d99040920ad0084107_Frame48095776.svg',
  },
  {
    title: 'Dedicated technical and account-level support',
    icon: '/assets/webflow/features/690b95df7d9ca76624d45550_Frame48095777.svg',
  },
];

const LOGOS = [
  { name: 'Amazon', url: '/assets/webflow/logos/69137f10c3975e28b3932320_Amazon_logo1.svg' },
  { name: 'Netflix', url: '/assets/webflow/logos/69137eac8f27ca27f5e48420_Netflix_2015_logo1.svg' },
  { name: 'Google', url: '/assets/webflow/logos/69137e199ce2cb594b0210ab_google-ar211.svg' },
  { name: 'AMD', url: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg' },
  { name: 'NVIDIA', url: '/assets/webflow/logos/69137e34e3a5ab71e37082a7_NVIDIA_logo1.svg' },
];

const RESULTS = [
  'Up to 30× productivity gains',
  'Thousands of vulnerabilities fixed',
  'Weeks of work done in hours',
];

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands for Enterprise | Secure, Scalable Agentic Software Development' },
    {
      name: 'description',
      content:
        'Deploy OpenHands securely across your organization. Enterprise-grade governance, compliance, and custom deployment options for agentic software development.',
    },
    {
      property: 'og:title',
      content: 'OpenHands for Enterprise | Secure, Scalable Agentic Software Development',
    },
    {
      property: 'og:description',
      content:
        'Deploy OpenHands securely across your organization. Enterprise-grade governance, compliance, and custom deployment options for agentic software development.',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const Enterprise = () => {
  return (
    <main className='pt-[100px]'>
      <section className='px-10 pb-20 pt-10 lg:pt-12'>
        <div className='mx-auto flex max-w-4xl flex-col items-center gap-6 text-center'>
          <h1 className='sr-only'>Open source agent infrastructure for code modernization</h1>
          <div className='text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
            Open source agent infrastructure for code modernization
          </div>
          <div className='max-w-2xl text-[18px] leading-[1.6] text-brand-muted'>
            Build AI coding agents around your stack, your rules, your team.
          </div>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <OverlayLinkButton href='/contact' label='Book a demo' />
            <OverlayLinkButton
              href='https://app.vanta.com/openhands.dev/trust/an0kgh9goh7xyqkhsb6tlp'
              label='Trust Center'
              variant='outline'
            />
          </div>
        </div>
      </section>

      <section className='px-10 py-20'>
        <div className='mx-auto max-w-[1260px]'>
          <div className='mb-10 flex flex-col items-center gap-6 text-center'>
            <h2 className='text-[32px] lg:text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
              Why Enterprises Choose OpenHands
            </h2>
            <OverlayLinkButton href='/contact' label='Contact us' variant='outline' />
          </div>
          <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
            {ENTERPRISE_FEATURES.map((feature) => (
              <article
                key={feature.title}
                className='flex h-full items-start gap-4 rounded-[24px] border border-brand-fg/10 bg-white/50 p-6'
              >
                <img src={feature.icon} alt='' className='mt-1 h-14 w-14 flex-none' />
                <p className='text-[22px] font-medium leading-[1.35] text-brand-fg'>
                  {feature.title}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='px-10 py-20'>
        <div className='mx-auto flex max-w-5xl flex-col items-center gap-8 rounded-[28px] bg-brand-fg px-8 py-12 text-center'>
          <img
            src='/assets/webflow/backgrounds/690b50c95a72e7b17a1412a8_09a6ecb11584c3309a64a00d57130313_ascii-art_%2815%29_1.svg'
            alt='asci art'
            className='h-24 w-auto object-contain'
          />
          <h2 className='testimonial-quote text-[#b3a88c]'>
            “The integration of Lemonade Server with OpenHands reflects AMD’s commitment to open-source innovation and developer choice. This collaboration enables local coding agents that prioritize privacy, cost efficiency, and flexible model selection – while taking advantage of acceleration on Ryzen AI PCs. Together, we’re supporting a range of workflows and staying true to open-source values.”
          </h2>
          <div className='flex flex-col items-center gap-3'>
            <div className='text-[18px] font-medium text-brand-bg'>
              Adrian Macias,
              <br />
              Sr. Director, Developer Acceleration at AMD
            </div>
            <img src='/assets/webflow/logos/690b53e4ae0418e84e83578b_amd.svg' alt='amd logo' className='h-10 w-auto' />
          </div>
          <OverlayLinkButton href='/contact' label='Contact us' variant='outline' />
        </div>
      </section>

      <section className='px-10 py-20'>
        <div className='mx-auto grid max-w-[1260px] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]'>
          <div>
            <h2 className='text-[32px] font-medium leading-[1.2] tracking-[-0.02em] text-brand-fg'>
              Powering enterprise AI with the world’s best
            </h2>
            <p className='mt-4 max-w-2xl text-[18px] leading-[1.6] text-brand-muted'>
              OpenHands partners with the leading AI infrastructure providers to ensure our platform is optimized for the latest generation of compute so your team can build on top of it faster.
            </p>
            <div className='logo-grid mt-10 justify-start'>
              {LOGOS.map((logo) => (
                <img key={logo.name} src={logo.url} alt='' />
              ))}
            </div>
          </div>
          <div className='overflow-hidden rounded-[28px] border border-brand-fg/10 bg-white/50'>
            <img
              src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'
              alt='ASCII art depicting a large black hole with light and particles swirling around it.'
              className='h-full w-full object-cover'
            />
          </div>
        </div>
      </section>

      <section className='px-10 py-20'>
        <div className='mx-auto max-w-[1260px]'>
          <div className='mb-2 text-sm uppercase tracking-[0.14em] text-brand-muted'>Measured impact</div>
          <h3 className='text-[32px] lg:text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
            Proven results across industries
          </h3>
          <p className='mt-4 max-w-2xl text-[18px] leading-[1.6] text-brand-muted'>
            Enterprises use OpenHands to fix thousands of vulnerabilities, refactor codebases, and ship faster with less risk
          </p>
          <div className='mt-10 grid gap-6 md:grid-cols-3'>
            {RESULTS.map((result) => (
              <article
                key={result}
                className='rounded-[24px] border border-brand-fg/10 bg-white/50 p-6'
              >
                <p className='text-[28px] font-medium leading-[1.2] text-brand-fg'>{result}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='px-10 py-20'>
        <div className='mx-auto flex max-w-[1000px] flex-col gap-6 rounded-[28px] border border-brand-fg/10 bg-white/50 px-8 py-10 lg:flex-row lg:items-center lg:justify-between'>
          <div className='max-w-2xl'>
            <h3 className='text-[32px] lg:text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
              Whitepaper: Modernize legacy systems before your expertise disappears
            </h3>
            <p className='mt-4 text-[18px] leading-[1.6] text-brand-muted'>
              Legacy modernization projects fail 74% of the time and the engineers who understand your COBOL, mainframe, and legacy systems are retiring faster than you can replace them.
            </p>
          </div>
          <OverlayLinkButton
            href='/whitepapers/modernize-legacy-systems-with-ai-agents'
            label='Download the Whitepaper'
          />
        </div>
      </section>

      <section className='px-10 py-20 text-center'>
        <div className='mx-auto flex max-w-3xl flex-col items-center gap-6'>
          <div className='text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
            Bring agentic development to your organization.
          </div>
          <p className='max-w-2xl text-[18px] leading-[1.6] text-brand-muted'>
            Deploy securely. Scale confidently. Stay in control.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <OverlayLinkButton href='https://docs.openhands.dev/sdk' label='Build with SDK' />
            <OverlayLinkButton
              href='https://app.all-hands.dev/'
              label='Try it live'
              variant='outline'
            />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Enterprise;
