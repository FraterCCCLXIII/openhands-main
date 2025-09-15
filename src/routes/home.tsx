import statistics from '~/data/statistics.json';
import contributors from '~/data/contributors.json';
import TripleWow from '~/svgs/triple-wow.svg?react';
import Star from '~/svgs/star.svg?react';
import Users from '~/svgs/users.svg?react';
import Hierarchy from '~/svgs/hierarchy.svg?react';
import { ContributorGrid } from '~/components/contributor-grid';
import { YellowWaveSection } from '~/components/yellow-wave-section';
import { Button } from '~/components/button';
import { formatLastCommit } from '~/utils/format-last-commit';
import { formatThousands } from '~/utils/format-thousands';
import { ImageCarousel } from '~/components/image-carousel';
import { formatContributorCount } from '~/utils/format-contributor-count';
import { useGitHubModal } from '~/contexts/github-modal-context';
import React from 'react';
import clsx from 'clsx';
import GitHubLogo from '~/svgs/github-logo.svg?react';
import GitHubLogoBlack from '~/svgs/github-logo-black.svg?react';
import { Link } from 'react-router';
import type { Route } from './+types/home';

interface HeroButtonProps {
  onClick?: () => void;
  children: string;
  logo?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

function HeroButton({
  onClick,
  children,
  logo,
  variant = 'primary',
}: HeroButtonProps) {
  const className = clsx(
    'font-[700] text-[19px] leading-[27px] rounded-lg py-4 w-[275px] flex items-center justify-center gap-4',
    variant === 'primary' &&
      'hover:bg-[#4B5563] hover:text-white transition-colors duration-50',
    variant === 'primary' && 'bg-black text-white border-none',
    variant === 'secondary' && 'bg-transparent border border-black text-black'
  );

  return (
    <button className={className} onClick={onClick}>
      {logo}
      {children}
    </button>
  );
}

function BenchmarkDisplay() {
  return (
    <>
      <div className='relative w-[90vw] max-w-[500px] lg:w-[412px] h-[300px] flex items-center justify-center'>
        <div className='absolute w-full lg:w-[412px] transform rotate-[-2deg] translate-y-[15px] translate-x-[0px] shadow-lg border-2 border-gray-200 bg-white'>
          <img
            src='/assets/agent_performance/live-swebench.png'
            className='w-full'
            alt='LiveSWEBench performance'
          />
        </div>
        <div className='absolute w-full lg:w-[412px] transform rotate-[-3deg] translate-y-[-20px] translate-x-[-15px] shadow-lg border-2 border-gray-200 bg-white'>
          <img
            src='/assets/agent_performance/swebench-full.png'
            className='w-full'
            alt='SWE-bench performance'
          />
        </div>
        <div className='absolute w-full lg:w-[412px] transform rotate-[1deg] translate-y-[70px] translate-x-[10px] shadow-lg border-2 border-gray-200 bg-white'>
          <img
            src='/assets/agent_performance/multi-swebench.png'
            className='w-full'
            alt='Multi-SWE-bench performance'
          />
        </div>
      </div>
    </>
  );
}

export const links: Route.LinksFunction = () => [
  {
    rel: 'prefetch',
    href: '/assets/product/product-slide-1.webp',
    as: 'image',
  },
  {
    rel: 'prefetch',
    href: '/assets/product/product-slide-2.webp',
    as: 'image',
  },
  {
    rel: 'prefetch',
    href: '/assets/product/product-slide-3.webp',
    as: 'image',
  },
];

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'All Hands AI' },
    { name: 'description', content: 'Code Less, Make More. Hand off your next task to OpenHands — the leading open source AI coding agent.' },
    { property: 'og:title', content: 'All Hands AI' },
    { property: 'og:description', content: 'Code Less, Make More. Hand off your next task to OpenHands — the leading open source AI coding agent.' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'All Hands AI' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'All Hands AI' },
    { name: 'twitter:description', content: 'Code Less, Make More. Hand off your next task to OpenHands — the leading open source AI coding agent.' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' },
  ];
};

const Home = () => {
  const { openGitHubModal } = useGitHubModal();

  return (
    <main data-testid='home-content'>
      <section className='flex flex-col items-center gap-4 pb-[45px] lg:h-auto pt-[50px] lg:py-[86px] px-[42px]'>
        <h1 className='font-quincy heading-large lg:leading-[52px] text-center lg:h-auto lg:w-[764px]'>
          Code Less, Make More
        </h1>
        <p className='paragraph text-description lg:w-[764px] text-center'>
          Hand off your next task to OpenHands &mdash; the leading open source
          AI coding agent
        </p>
        <p>&nbsp;</p>
        <Link
          to='https://app.all-hands.dev'
          target='_blank'
          rel='noopener noreferrer'
        >
          <HeroButton>Try it live</HeroButton>
        </Link>
        <div className='flex flex-col sm:flex-row gap-4'>
          <HeroButton
            logo={<GitHubLogoBlack width={23} height={23} />}
            variant='secondary'
            onClick={openGitHubModal}
          >
            Start with OSS
          </HeroButton>
        </div>
      </section>

      <section className='flex flex-col items-center gap-8 pt-[25px] pb-[60px] lg:pt-0 overflow-hidden'>
        <TripleWow width={36} height={22} />
        <ImageCarousel
          images={Array.from({ length: 3 }).map(
            (_, index) => `/assets/product/product-slide-${index + 1}.webp`
          )}
        />
      </section>

      {/* Use Case Section */}
      <section className='px-[42px] lg:px-[184px] py-16 lg:py-24 flex justify-center'>
        <div className='w-full max-w-[1440px]'>
          <div className='flex flex-col gap-8 items-center text-center mb-12'>
            <span className='heading'>Use Cases</span>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <div className='flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm'>
              <h3 className='text-xl font-bold'>Speed up code reviews</h3>
              <p className='text-description'>
                Summarize pull requests, incorporate feedback, and push fixes so
                code reviews are quick and painless.
              </p>
            </div>
            <div className='flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm'>
              <h3 className='text-xl font-bold'>Refactor old code</h3>
              <p className='text-description'>
                Decompose monolithic code, refactor tech debt, and automate
                version bumps without breaking the build.
              </p>
            </div>
            <div className='flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm'>
              <h3 className='text-xl font-bold'>Expand test coverage</h3>
              <p className='text-description'>
                Generate tests for new features to elevate code quality and
                squash hidden bugs.
              </p>
            </div>
            <div className='flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm'>
              <h3 className='text-xl font-bold'>Fix failing pipelines</h3>
              <p className='text-description'>
                Fix broken tests without debugging or interrupting others for
                help.
              </p>
            </div>
            <div className='flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm'>
              <h3 className='text-xl font-bold'>Create prototypes</h3>
              <p className='text-description'>
                Turn ideas and concepts into working code you can test with
                customers.
              </p>
            </div>
            <div className='flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm'>
              <h3 className='text-xl font-bold'>Get to "done" faster</h3>
              <p className='text-description'>
                Offload all the engineering toil you don't want to do to
                OpenHands!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why OpenHands Section */}
      <section className='px-[42px] lg:px-[184px] py-16 lg:py-24 flex justify-center'>
        <div className='w-full max-w-[1440px]'>
          <div className='flex flex-col gap-8 items-center text-center mb-12'>
            <span className='heading'>Why OpenHands</span>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='flex flex-col gap-4 p-6 border-white rounded-lg border-2'>
              <h3 className='text-xl font-bold'>Deeply customizable</h3>
              <p className='text-description'>
                OpenHands is an open-source core, unlocking customization for a
                variety of enterprise use cases.
              </p>
            </div>
            <div className='flex flex-col gap-4 p-6 border-white rounded-lg border-2'>
              <h3 className='text-xl font-bold'>
                Deploy as SaaS or self-hosted
              </h3>
              <p className='text-description'>
                Flexible SaaS or self-hosted options for deploying AI coding
                agents across your organization.
              </p>
            </div>
            <div className='flex flex-col gap-4 p-6 border-white rounded-lg border-2'>
              <h3 className='text-xl font-bold'>
                Best in class coding accuracy
              </h3>
              <p className='text-description'>
                OpenHands is a top performer across a variety of software
                development benchmarks for agents, like SWE-bench.
              </p>
            </div>
            <div className='flex flex-col gap-4 p-6 border-white rounded-lg border-2'>
              <h3 className='text-xl font-bold'>Works where you do</h3>
              <p className='text-description'>
                Use OpenHands in your browser, as a CLI, via API, or in tools
                like GitHub, GitLab, Slack, Jira, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className='px-[42px] flex flex-col gap-8 lg:gap-16 lg:py-24 py-16 lg:items-center'>
        <div className='flex flex-col gap-4 text-center h-[100px] lg:h-[50px]'>
          <span className='heading'>OpenHands in Action</span>
        </div>
        <div className='flex flex-col items-center gap-4 w-full'>
          <div className='flex justify-center w-full'>
            <div className='w-full max-w-[1000px] mx-auto'>
              <video
                className='w-full rounded-lg shadow-lg'
                controls
                autoPlay
                muted
              >
                <source
                  src='/assets/videos/openhands_demo.mp4'
                  type='video/mp4'
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      <section className='flex flex-col lg:flex-row items-center lg:justify-center px-[42px] gap-16 lg:gap-[100px] lg:py-24 py-16 mb-16'>
        <div className='h-[calc(58px*3+40px)] lg:h-auto overflow-hidden relative'>
          <ContributorGrid variant='small' contributors={contributors} />
          <div className='lg:hidden absolute bottom-0 bg-gradient-to-t from-[#F1EAE0] to-transparent h-[40px] w-full' />
        </div>

        <div className='flex flex-col gap-4 lg:w-[500px]'>
          <span className='heading'>Join the Community</span>
          <p className='paragraph text-description lg:w-[466px]'>
            Thousands of developers are working together to build the AI-powered
            future they want to see. You can connect with us on GitHub, Slack,
            Twitter, or our blog.
          </p>
          <div
            data-testid='repo-statistics'
            className='flex flex-col gap-4 paragraph font-bold mb-4'
          >
            <div className='flex gap-[6px]'>
              <Star width={24} height={24} />
              <span>{formatThousands(statistics.stargazers)} Stars</span>
            </div>
            <div className='flex gap-[6px]'>
              <Users width={24} height={24} />
              <span>
                {formatContributorCount(statistics.contributors_count)}{' '}
                Contributors
              </span>
            </div>
            <div className='flex gap-[6px]'>
              <Hierarchy width={24} height={24} />
              <span>
                Last commit made {formatLastCommit(statistics.latest_commit)}
              </span>
            </div>
          </div>
          <Button
            variant='medium'
            icon={<GitHubLogo width={23} height={23} />}
            text='Join us on GitHub'
            className='self-start'
            onClick={openGitHubModal}
          />
        </div>
      </section>

      <section className='mb-[104px]'>
        <YellowWaveSection
          heading='Ready to roll?'
          text={`Software development is changing. Let's work together to make sure it's better for everyone. \u2764`}
          cta={{
            text: 'Try it live',
            to: 'https://app.all-hands.dev',
            style: 'primary',
          }}
          secondaryCta={{
            icon: <GitHubLogo width={23} height={23} />,
            text: 'Start with OSS',
            onClick: openGitHubModal,
            style: 'primary',
          }}
        />
      </section>
    </main>
  );
};

export default Home;
