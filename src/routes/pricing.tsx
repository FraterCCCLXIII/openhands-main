import type { Route } from './+types/pricing';
import { MarketingFooterCta } from '~/components/marketing-footer-cta';
import { OverlayLinkButton } from '~/components/overlay-link-button';

const CARD_CHECK_ICON = '/assets/webflow/icons/690cb1513c759a7404df1ba1_check.svg';
const TABLE_TICK_ICON = '/assets/webflow/icons/691234bd9e72712ffbcf9470_tick.svg';

const PRICING_PLANS = [
  {
    eyebrow: 'Local',
    title: 'Open Source',
    price: 'Free',
    description: 'Free, local OpenHands for getting started',
    intro: 'Includes:',
    buttonLabel: 'Download',
    buttonHref: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    features: [
      'Best-in-class OpenHands Agent',
      'Web-based GUI, Terminal UI, and CLI',
      'Git integrations',
      'Community support',
      'Model agnostic',
    ],
  },
  {
    eyebrow: 'SaaS',
    title: 'Individual',
    price: 'Free',
    description: 'Bring your own key or use our providers at-cost',
    intro: 'Everything in Free, plus:',
    buttonLabel: 'Get started free',
    buttonHref: 'https://app.all-hands.dev/',
    features: [
      'Hosted cloud access from desktop and mobile',
      'API support for automation and scripting',
      'Jira and Slack integrations',
      'BYOK or use OpenHands models at-cost',
    ],
  },
  {
    eyebrow: 'SaaS or Self-hosted',
    title: 'Enterprise',
    price: 'Custom pricing',
    description: 'Full control and support. Private VPC and BYOK options',
    intro: 'Includes:',
    buttonLabel: 'Contact us',
    buttonHref: '/contact',
    features: [
      'SaaS or Self-hosted in your VPC',
      'Enterprise SAML / SSO',
      'Unlimited concurrent convos per user',
      'Large Codebase SDK',
      'Priority support & shared Slack channel',
    ],
  },
];

type ComparisonRow =
  | { type: 'section'; label: string }
  | { type: 'values'; label: string; values: [string, string, string] }
  | { type: 'ticks'; label: string; values: [boolean, boolean, boolean] };

const COMPARISON_ROWS: ComparisonRow[] = [
  { type: 'section', label: 'Features' },
  { type: 'values', label: 'Pricing', values: ['Free', 'Free', 'Contact Us'] },
  { type: 'section', label: 'Key Capabilities' },
  { type: 'values', label: 'Deployment options', values: ['Runs locally', 'SaaS', 'Self-hosted'] },
  { type: 'values', label: 'Agent', values: ['OpenHands', 'OpenHands', 'OpenHands'] },
  { type: 'values', label: 'Users', values: ['1', '1', 'Unlimited'] },
  { type: 'values', label: 'Max Daily Conversations', values: ['Unlimited', '10', 'Unlimited'] },
  {
    type: 'ticks',
    label: 'Bring your own key, or you use OpenHands provider at-cost',
    values: [true, true, true],
  },
  { type: 'ticks', label: 'Web-based GUI', values: [true, true, true] },
  { type: 'ticks', label: 'OpenHands CLI', values: [true, true, true] },
  { type: 'ticks', label: 'Git Integrations (GitHub, Bitbucket, GitLab)', values: [true, true, true] },
  { type: 'ticks', label: 'Secrets', values: [true, true, true] },
  { type: 'ticks', label: 'Cloud Agent SDK', values: [true, true, true] },
  { type: 'ticks', label: 'MCP Support', values: [true, true, true] },
  { type: 'ticks', label: 'Organization Support', values: [true, true, true] },
  { type: 'ticks', label: 'Multi-user RBAC', values: [false, false, true] },
  { type: 'ticks', label: 'Centralized team billing', values: [false, false, true] },
  { type: 'section', label: 'Integrations' },
  { type: 'ticks', label: 'Enterprise SAML/SSO', values: [false, false, true] },
  { type: 'ticks', label: 'Cloud APIs', values: [true, true, true] },
  { type: 'ticks', label: 'Jira Integration', values: [true, true, true] },
  { type: 'ticks', label: 'Slack Integration', values: [true, true, true] },
  { type: 'ticks', label: 'Large Codebase SDK', values: [false, false, true] },
  { type: 'section', label: 'Support' },
  { type: 'ticks', label: 'Priority support', values: [false, false, true] },
  { type: 'ticks', label: 'Ticket based support', values: [false, false, true] },
  { type: 'ticks', label: 'Named Customer Engineer', values: [false, false, true] },
  { type: 'ticks', label: 'Shared Slack Channel', values: [false, false, true] },
];

const FAQS = [
  {
    question: 'What are the main differences between the pricing plans?',
    answer: (
      <>
        <p>
          OpenHands Cloud is a hosted SaaS version of OpenHands that provides out-of-the-box runtime support and a high token rate LLM access. There are a few options with OpenHands Cloud:
        </p>
        <ul className='mt-3 list-disc space-y-2 pl-5'>
          <li>
            Individual plan: Support for 1 user. Great for individuals who want to bring their own LLM Key, or pay-as-you-go when using the OpenHands LLM provider.
          </li>
          <li>
            Growth Plan: Support for multiple users. Great for small organizations who want the on-demand convenience of OpenHands Cloud and additional support.
          </li>
          <li>
            Enterprise plan: A self-hosted option and support for multiple users. Great for organizations who want to deploy OpenHands across many teams and centrally manage access on-premise. Additional support and enterprise services are included.
          </li>
        </ul>
        <p className='mt-3'>‍</p>
      </>
    ),
  },
  {
    question: 'What are the main differences between OpenHands open source, and OpenHands Cloud?',
    answer: (
      <>
        <p>
          OpenHands Open Source is a full, MIT licensed version of OpenHands that is designed for a single user and can run locally on your machine with your own LLM key. At a high level, our open source options include a local Web GUI, a CLI, and a Software Agent SDK.
        </p>
        <p className='mt-3'>
          OpenHands Cloud is a SaaS-based version of OpenHands with both a free Individual tier, as well as commercial tiers for organizations and businesses. OpenHands Cloud also comes with additional features like Cloud APIs, ticketing system integrations, Git provider integrations, and more.
        </p>
        <p className='mt-3'>‍</p>
      </>
    ),
  },
  {
    question: 'Can I bring my own model keys?',
    answer: (
      <>
        <p>Yes! OpenHands Open Source and OpenHands Cloud plans offer support to bring your own LLM keys.</p>
        <p className='mt-3'>‍</p>
      </>
    ),
  },
  {
    question: 'What is the token pricing for the Individual Plan?',
    answer: (
      <>
        <p>
          If you do not have an LLM key, you can use theOpenHands LLM provider (available within the Individual Tier), which provides multiple model options at cost, with no markup on a pay-as-you-go basis.
        </p>
        <p className='mt-3'>
          When you sign up for the Individual Plan, you can access models under the Settings &gt; Language Models (LLM) page.
        </p>
        <p className='mt-3'>
          You can also generate an API key for the OpenHands LLM provider under the Settings &gt; API page, which you can use in tools like the OpenHands CLI, OpenHands Local Web UI, and OpenHands Software Agent SDK.
        </p>
      </>
    ),
  },
];

const TickCell = ({ enabled }: { enabled: boolean }) => {
  if (!enabled) {
    return <span className='block h-5 w-5' aria-hidden='true' />;
  }

  return <img src={TABLE_TICK_ICON} alt='tick icon' className='h-5 w-5' />;
};

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Pricing | Start Building for Free' },
    {
      name: 'description',
      content:
        'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans for advanced control and scalability.',
    },
    { property: 'og:title', content: 'OpenHands Pricing | Start Building for Free' },
    {
      property: 'og:description',
      content:
        'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans for advanced control and scalability.',
    },
    {
      property: 'og:image',
      content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'OpenHands Pricing | Start Building for Free' },
    {
      name: 'twitter:description',
      content:
        'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans for advanced control and scalability.',
    },
    {
      name: 'twitter:image',
      content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const Pricing = () => {
  return (
    <main className='bg-brand-bg'>
      <section className='relative overflow-hidden bg-brand-bg px-10 pb-10 pt-10 lg:pt-12'>
        <div className='pointer-events-none absolute inset-0 opacity-[0.12]'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            className='h-full w-full object-cover'
          />
        </div>
        <div className='relative mx-auto flex max-w-4xl flex-col items-center gap-4 pb-4 text-center'>
          <h1 className='text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
            Pricing that fits your rollout
          </h1>
          <p className='max-w-2xl text-[20.8px] leading-[1.2] text-brand-muted'>
            Run locally, in our cloud, or self-host. Pay only for what you need
          </p>
        </div>
        <div className='relative mx-auto mt-4 grid max-w-[1260px] gap-6 lg:grid-cols-3'>
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.title}
              className='flex h-full flex-col rounded-[16px] border border-brand-fg/20 bg-[#f5ecd6]/90 p-8 shadow-[0_0_0_1px_rgba(34,21,13,0.02)]'
            >
              <div className='text-sm uppercase tracking-[0.14em] text-brand-muted'>{plan.eyebrow}</div>
              <div className='mt-2 text-[32px] font-medium leading-[1.15] text-brand-fg'>{plan.title}</div>
              <p className='mt-3 text-[20px] font-medium leading-[28px] text-[#5f5f5f]'>{plan.price}</p>
              <p className='mt-4 text-[16px] leading-[22.4px] text-brand-muted'>{plan.description}</p>
              <p className='mt-6 text-[16px] font-medium text-[#5f5f5f]'>{plan.intro}</p>
              <ul className='mt-4 flex flex-1 flex-col gap-3'>
                {plan.features.map((feature) => (
                  <li key={feature} className='flex items-start gap-3 font-sohne-buch text-[16px] leading-[1.5] text-[#5f5f5f]'>
                    <img src={CARD_CHECK_ICON} alt='' aria-hidden='true' className='mt-0.5 h-5 w-5 flex-none' />
                    <p className='flex-1'>{feature}</p>
                  </li>
                ))}
              </ul>
              <OverlayLinkButton
                href={plan.buttonHref}
                label={plan.buttonLabel}
                variant='outline'
                className='mt-8'
                fullWidth
              />
            </article>
          ))}
        </div>
      </section>

      <section className='px-10 pb-20 pt-12'>
        <div className='mx-auto max-w-[1260px]'>
          <h2 className='sr-only'>Compare plans</h2>
          <div className='overflow-x-auto rounded-[24px] bg-brand-fg px-6 py-6 text-brand-bg lg:px-8 lg:py-6'>
            <table className='w-full border-collapse text-left' style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '24%' }} />
              </colgroup>
              <thead>
                <tr className='border-b border-brand-bg/18 text-[13px] text-brand-bg'>
                  <th className='py-3 pr-6 font-medium'><p>Features</p></th>
                  <th className='py-3 font-medium text-brand-bg'><p>Open Source</p></th>
                  <th className='py-3 font-medium text-brand-bg'><p>Individual</p></th>
                  <th className='py-3 font-medium text-brand-bg'><p>Enterprise</p></th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => {
                  if (row.type === 'section') {
                    return (
                      <tr key={row.label} className='border-b border-brand-bg/18'>
                        <th colSpan={4} className='py-4 pr-6 text-sm uppercase tracking-[0.14em] text-brand-bg/70'>
                          <span>{row.label}</span>
                        </th>
                      </tr>
                    );
                  }

                  if (row.type === 'values') {
                    return (
                      <tr key={row.label} className='border-b border-brand-bg/12 last:border-b-0'>
                        <th className='py-3 pr-6 font-sohne-buch text-[16px] font-medium text-[#b3a88c]'>
                          <p>{row.label}</p>
                        </th>
                        {row.values.map((value, index) => (
                          <td key={`${row.label}-${index}`} className='py-3 font-sohne-buch text-[16px] text-[#b3a88c]'>
                            <p>{value}</p>
                          </td>
                        ))}
                      </tr>
                    );
                  }

                  return (
                    <tr key={row.label} className='border-b border-brand-bg/12 last:border-b-0'>
                      <th className='py-3 pr-6 font-sohne-buch text-[16px] font-medium text-[#b3a88c]'>
                        <p>{row.label}</p>
                      </th>
                      {row.values.map((enabled, index) => (
                        <td key={`${row.label}-${index}`} className='py-3'>
                          <TickCell enabled={enabled} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className='px-10 py-32'>
        <div className='mx-auto grid max-w-[1260px] gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16'>
          <div>
            <h2 className='text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
              FAQ&apos;s
            </h2>
            <OverlayLinkButton href='/contact' label='Contact us' variant='outline' className='mt-8' />
          </div>
          <div className='border-t border-brand-fg/15'>
            {FAQS.map((faq) => (
              <details key={faq.question} className='group border-b border-brand-fg/15 py-4'>
                <summary className='flex cursor-pointer list-none items-start justify-between gap-6 text-[24px] font-medium leading-[1.4] text-brand-fg'>
                  <label className='block pointer-events-none cursor-default'>{faq.question}</label>
                  <span className='mt-1 text-[22px] leading-none transition-transform group-open:rotate-45'>+</span>
                </summary>
                <div className='max-w-[680px] pt-4 font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]'>{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooterCta />
    </main>
  );
};

export default Pricing;
