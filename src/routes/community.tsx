import { Link } from 'react-router';
import { ContributorGrid } from '~/components/contributor-grid';
import contributors from '~/data/contributors.json';
import statistics from '~/data/statistics.json';
import { formatThousands } from '~/utils/format-thousands';
import { formatContributorCount } from '~/utils/format-contributor-count';
import type { Route } from './+types/community';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Community' },
    { name: 'description', content: 'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Join our community of developers.' },
    { property: 'og:title', content: 'OpenHands Community' },
    { property: 'og:description', content: 'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Join our community of developers.' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const CONTRIBUTE_LINKS = [
  {
    title: 'Read the docs',
    description: 'Get familiar with our architecture and contribution guidelines.',
    url: 'https://docs.openhands.dev/',
    icon: '📚',
  },
  {
    title: 'Issues to fix',
    description: 'Find beginner-friendly issues in our CLI repository.',
    url: 'https://github.com/OpenHands/OpenHands/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22',
    icon: '🔧',
  },
  {
    title: 'Start Contributing',
    description: 'Learn how to contribute to OpenHands.',
    url: 'https://docs.openhands.dev/contributors/getting-started',
    icon: '🚀',
  },
];

const COMMUNITY_LINKS = [
  {
    title: 'GitHub',
    description: 'Star the repo, report issues, and contribute code.',
    url: 'https://github.com/OpenHands/OpenHands',
    icon: '🐙',
  },
  {
    title: 'Slack',
    description: 'Chat with the community and get help.',
    url: 'https://join.slack.com/t/openhands-community/shared_invite/zt-2t4m9lwnr-pZPQqJlB~vAMJ1BYY2c31w',
    icon: '💬',
  },
  {
    title: 'Discord',
    description: 'Join discussions and community events.',
    url: 'https://discord.gg/ESHStjSjD4',
    icon: '🎮',
  },
  {
    title: 'Twitter/X',
    description: 'Follow for updates and announcements.',
    url: 'https://x.com/OpenHandsDev',
    icon: '🐦',
  },
];

const Community = () => {
  return (
    <main className='pt-[100px]'>
      {/* Hero Section */}
      <section className='px-10 py-20 lg:py-32 text-center max-w-4xl mx-auto'>
        <h1 className='text-4xl lg:text-6xl font-bold mb-6'>
          Join the OpenHands Community
        </h1>
        <p className='text-lg lg:text-xl text-brand-muted mb-8 max-w-2xl mx-auto'>
          Connect with {formatContributorCount(statistics.contributors_count)} developers building the future of AI-powered software development.
        </p>
        <div className='flex gap-4 justify-center flex-wrap'>
          <Link to='https://app.all-hands.dev' className='btn btn-primary'>
            Try it live
          </Link>
          <Link to='https://docs.openhands.dev/sdk' className='btn btn-outline'>
            Build with SDK
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className='px-10 py-12 border-y border-brand-border'>
        <div className='max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center'>
          <div>
            <p className='text-4xl font-bold'>{formatThousands(statistics.stargazers)}</p>
            <p className='text-sm text-brand-muted'>GitHub Stars</p>
          </div>
          <div>
            <p className='text-4xl font-bold'>{formatContributorCount(statistics.contributors_count)}</p>
            <p className='text-sm text-brand-muted'>Contributors</p>
          </div>
          <div>
            <p className='text-4xl font-bold'>{formatThousands(statistics.forks)}</p>
            <p className='text-sm text-brand-muted'>Forks</p>
          </div>
        </div>
      </section>

      {/* Latest Community Call */}
      <section className='px-10 py-20 max-w-4xl mx-auto'>
        <h2 className='section-title text-center mb-8'>Latest Community Call</h2>
        <div className='bg-brand-fg/5 rounded-xl p-8 text-center'>
          <p className='text-brand-muted mb-6'>
            Join our weekly community calls to hear about the latest updates, ask questions, and connect with other developers.
          </p>
          <Link to='https://www.youtube.com/@OpenHandsDev' className='btn btn-outline'>
            Watch on YouTube
          </Link>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className='px-10 py-20 bg-[#efe6d1]'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='section-title text-center mb-8'>Upcoming Events</h2>
          {/* Webflow CMS event placeholder - matches live site structure */}
          <h2 className='sr-only'>Heading</h2>
          <div className='bg-brand-bg rounded-xl p-8 text-center'>
            <p className='text-brand-muted mb-6'>
              Check out our upcoming community events, workshops, and meetups.
            </p>
            <Link to='https://lu.ma/openhands' className='btn btn-outline'>
              View Events
            </Link>
          </div>
        </div>
      </section>

      {/* Start Contributing - with H3 headings to match live site */}
      <section className='px-10 py-20 max-w-4xl mx-auto'>
        <h2 className='section-title text-center mb-12'>Start contributing</h2>
        <div className='grid md:grid-cols-3 gap-6 mb-8'>
          {CONTRIBUTE_LINKS.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target='_blank'
              rel='noopener noreferrer'
              className='border border-brand-border rounded-xl p-6 hover:bg-brand-fg/5 transition-colors group'
            >
              <div className='text-3xl mb-3'>{link.icon}</div>
              <h3 className='text-lg font-semibold mb-1 group-hover:underline'>{link.title}</h3>
              <p className='text-brand-muted text-sm'>{link.description}</p>
            </a>
          ))}
        </div>
        {/* Community links - no H3 headings, just styled divs */}
        <div className='grid md:grid-cols-2 gap-6'>
          {COMMUNITY_LINKS.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target='_blank'
              rel='noopener noreferrer'
              className='border border-brand-border rounded-xl p-6 hover:bg-brand-fg/5 transition-colors group'
            >
              <div className='text-3xl mb-3'>{link.icon}</div>
              <div className='text-lg font-semibold mb-1 group-hover:underline'>{link.title}</div>
              <p className='text-brand-muted text-sm'>{link.description}</p>
            </a>
          ))}
        </div>
        <div className='flex gap-4 justify-center flex-wrap mt-8'>
          <Link to='https://docs.openhands.dev/' className='btn btn-outline'>
            View Docs
          </Link>
          <Link to='https://pypi.org/project/openhands-ai/' className='btn btn-outline'>
            Download CLI
          </Link>
          <Link to='https://github.com/OpenHands/OpenHands/releases' className='btn btn-outline'>
            Download Web UI
          </Link>
          <Link to='https://docs.openhands.dev/openhands/usage/getting-started' className='btn btn-outline'>
            Get Started
          </Link>
        </div>
      </section>

      {/* First-time Contributors */}
      <section className='px-10 py-20 bg-[#efe6d1]'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='section-title mb-4'>Recognizing first-time contributors</h2>
          <p className='text-brand-muted mb-8 max-w-2xl mx-auto'>
            We celebrate every new contributor who makes their first PR to OpenHands. 
            Your contribution, no matter how small, helps move the project forward.
          </p>
        </div>
      </section>

      {/* Community Contributor Spotlight */}
      <section className='px-10 py-20'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='section-title text-center mb-4'>Community contributor spotlight</h2>
          <p className='text-center text-brand-muted mb-12'>
            Thank you to everyone who has contributed to OpenHands!
          </p>
          {/* Featured contributor - matches live site H3 */}
          <div className='bg-brand-fg/5 rounded-xl p-8 mb-12 text-center'>
            <h3 className='text-xl font-semibold mb-2'>Michael May</h3>
            <p className='text-brand-muted'>Featured community contributor</p>
          </div>
          <div className='overflow-hidden'>
            <ContributorGrid variant='large' contributors={contributors} />
          </div>
          <div className='text-center mt-8'>
            <Link
              to='https://github.com/OpenHands/OpenHands'
              className='btn btn-outline'
            >
              Become a contributor
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='px-10 py-20 text-center bg-brand-accent'>
        <div className='max-w-2xl mx-auto'>
          <p className='section-title mb-6'>Ready to join us?</p>
          <p className='text-brand-muted mb-8'>
            Check out our contribution guide and start building with us.
          </p>
          <div className='flex gap-4 justify-center flex-wrap'>
            <Link to='https://join.slack.com/t/openhands-community/shared_invite/zt-2t4m9lwnr-pZPQqJlB~vAMJ1BYY2c31w' className='btn btn-primary btn-lg'>
              Join Slack
            </Link>
            <Link to='https://docs.openhands.dev/' className='btn btn-outline btn-lg'>
              View Docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Community;
