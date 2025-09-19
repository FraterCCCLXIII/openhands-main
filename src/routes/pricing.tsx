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
      <h3 className='text-2xl font-semibold mb-2'>{title}</h3>
      <p className='mb-1 font-semibold text-3xl'>{subtitle}</p>
      <p className='text-gray-600 font-semibold mb-4 mt-4 italic'>{description}</p>
      <ul className='mb-6 flex-grow'>
        {features.map((feature, index) => (
          <li key={index} className='flex items-start mb-2'>
            <span className='mr-2 text-yellow-500'>•</span>
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

const PlanToggle = ({
  showIndividual,
  onToggle,
}: {
  showIndividual: boolean;
  onToggle: (showIndividual: boolean) => void;
}) => {
  return (
    <div className='flex justify-center mb-8'>
      <div className='bg-gray-100 rounded-lg p-1 flex'>
        <button
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            showIndividual
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-600 hover:text-black'
          }`}
          onClick={() => onToggle(true)}
        >
          Individual Plans
        </button>
        <button
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            !showIndividual
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-600 hover:text-black'
          }`}
          onClick={() => onToggle(false)}
        >
          Enterprise Plans
        </button>
      </div>
    </div>
  );
};

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'All Hands AI - Pricing' },
    { name: 'description', content: 'Flexible pricing options - from open source to enterprise solutions.' },
    { property: 'og:title', content: 'All Hands AI - Pricing' },
    { property: 'og:description', content: 'Flexible pricing options - from open source to enterprise solutions.' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'All Hands AI' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'All Hands AI - Pricing' },
    { name: 'twitter:description', content: 'Flexible pricing options - from open source to enterprise solutions.' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const Pricing = () => {
  const [showIndividual, setShowIndividual] = React.useState(true);
  const { openGitHubModal } = useGitHubModal();

  // Individual Plans
  const payAsYouGoFeatures = [
    '1 user',
    'Access from desktop or mobile',
    'Access to highest-performing LLMs',
    'High token rate limits',
    'GitHub, GitLab, and Bitbucket',
    'API support',
    'Marked up pricing on LLM usage',
  ];

  const proFeatures = [
    'At-cost, no markup pricing on LLM usage',
    'Model choice (or bring your own LLM)',
    'Access to OpenHands runtime compute',
    'LLM risk analyzer'
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
    <main>
      <section className='flex flex-col items-center gap-4 text-center pt-[86px] px-[53px]'>
        <h1 className='heading-large'>OpenHands Cloud Pricing</h1>
      </section>

      <section className='flex flex-col items-center mb-[104px]'>
        <SectionHeading />
        
        <PlanToggle showIndividual={showIndividual} onToggle={setShowIndividual} />

        <div className='flex flex-col md:flex-row justify-center flex-wrap max-w-[1228px] gap-6'>
          {showIndividual ? (
            // Individual Plans
            <>
              <PricingCard
                title='Pay-as-you-go'
                subtitle='$20 in free credits'
                description='Great for getting started'
                features={payAsYouGoFeatures}
                buttonText='Sign Up'
                buttonLink='https://app.all-hands.dev/'
              />
              <PricingCard
                title='Pro'
                subtitle='$20 / month'
                description='Everything in Pay-as-you-go, plus:'
                features={proFeatures}
                buttonText='Sign Up'
                buttonLink='https://app.all-hands.dev/'
              />
            </>
          ) : (
            // Enterprise Plans
            <>
              <PricingCard
                title='Enterprise Cloud'
                subtitle='$40 / user / month'
                description='For teams and organizations'
                features={enterpriseCloudFeatures}
                buttonText='Join Early Access'
                buttonLink='https://forms.gle/pdYjBk59Fwy6rshF8'
              />
              <PricingCard
                title='Enterprise Self-hosted'
                subtitle='Contact Us'
                description='Everything in Enterprise Cloud, plus:'
                features={enterpriseSelfHostedFeatures}
                buttonText='Contact Us'
                buttonLink='https://forms.gle/pdYjBk59Fwy6rshF8'
              />
            </>
          )}
        </div>
      </section>

      <section className='flex flex-col items-center mb-[104px]'>
        <div className='text-center'>
          <p className='text-2xl font-bold mb-4'>Want to try OpenHands locally?</p>
          <div className='flex justify-center'>
            <Button
              variant="medium"
              style="primary"
              icon={<GitHubLogo width={23} height={23} />}
              text="Start with OSS"
              onClick={openGitHubModal}
            />
          </div>
        </div>
      </section>

      <section className='flex flex-col items-center mb-[104px]'>
        <div className='max-w-[800px] w-full px-6'>
          <h2 className='text-2xl font-bold mb-6 text-center'>
            Frequently Asked Questions
          </h2>
          <div className='bg-white rounded-lg shadow-md p-6'>
            <FAQItem
              question='What are the main differences between OpenHands open source, and OpenHands Cloud?'
              answer='OpenHands Cloud is a hosted SaaS version of OpenHands that provides out-of-the-box runtime support and a high token rate LLM access. There are a few options with OpenHands Cloud:

              - Individual plan: Support for 1 user. Great for individuals who want a pay-as-you-go option for AI coding.
              - Business plan: Support for multiple users. Great for organizations who want to deploy OpenHands across many teams and centrally manage access.

              The Business Plan is available in two deployment options: SaaS (hosted by All Hands), or self-hosted (hosted by you in your private VPC). With self-hosted, you get the added option of customizing the LLM you use.'
            />
            <FAQItem
              question='What is the token pricing for the Individual (pay-as-you-go) plan?'
              answer='With the Individual (pay-as-you-go) plan, customers start with $20 in free token credits. Tokens can be refilled for as low as $10. 

              Additional tokens are billed at the following rates:

              Input: $6 per million tokens
              Cache write: $7.50 per million tokens
              Cache read: $0.60 per million tokens
              Output: $30 per million tokens'
            />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Pricing;
