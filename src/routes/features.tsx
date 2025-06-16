import React from 'react';
import clsx from 'clsx';
import { TryItLiveButton } from '~/components/buttons/try-it-live-button';
import { ViewPricingButton } from '~/components/buttons/view-pricing-button';
import type { Route } from './+types/features';

interface FeatureProps {
  title: string;
  description: React.ReactNode;
  imagePosition: 'left' | 'right';
  imageUrl: string;
  index: number;
}

const Feature: React.FC<FeatureProps> = ({
  title,
  description,
  imagePosition,
  imageUrl,
  index,
}) => {
  // Image component to avoid duplication
  const ImageComponent = ({ isMobile = false }) => (
    <div
      className={`w-full md:w-1/2 flex justify-center ${
        isMobile ? 'items-center' : ''
      }`}
    >
      <img
        src={imageUrl}
        alt={title}
        className={`h-auto rounded-lg ${
          isMobile ? 'w-1/2 mx-auto' : 'max-w-full'
        }`}
      />
    </div>
  );

  // Text component to avoid duplication
  const TextComponent = () => (
    <div className='w-full md:w-1/2 flex flex-col justify-center'>
      <h2 className='text-2xl md:text-3xl font-bold mb-4'>{title}</h2>
      <div className='text-gray-700'>{description}</div>
    </div>
  );

  return (
    <div
      className={clsx(
        'flex flex-col md:flex-row items-center gap-8 py-12 border-b border-gray-200',
        index === 0 && 'pt-0',
        index === 5 && 'border-b-0'
      )}
    >
      {/* Mobile view - Image always on top with 50% width */}
      <div className='flex flex-col w-full md:hidden'>
        <ImageComponent isMobile={true} />
        <TextComponent />
      </div>

      {/* Desktop view - Image position based on imagePosition prop */}
      <div className='hidden md:flex md:flex-row w-full'>
        {imagePosition === 'left' && <ImageComponent isMobile={false} />}
        <TextComponent />
        {imagePosition === 'right' && <ImageComponent isMobile={false} />}
      </div>
    </div>
  );
};

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'All Hands AI - OpenHands Cloud' },
    { name: 'description', content: 'Explore the powerful features of OpenHands AI agents that supercharge your engineering team.' },
    { property: 'og:title', content: 'All Hands AI - OpenHands Cloud' },
    { property: 'og:description', content: 'Explore the powerful features of OpenHands AI agents that supercharge your engineering team.' },
    { property: 'og:image', content: '/assets/all-hands-text-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'All Hands AI' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'All Hands AI - OpenHands Cloud' },
    { name: 'twitter:description', content: 'Explore the powerful features of OpenHands AI agents that supercharge your engineering team.' },
    { name: 'twitter:image', content: '/assets/all-hands-text-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
    {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'OpenHands',
        applicationCategory: 'DeveloperApplication',
      }),
    },
  ];
};

const Features = () => {
  const features = [
    {
      title: 'Supercharge your engineering team',
      description: (
        <ul className='list-disc pl-4 space-y-2'>
          <li>
            Free up engineers so they can focus on interesting problems that
            delight customers
          </li>
          <li>
            Automate repetitive engineering tasks with AI – without full-time
            supervision
          </li>
          <li>
            Accelerate velocity and close the gap between feedback and feature
            release
          </li>
        </ul>
      ),
      imagePosition: 'right' as const,
      imageUrl: '/assets/feature_page/supercharge-team.png',
    },
    {
      title: 'Best-in-class coding accuracy',
      description: (
        <ul className='list-disc pl-4 space-y-2'>
          <li>
            OpenHands is consistently a top-ranked coding agent in SWE-bench and
            multiple benchmarks
          </li>
          <li>
            OpenHands Context Condenser technology drives accurate, efficient
            token use
          </li>
          <li>
            Produce consistent, high-quality, and easily understandable code
          </li>
        </ul>
      ),
      imagePosition: 'left' as const,
      imageUrl: '/assets/feature_page/leaderboard-16-may.png',
      //imageUrl: "/assets/agent_performance/swe-bench.png",
    },
    {
      title: 'Secure, sandboxed AI agents',
      description: (
        <ul className='list-disc pl-4 space-y-2'>
          <li>
            Safely run agent commands from within a secure, containerized
            sandbox
          </li>
          <li>
            Bring your own containerized development environment (coming soon!)
          </li>
        </ul>
      ),
      imagePosition: 'right' as const,
      imageUrl: '/assets/feature_page/secure-sandbox.png',
    },
    {
      title: 'SaaS and self-hosted options',
      description: (
        <ul className='list-disc pl-4 space-y-2'>
          <li>
            Use OpenHands Cloud to parallelize AI agents without managing
            infrastructure
          </li>
          <li>
            Or, run OpenHands Self-hosted in your own private cloud, with your
            own LLMs and keys
          </li>
          <li>
            Automate your processes with a fully-featured and documented API
          </li>
        </ul>
      ),
      imagePosition: 'left' as const,
      imageUrl: '/assets/feature_page/saas-selfhosted.png',
    },
    {
      title: 'Deep integrations with the tools you use',
      description: (
        <ul className='list-disc pl-4 space-y-2'>
          <li>
            Trigger OpenHands to fix issues and implement features directly from
            GitHub and GitLab
          </li>
          <li>Customize your AI use cases with custom agents</li>
        </ul>
      ),
      imagePosition: 'right' as const,
      imageUrl: '/assets/feature_page/integrations.png',
    },
    {
      title: 'Dedicated support',
      description: (
        <ul className='list-disc pl-4 space-y-2'>
          <li>Priority support from OpenHands engineers</li>
          <li>Recurring roadmap and product collaboration opportunities</li>
        </ul>
      ),
      imagePosition: 'left' as const,
      imageUrl: '/assets/feature_page/support.png',
    },
  ];

  return (
    <div className='bg-[#F1EAE0] min-h-screen'>
      <div className='container mx-auto px-4 py-16'>
        <h1 className='heading-large text-center'>OpenHands Cloud</h1>
        <div className='flex justify-center gap-4 mb-8 pt-10'>
          <TryItLiveButton />
          <ViewPricingButton />
        </div>

        <div className='max-w-4xl mx-auto'>
          {features.map((feature, index) => (
            <Feature
              key={index}
              title={feature.title}
              description={feature.description}
              imagePosition={feature.imagePosition}
              imageUrl={feature.imageUrl}
              index={index}
            />
          ))}

          <h2 className='text-2xl font-bold text-center mb-6'>
            Get started today
          </h2>
          <div className='flex justify-center gap-4 mt-12'>
            <TryItLiveButton />
            <ViewPricingButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
