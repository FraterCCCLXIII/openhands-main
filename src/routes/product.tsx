import type { Route } from './+types/product';

const INTERFACES = [
  {
    title: 'Terminal / CLI',
    description:
      'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
    link: '/product/cli',
    image: '/assets/webflow/misc/699490d1d9729682e0daf0a5_cli.png',
  },
  {
    title: 'Web GUI',
    description:
      'Plan, run, and review agent work together in a collaborative UI.',
    link: '/product/gui',
    image: '/assets/webflow/misc/6994c3bfa634f5f3966d2150_4c76230966d0d54a446a009e4f4a19c2_gui.png',
  },
  {
    title: 'SDK',
    description:
      'Create specialized agents, integrate internal tools, and orchestrate complex workflows programmatically.',
    link: '/product/sdk',
    image: '/assets/webflow/misc/699f4b0b80190eeea4ba3eb9_sdk-1.png',
  },
];

const COMPARISON_ROWS = [
  ['Open-source', 'Yes', 'No', 'No', 'No'],
  ['Model-agnostic', 'Yes', 'No', 'No', 'No'],
  ['Sandbox runtime', 'Yes', 'No', 'No', 'No'],
  ['Self-hosted', 'Yes', 'No', 'No', 'No'],
  ['Coding Agent SDK', 'Yes', 'No', 'No', 'No'],
];

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Product | Autonomous Cloud Coding Agents' },
    {
      name: 'description',
      content:
        'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
    },
    { property: 'og:title', content: 'OpenHands Product | Autonomous Cloud Coding Agents' },
    {
      property: 'og:description',
      content:
        'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const Product = () => {
  return (
    <main className='pt-[100px]'>
      <section className='px-10 py-20'>
        <div className='mx-auto flex max-w-4xl flex-col items-center gap-6 text-center'>
          <h1 className='text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
            Build better software with autonomous cloud agent
          </h1>
          <p className='max-w-2xl text-[18px] leading-[1.6] text-brand-muted'>
            Offload toil, ship faster. OpenHands automates real development tasks with transparency, governance, and choice.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <a
              href='https://app.all-hands.dev/'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-primary rounded-none'
            >
              Try it live
            </a>
            <a href='/joinslack' className='btn btn-primary rounded-none'>
              Join Slack
            </a>
            <a
              href='https://docs.openhands.dev/overview/introduction'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline rounded-none'
            >
              See developer docs
            </a>
          </div>
        </div>
      </section>

      <section className='px-10 py-20'>
        <div className='mx-auto grid max-w-[1260px] gap-8 lg:grid-cols-3'>
          {INTERFACES.map((item) => (
            <article
              key={item.title}
              className='flex h-full flex-col rounded-[24px] border border-brand-fg/10 bg-brand-fg p-6'
            >
              <h2 className='text-[32px] lg:text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-bg'>
                {item.title}
              </h2>
              <p className='mt-4 text-[17px] leading-[1.6] text-[#b3a88c]'>
                {item.description}
              </p>
              <a
                href={item.link}
                target={item.link.startsWith('http') ? '_blank' : undefined}
                rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                className='mt-4 text-[16px] font-medium leading-[1.4] text-brand-bg underline underline-offset-4'
              >
                Learn more
              </a>
              <img
                src={item.image}
                alt={item.title}
                className='mt-8 w-full rounded-[20px] border border-brand-fg/10 bg-brand-bg object-cover'
              />
            </article>
          ))}
        </div>
      </section>

      <section className='px-10 py-20'>
        <div className='mx-auto flex max-w-[1260px] flex-col items-center gap-10 text-center'>
          <div className='max-w-4xl'>
            <h2 className='text-[32px] lg:text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
              The only open, secure, and scalable agent platform built for real engineering work
            </h2>
          </div>
          <div className='w-full overflow-x-auto rounded-[24px] border border-brand-fg/10 bg-white/50'>
            <table className='min-w-full border-collapse text-left'>
              <thead>
                <tr className='border-b border-brand-fg/10 text-[15px] uppercase tracking-[0.08em] text-brand-muted'>
                  <th className='px-6 py-4 font-medium'>Feature</th>
                  <th className='px-6 py-4 font-medium'>OpenHands</th>
                  <th className='px-6 py-4 font-medium'>Devin</th>
                  <th className='px-6 py-4 font-medium'>Claude Code</th>
                  <th className='px-6 py-4 font-medium'>Factory</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row[0]} className='border-b border-brand-fg/10 last:border-b-0'>
                    {row.map((cell, index) => (
                      <td
                        key={`${row[0]}-${index}`}
                        className={
                          index === 0
                            ? 'px-6 py-4 text-[18px] font-medium text-brand-fg'
                            : 'px-6 py-4 text-[16px] text-brand-muted'
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a
            href='https://app.all-hands.dev/'
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-primary rounded-none'
          >
            Try it live
          </a>
        </div>
      </section>

      <section className='px-10 py-20 text-center'>
        <div className='mx-auto flex max-w-3xl flex-col items-center gap-6'>
          <h2 className='text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
            Building the open standard for autonomous software development.
          </h2>
          <p className='max-w-2xl text-[18px] leading-[1.6] text-brand-muted'>
            OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <a
              href='https://app.all-hands.dev/'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-primary rounded-none'
            >
              Try it live
            </a>
            <a
              href='https://docs.openhands.dev/overview/introduction'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline rounded-none'
            >
              See developer docs
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Product;
