import React from 'react';
import { SectionHeading } from '~/components/section-heading';
import { Button } from '~/components/button';
import { useGitHubModal } from '~/contexts/github-modal-context';
import GitHubLogo from '~/svgs/github-logo.svg?react';
import type { Route } from './+types/pricing';

const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className='border-b border-gray-200 py-4'>
      <button
        className='flex justify-between items-center w-full text-left font-medium text-lg'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <span className='ml-4'>
          {isOpen ? (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z'
                clipRule='evenodd'
              />
            </svg>
          ) : (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z'
                clipRule='evenodd'
              />
            </svg>
          )}
        </span>
      </button>
      {isOpen && (
        <div className='mt-2 text-gray-600 whitespace-pre-line'>{answer}</div>
      )}
    </div>
  );
};

const PricingCard = ({
  title,
  subtitle,
  description,
  features,
  buttonText,
  buttonLink,
}: {
  title: string;
  subtitle: string;
  description: React.ReactNode;
  features: string[];
  buttonText: string;
  buttonLink: string;
}) => {
  return (
    <div className='flex flex-col bg-white rounded-lg shadow-md p-6 w-full md:w-[400px] lg:w-[400px]'>
      <div className='text-2xl font-semibold mb-2'>{title}</div>
      <p className='mb-1 font-semibold text-3xl'>{subtitle}</p>
      <p className='text-gray-600 font-semibold mb-4 mt-4 italic'>{description}</p>
      <ul className='mb-6 flex-grow'>
        {features.map((feature, index) => (
          <li key={index} className='flex items-start mb-2'>
            <img 
              src='/assets/webflow/icons/690cb1513c759a7404df1ba1_check.svg' 
              alt='✓' 
              className='w-5 h-5 mr-2 flex-shrink-0'
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <a
        href={buttonLink}
        className='bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-6 rounded text-center transition-colors min-w-[200px] flex items-center justify-center'
      >
        {buttonText}
      </a>
    </div>
  );
};

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Pricing | Start Building for Free' },
    { name: 'description', content: 'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans.' },
    { property: 'og:title', content: 'OpenHands Pricing | Start Building for Free' },
    { property: 'og:description', content: 'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans.' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'OpenHands Pricing | Start Building for Free' },
    { name: 'twitter:description', content: 'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans.' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const Pricing = () => {
  const { openGitHubModal } = useGitHubModal();

  // Pay-as-you-go Plan
  const payAsYouGoFeatures = [
    '1 user',
    'Access from desktop or mobile',
    'Bring your own LLM, or use OpenHands LLMs at cost',
    'High token rate limits',
    'GitHub, GitLab, and Bitbucket',
    'API support'
  ];

  // Enterprise Plans
  const enterpriseCloudFeatures = [
    'Multiple users',
    'Centralized billing',
    'At-cost, no markup pricing on LLM usage',
    'Model choice (or bring your own LLM)',
    'Git, Slack, and ticketing system integrations',
    'API support',
    'Priority support',
  ];

  const enterpriseSelfHostedFeatures = [
    'Run OpenHands Cloud in your private VPC',
    'Bring your own LLM key',
    'Enterprise support and services',
    'Shared Slack channel',
  ];

  return (
    <main className='pt-[100px]'>
      <section className='flex flex-col items-center gap-4 text-center pt-12 pb-8 px-10'>
        <h1 className='text-4xl lg:text-6xl font-bold mb-4'>Pricing that fits your rollout</h1>
        <p className='text-lg text-brand-muted max-w-2xl'>
          Run locally, in our cloud, or self-host. Pay only for what you need
        </p>
        <div className='flex gap-4 justify-center flex-wrap mt-6'>
          <a href='https://app.all-hands.dev' className='btn btn-primary'>
            Try it live
          </a>
          <a href='https://docs.openhands.dev/sdk' className='btn btn-outline'>
            Build with SDK
          </a>
        </div>
      </section>

      <section className='flex flex-col items-center mb-16 px-10'>
        <h2 className='section-title text-center mb-12'>Compare plans</h2>

        <div className='flex flex-row justify-center items-stretch flex-wrap max-w-[1300px] gap-6'>
          <PricingCard
            title='Free'
            subtitle='$0'
            description='Free, local OpenHands for getting started'
            features={['Best-in-class OpenHands Agent', 'Web-based GUI, Terminal UI, and CLI', 'Bring your own key or use our providers at-cost']}
            buttonText='Download'
            buttonLink='https://pypi.org/project/openhands-ai/'
          />
          <PricingCard
            title='Cloud'
            subtitle='Pay-as-you-go'
            description='Everything in Free, plus:'
            features={['Hosted cloud access from desktop and mobile', 'API support for automation and scripting', 'Jira and Slack integrations', 'BYOK or use OpenHands models at-cost']}
            buttonText='Try it live'
            buttonLink='https://app.all-hands.dev/'
          />
          <PricingCard
            title='Enterprise'
            subtitle='$40 / user / month'
            description='Everything in Cloud, plus:'
            features={['Multiple users with centralized billing', 'At-cost, no markup pricing on LLM usage', 'Git, Slack, and ticketing system integrations', 'Priority support']}
            buttonText='Contact sales'
            buttonLink='/contact'
          />
          <PricingCard
            title='Self-hosted'
            subtitle='Contact us'
            description='Everything in Enterprise, plus:'
            features={['Run OpenHands in your private VPC', 'Bring your own LLM key', 'Enterprise support and services', 'Shared Slack channel']}
            buttonText='Contact sales'
            buttonLink='/contact'
          />
        </div>
      </section>

      <section className='flex flex-col items-center mb-16 px-10'>
        <div className='max-w-[800px] w-full'>
          <h2 className='section-title text-center mb-8'>
            FAQ's
          </h2>
          <div className='bg-white rounded-lg shadow-md p-6'>
            <FAQItem
              question='What are the main differences between OpenHands open source, and OpenHands Cloud?'
              answer='OpenHands Cloud is a hosted SaaS version of OpenHands that provides out-of-the-box runtime support and a high token rate LLM access. There are a few options with OpenHands Cloud:

              - Individual plan: Support for 1 user. Great for individuals who want a pay-as-you-go option for AI coding.
              - Enterprise plan: Support for multiple users. Great for organizations who want to deploy OpenHands across many teams and centrally manage access.

              The Enterprise Plan is available in two deployment options: SaaS (hosted by All Hands), or self-hosted (hosted by you in your private VPC). With self-hosted, you get the added option of customizing the LLM you use.'
            />
            <FAQItem
              question='What is the token pricing for the Individual (pay-as-you-go) plan?'
              answer='With the Individual (pay-as-you-go) plan, customers start with $10 in free token credits. Tokens can be refilled for as low as $10. Token pricing is billed at cost (zero markup) based on API prices.'
            />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Pricing;
