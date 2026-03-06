import { Link } from 'react-router';
import type { Route } from './+types/enterprise';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands for Enterprise | Secure, Scalable Agentic Software Development' },
    { name: 'description', content: 'Deploy OpenHands securely across your organization. Enterprise-grade governance, compliance, and custom deployment options for agentic software development.' },
    { property: 'og:title', content: 'OpenHands for Enterprise | Secure, Scalable Agentic Software Development' },
    { property: 'og:description', content: 'Deploy OpenHands securely across your organization. Enterprise-grade governance, compliance, and custom deployment options for agentic software development.' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const ENTERPRISE_FEATURES = [
  {
    title: 'Containerized sandbox runtime for safe autonomy',
    description: 'Agents run in isolated Docker containers with full security controls.',
  },
  {
    title: 'Secure enterprise platform with fine-grained access control',
    description: 'Enterprise-grade authentication with SAML/OIDC and RBAC.',
  },
  {
    title: 'Self-host or private-cloud deployment',
    description: 'Run OpenHands in your own VPC or private cloud with full data control.',
  },
  {
    title: 'Bring your own LLM via Anthropic, OpenAI, Bedrock, or any other model provider',
    description: 'Model-agnostic architecture supports any LLM provider.',
  },
  {
    title: 'Integrations with enterprise ecosystems',
    description: 'Connect to your existing tools - GitHub, GitLab, Jira, ServiceNow, and more.',
  },
  {
    title: 'Dedicated technical and account-level support',
    description: 'Priority support with shared Slack channel and SLA guarantees.',
  },
];

const ENTERPRISE_STATS = [
  { value: '30×', label: 'productivity gains' },
  { value: '1000s', label: 'vulnerabilities fixed' },
  { value: 'Weeks→Hours', label: 'of work done faster' },
];

const LOGOS = [
  { name: 'Amazon', url: '/assets/webflow/logos/69137f10c3975e28b3932320_Amazon_logo1.svg' },
  { name: 'Netflix', url: '/assets/webflow/logos/69137eac8f27ca27f5e48420_Netflix_2015_logo1.svg' },
  { name: 'Google', url: '/assets/webflow/logos/69137e199ce2cb594b0210ab_google-ar211.svg' },
  { name: 'AMD', url: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg' },
  { name: 'Nvidia', url: '/assets/webflow/logos/69137e34e3a5ab71e37082a7_NVIDIA_logo1.svg' },
];

const Enterprise = () => {
  return (
    <main className='pt-[100px]'>
      {/* Hero Section */}
      <section className='px-10 py-20 lg:py-32 text-center max-w-4xl mx-auto'>
        <h1 className='text-4xl lg:text-6xl font-bold mb-6'>
          Enterprise control meets open-source innovation
        </h1>
        <p className='text-lg lg:text-xl text-brand-muted mb-8 max-w-2xl mx-auto'>
          Scale OpenHands across your organization with advanced security, compliance, and dedicated support.
        </p>
        <div className='flex gap-4 justify-center flex-wrap'>
          <Link to='/contact' className='btn btn-primary btn-lg'>
            Book a demo
          </Link>
          <Link to='https://app.all-hands.dev' className='btn btn-outline btn-lg'>
            Try it live
          </Link>
        </div>
      </section>

      {/* Trust Logos */}
      <section className='px-10 py-12 border-y border-brand-border'>
        <p className='text-center text-sm text-brand-muted mb-8'>Trusted by engineers at leading companies</p>
        <div className='logo-grid max-w-4xl mx-auto'>
          {LOGOS.map((logo) => (
            <img key={logo.name} src={logo.url} alt={logo.name} className='h-8' />
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className='px-10 py-20 max-w-6xl mx-auto'>
        <h2 className='section-title text-center mb-4'>Why Enterprises Choose OpenHands</h2>
        <p className='text-center text-brand-muted mb-16 max-w-2xl mx-auto'>
          OpenHands Enterprise provides the security, control, and support your organization needs.
        </p>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {ENTERPRISE_FEATURES.map((feature) => (
            <div key={feature.title} className='border border-brand-border rounded-xl p-6'>
              <div className='text-lg font-semibold mb-2'>{feature.title}</div>
              <p className='text-brand-muted text-sm'>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial - H2 for SSR parity with Webflow */}
      <section className='px-10 py-20 bg-brand-accent'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='testimonial-quote mb-8'>
            "The integration of Lemonade Server with OpenHands reflects AMD's commitment to open-source innovation and developer choice. This collaboration enables local coding agents that prioritize privacy, cost efficiency, and flexible model selection – while taking advantage of acceleration on Ryzen AI PCs. Together, we're supporting a range of workflows and staying true to open-source values."
          </h2>
          <div className='flex items-center justify-center gap-4'>
            <div className='text-left'>
              <p className='font-semibold'>Adrian Macias</p>
              <p className='text-sm text-brand-muted'>Director, Developer Acceleration at AMD</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className='px-10 py-20 bg-brand-fg text-white'>
        <div className='max-w-4xl mx-auto text-center'>
          <h3 className='text-3xl font-bold mb-4'>Proven results across industries</h3>
          <p className='text-white/70 mb-12'>
            Enterprises use OpenHands to fix thousands of vulnerabilities, refactor codebases, and ship faster with less risk
          </p>
          <div className='grid md:grid-cols-3 gap-8'>
            {ENTERPRISE_STATS.map((stat) => (
              <div key={stat.label}>
                <div className='text-5xl font-bold text-brand-accent mb-2'>{stat.value}</div>
                <p className='text-white/70'>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='px-10 py-20 text-center'>
        <div className='max-w-2xl mx-auto'>
          <p className='section-title mb-6'>Bring agentic development to your organization.</p>
          <p className='text-brand-muted mb-8'>
            Let's discuss how OpenHands Enterprise can accelerate your team.
          </p>
          <div className='flex gap-4 justify-center flex-wrap'>
            <Link to='/contact' className='btn btn-primary btn-lg'>
              Contact us
            </Link>
            <Link to='https://docs.openhands.dev/sdk' className='btn btn-outline btn-lg'>
              Build with SDK
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Enterprise;
