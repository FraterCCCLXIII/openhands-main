import React from 'react';
import { SectionHeading } from '~/components/section-heading';
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
    <div className='flex flex-col bg-white rounded-lg shadow-md p-6 w-full md:w-[320px] lg:w-[320px]'>
      <h3 className='text-xl font-bold mb-2'>{title}</h3>
      <p className='mb-1 font-semibold'>{subtitle}</p>
      <p className='text-gray-600 italic mb-4'>{description}</p>
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
  const openSourceFeatures = [
    'Run OpenHands locally',
    'Bring your own LLM or API key',
    'Active open source community',
  ];

  const payAsYouGoFeatures = [
    '1 user',
    'Pay-as-you-go ($10 min refill)',
    'Access from desktop or mobile',
    'Access to the highest-performing LLMs',
    'High token rate limits',
    'Use with GitHub or GitLab',
    'API support',
  ];

  const businessFeatures = [
    'Multiple users',
    'Additional integrations',
    'Higher token rate limits',
    'More concurrent conversations',
    'Bring your own LLM (self-hosted only)',
    'Support and enablement package',
    'API support',
  ];

  return (
    <main>
      <section className='flex flex-col items-center gap-4 text-center py-[86px] px-[53px]'>
        <h1 className='heading-large max-w-[763px]'>Flexible Pricing</h1>
      </section>

      <section className='flex flex-col items-center mb-[104px]'>
        <SectionHeading />

        <div className='flex flex-col md:flex-row justify-center flex-wrap max-w-[1228px] gap-6'>
          <PricingCard
            title='Open Source'
            subtitle=''
            description={
              <em>The world's leading open source AI coding agent</em>
            }
            features={openSourceFeatures}
            buttonText='Start with OSS'
            buttonLink='https://github.com/All-Hands-AI/OpenHands'
          />

          <div className='flex flex-col md:w-[660px] lg:w-[660px]'>
            {/* Yellow box hidden on mobile (screen width < 768px) */}
            <div className='w-full text-center mb-4 hidden md:block'>
              <div className='w-full bg-yellow-400 px-6 py-3 rounded-lg font-semibold text-lg'>
                OpenHands Cloud
              </div>
            </div>

            <div className='flex flex-col md:flex-row justify-center gap-4 md:gap-6'>
              <PricingCard
                title='Individual'
                subtitle='Start with $20 in free credits'
                description='Great for individuals'
                features={payAsYouGoFeatures}
                buttonText='Sign Up'
                buttonLink='https://app.all-hands.dev'
              />

              <PricingCard
                title='Business'
                subtitle='SaaS or Self-hosted options'
                description='Great for teams'
                features={businessFeatures}
                buttonText='Contact Us'
                buttonLink='https://forms.gle/pdYjBk59Fwy6rshF8'
              />
            </div>
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
