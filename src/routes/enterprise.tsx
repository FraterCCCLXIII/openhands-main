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

const PARTNER_LOGOS = [
  { url: '/assets/webflow/logos/69137e34e3a5ab71e37082a7_NVIDIA_logo1.svg' },
  { url: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg' },
];

const RESULTS = [
  {
    text: 'Up to 30\u00d7 productivity gains',
    icon: '/assets/webflow/misc/6908c811a8fa726a4aa72efc_Frame_48095783.svg',
  },
  {
    text: 'Thousands of vulnerabilities fixed',
    icon: '/assets/webflow/misc/6908c811d0cad14d06a87f29_Frame_48095783-4.svg',
  },
  {
    text: 'Weeks of work done in hours',
    icon: '/assets/webflow/misc/6908c811c8dbad82a69f7814_Frame_48095783-5.svg',
  },
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
    <main>
      {/* Hero with ASCII background */}
      <section className='relative overflow-hidden px-10 pb-12 pt-10 lg:pt-12'>
        <div className='pointer-events-none absolute inset-0 opacity-[0.12]'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            className='h-full w-full object-cover'
          />
        </div>
        <div className='relative mx-auto flex max-w-4xl flex-col items-center gap-6 text-center'>
          <h1 className='sr-only'>Open source agent infrastructure for code modernization</h1>
          <div className='section-title text-brand-fg'>
            Open source agent infrastructure for code modernization
          </div>
          <div className='max-w-2xl fluid-body-lg text-brand-muted'>
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

      {/* Features */}
      <section className='px-10 py-20'>
        <div className='mx-auto grid max-w-[1260px] gap-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:justify-between'>
          <div>
            <h2 className='mb-6 max-w-[386px] section-title text-brand-fg'>
              Why Enterprises Choose OpenHands
            </h2>
            <OverlayLinkButton href='/contact' label='Contact us' variant='outline' />
          </div>
          <div className='space-y-0'>
            {ENTERPRISE_FEATURES.map((feature) => (
              <article key={feature.title} className='grid grid-cols-[64px_minmax(0,1fr)] gap-5'>
                <div className='pt-4'>
                  <img src={feature.icon} alt='' className='h-10 w-10' />
                </div>
                <div className='border-t border-brand-fg/20 py-4'>
                  <p className='fluid-body-lg font-medium text-brand-fg'>
                    {feature.title}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* AMD Quote — full-width dark section with ASCII background */}
      <section className='relative overflow-hidden bg-brand-fg px-10 py-28'>
        <div className='pointer-events-none absolute inset-0'>
          <img
            src='/assets/webflow/backgrounds/690b50c95a72e7b17a1412a8_09a6ecb11584c3309a64a00d57130313_ascii-art_%2815%29_1.svg'
            alt='asci art'
            className='pointer-events-auto h-full w-full object-cover'
          />
        </div>
        <div className='relative mx-auto flex max-w-[812px] flex-col items-center gap-8 text-center'>
          <h2 className='testimonial-quote text-[#b3a88c]'>
            {'\u201c'}The integration of Lemonade Server with OpenHands reflects AMD{'\u2019'}s commitment to open-source innovation and developer choice. This collaboration enables local coding agents that prioritize privacy, cost efficiency, and flexible model selection {'\u2013'} while taking advantage of acceleration on Ryzen AI PCs. Together, we{'\u2019'}re supporting a range of workflows and staying true to open-source values.{'\u201d'}
          </h2>
          <div className='flex items-center gap-4'>
            <div className='text-[18px] font-medium text-brand-bg'>
              Adrian Macias,
            </div>
            <div className='text-[18px] font-medium text-brand-bg'>
              Sr. Director, Developer Acceleration at AMD
            </div>
            <div className='mx-2 h-8 w-px bg-brand-bg/30' />
            <img src='/assets/webflow/logos/690b53e4ae0418e84e83578b_amd.svg' alt='' className='h-10 w-auto' />
          </div>
          <span className='btn-wrap-dark'>
            <OverlayLinkButton href='/contact' label='Contact us' variant='outline' />
          </span>
        </div>
      </section>

      {/* Proof band — centered layout with ASCII background */}
      <section className='relative overflow-hidden px-10 py-44'>
        <div className='pointer-events-none absolute inset-0'>
          <img
            src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'
            alt='ASCII art depicting a large black hole with light and particles swirling around it.'
            className='pointer-events-auto h-full w-full object-cover'
          />
        </div>
        <div className='relative mx-auto max-w-[1260px] text-center'>
          <h2 className='mx-auto w-fit fluid-h3 text-brand-fg'>
            Powering enterprise AI with the world{'\u2019'}s best
          </h2>
          <p className='mx-auto mt-4 fluid-body-lg text-brand-muted'>
            OpenHands partners with the leading AI infrastructure providers to ensure our platform is optimized for the latest generation of compute so your team can build on top of it faster.
          </p>
          <div className='mt-10 flex items-center justify-center gap-12'>
            {PARTNER_LOGOS.map((logo) => (
              <img key={logo.url} src={logo.url} alt='' className='h-12 w-auto object-contain' />
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className='px-10 py-28'>
        <div className='mx-auto max-w-[1260px] text-center'>
          <h3 className='mx-auto w-fit section-title text-brand-fg'>
            Proven results across industries
          </h3>
          <p className='mx-auto mt-4 max-w-[660px] fluid-body-lg text-brand-muted'>
            Enterprises use OpenHands to fix thousands of vulnerabilities, refactor codebases, and ship faster with less risk
          </p>
          <div className='mt-10 overflow-hidden rounded-[24px] border border-brand-fg/10'>
            <div className='bg-brand-fg/20 px-6 py-4 text-left'>
              <span className='font-mono text-sm text-brand-fg'>Measured impact</span>
            </div>
            <div className='grid gap-px bg-brand-fg/10 md:grid-cols-3'>
              {RESULTS.map((result) => (
                <article key={result.text} className='flex flex-col items-center gap-4 bg-brand-bg p-8 text-center'>
                  <img src={result.icon} alt='' className='h-32 w-32' />
                  <p className='w-full fluid-body-lg font-medium text-[#5f5f5f]'>{result.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Whitepaper — centered layout */}
      <section className='px-10 py-28'>
        <div className='mx-auto max-w-[860px] text-center'>
          <h3 className='section-title text-brand-fg'>
            Whitepaper: Modernize legacy systems before your expertise disappears
          </h3>
          <p className='mx-auto mt-4 max-w-[660px] fluid-body-lg text-brand-muted'>
            Legacy modernization projects fail 74% of the time and the engineers who understand your COBOL, mainframe, and legacy systems are retiring faster than you can replace them.
          </p>
          <div className='mt-8'>
            <OverlayLinkButton
              href='/whitepapers/modernize-legacy-systems-with-ai-agents'
              label='Download the Whitepaper'
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className='px-10 py-20 text-center'>
        <div className='mx-auto flex max-w-[812px] flex-col items-center gap-6'>
          <div className='section-title text-brand-fg'>
            Bring agentic development to your organization.
          </div>
          <p className='w-full fluid-body-lg text-brand-muted'>
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
