import { Link } from 'react-router';
import type { Route } from './+types/product';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Product | Autonomous Cloud Coding Agents' },
    { name: 'description', content: 'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.' },
    { property: 'og:title', content: 'OpenHands Product | Autonomous Cloud Coding Agents' },
    { property: 'og:description', content: 'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const CAPABILITIES = [
  {
    title: 'Delegate',
    description: 'Use OpenHands in your existing tools or via custom SDK-powered workflows.',
    image: '/assets/product/delegate.png',
  },
  {
    title: 'Execute',
    description: 'Agents run autonomously in secure Docker sandboxes.',
    image: '/assets/product/execute.png',
  },
  {
    title: 'Review',
    description: 'OpenHands delivers clean, well-tested PRs ready for your review.',
    image: '/assets/product/review.png',
  },
];

const FEATURES = [
  {
    icon: '🔧',
    title: 'Model-agnostic flexibility',
    description: 'Choose your preferred LLM provider - Anthropic, OpenAI, Gemini, or bring your own.',
  },
  {
    icon: '🔒',
    title: 'Secure sandbox runtime',
    description: 'Deploy in isolated Docker or Kubernetes environments with RBAC and audit trails.',
  },
  {
    icon: '🛠️',
    title: 'Agent SDK',
    description: 'Build and orchestrate custom agents with our open SDKs and APIs.',
  },
  {
    icon: '💻',
    title: 'Multiple interfaces',
    description: 'Use via GUI, CLI, or headless API - whatever fits your workflow.',
  },
  {
    icon: '🌐',
    title: 'Open source',
    description: 'Fully transparent codebase that runs anywhere.',
  },
  {
    icon: '☁️',
    title: 'Flexible deployment',
    description: 'Choose fully managed SaaS or self-hosted in your infrastructure.',
  },
];

const INTERFACES = [
  {
    title: 'Terminal / CLI',
    description: 'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
    link: 'https://docs.openhands.dev/openhands/usage/cli/installation',
    linkText: 'Learn more',
    image: '/assets/webflow/misc/699490d1d9729682e0daf0a5_cli.png',
  },
  {
    title: 'Web GUI',
    description: 'Plan, run, and review agent work together in a collaborative UI.',
    link: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    linkText: 'Learn more',
    image: '/assets/webflow/misc/6994c3bfa634f5f3966d2150_4c76230966d0d54a446a009e4f4a19c2_gui.png',
  },
  {
    title: 'SDK',
    description: 'Create specialized agents, integrate internal tools, and orchestrate complex workflows programmatically.',
    link: 'https://docs.openhands.dev/sdk',
    linkText: 'Learn more',
    image: '/assets/webflow/misc/699f4b0b80190eeea4ba3eb9_sdk-1.png',
  },
];

const Product = () => {
  return (
    <main className='pt-[100px]'>
      {/* Hero Section */}
      <section className='px-10 py-20 lg:py-32 text-center max-w-4xl mx-auto'>
        <h1 className='text-4xl lg:text-6xl font-bold mb-6'>
          Build better software with autonomous cloud agent
        </h1>
        <p className='text-lg lg:text-xl text-brand-muted mb-8 max-w-2xl mx-auto'>
          Offload toil, ship faster. OpenHands automates real development tasks with transparency, governance, and choice.
        </p>
        <div className='flex gap-4 justify-center flex-wrap'>
          <Link to='https://app.all-hands.dev' className='btn btn-primary btn-lg'>
            Try it live
          </Link>
          <Link to='https://docs.openhands.dev/' className='btn btn-outline btn-lg'>
            See developer docs
          </Link>
        </div>
      </section>

      {/* Interfaces Section - Terminal/CLI, Web GUI, SDK */}
      <section className='px-10 py-20 max-w-6xl mx-auto'>
        <div className='grid md:grid-cols-3 gap-8'>
          {INTERFACES.map((item) => (
            <div key={item.title} className='text-center'>
              <h2 className='text-2xl font-bold mb-4'>{item.title}</h2>
              <p className='text-brand-muted mb-4'>{item.description}</p>
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className='w-full rounded-lg mb-4'
                />
              )}
              <Link to={item.link} className='text-brand-accent hover:underline'>
                {item.linkText} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className='px-10 py-20 max-w-6xl mx-auto'>
        <div className='section-title text-center mb-16'>How OpenHands works</div>
        <div className='grid md:grid-cols-3 gap-8'>
          {CAPABILITIES.map((cap, idx) => (
            <div key={cap.title} className='text-center'>
              <div className='text-5xl font-bold text-brand-accent mb-4'>{idx + 1}</div>
              <div className='text-xl font-semibold mb-2'>{cap.title}</div>
              <p className='text-brand-muted'>{cap.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Capabilities */}
      <section className='px-10 py-20 bg-[#efe6d1]'>
        <div className='max-w-6xl mx-auto'>
          <div className='section-title text-center mb-16'>Key capabilities</div>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {FEATURES.map((feature) => (
              <div key={feature.title} className='bg-brand-bg rounded-xl p-6'>
                <div className='text-3xl mb-4'>{feature.icon}</div>
                <div className='text-lg font-semibold mb-2'>{feature.title}</div>
                <p className='text-brand-muted text-sm'>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Works where you do */}
      <section className='px-10 py-20 max-w-6xl mx-auto'>
        <div className='section-title text-center mb-8'>Works where you do</div>
        <p className='text-center text-brand-muted mb-12 max-w-2xl mx-auto'>
          Use OpenHands in your browser, as a CLI, via API, or integrate with GitHub, GitLab, Slack, and more.
        </p>
        <div className='flex gap-4 justify-center flex-wrap'>
          <Link to='https://docs.openhands.dev/openhands/usage/getting-started' className='btn btn-outline'>
            Build your first agent
          </Link>
          <Link to='https://docs.openhands.dev/' className='btn btn-outline'>
            See developer docs
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className='px-10 py-20 text-center bg-brand-accent'>
        <div className='max-w-2xl mx-auto'>
          <p className='section-title mb-6'>Ready to automate your development workflow?</p>
          <p className='text-brand-muted mb-8'>
            Join thousands of developers using OpenHands to ship faster.
          </p>
          <div className='flex gap-4 justify-center flex-wrap'>
            <Link to='https://app.all-hands.dev' className='btn btn-primary btn-lg'>
              Try it live
            </Link>
            <Link to='/enterprise' className='btn btn-outline btn-lg'>
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Product;
