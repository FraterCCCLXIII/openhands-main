import type { Route } from './+types/community';
import { MarketingFooterCta } from '~/components/marketing-footer-cta';

const LATEST_COMMUNITY_CALL = {
  description:
    'Catch up on our most recent community call where we discuss updates, roadmap, and answer questions from the community.',
  date: 'April 28, 2026',
  duration: '40:56',
  videoUrl: 'https://www.youtube.com/watch?v=H8wIK1_0zNU',
  embedUrl: 'https://www.youtube.com/embed/H8wIK1_0zNU',
};

const EVENTS = [
  {
    title: 'OpenHands Community Call - May 7th',
    description:
      "Join our bi-weekly OpenHands Community Call! We'll announce new contributors, discuss project updates, demo new features, and talk about the future of AI. All are welcome! Recording and agenda will be available post meeting.",
    date: 'May 7, 2026',
    time: '4:00 PM UTC',
    href: 'https://luma.com/openhands-community-7may26',
  },
  {
    title: 'OpenHands Community Call - May 21st',
    description:
      "Join our bi-weekly OpenHands Community Call! We'll announce new contributors, discuss project updates, demo new features, and talk about the future of AI. All are welcome! Recording and agenda will be available post meeting.",
    date: 'May 21, 2026',
    time: '4:00 PM UTC',
    href: 'https://luma.com/openhands-community-21may26',
  },
];

const MICHAEL_MAY_IMAGE = '/assets/webflow/team/698653c2074b111e59086ff8_mike.jpeg';

const CONTRIBUTION_PATHS = [
  {
    title: 'Read the docs',
    description: 'Get familiar with our architecture and contribution guidelines',
    cta: 'View Docs',
    href: 'https://docs.openhands.dev/overview/introduction',
    icon: '/assets/webflow/misc/6980a326d5e28f7fd234c48c_a06191c45eb8707cefbabef71e11dcfe_Frame.svg',
  },
  {
    title: 'Issues to fix',
    description: 'Find beginner-friendly issues in our CLI repository',
    cta: 'Browse Issues',
    href: 'https://github.com/OpenHands/OpenHands-CLI/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22',
    icon: '/assets/webflow/misc/6980a326220ace0b3d3e54a1_5ec23b145729a1b01238c2d570990989_Frame-1.svg',
  },
  {
    title: 'Start Contributing',
    description: 'Learn how to contribute to OpenHands.',
    cta: 'Get Started',
    href: 'https://docs.openhands.dev/overview/contributing',
    icon: '/assets/webflow/misc/6980a3270e8db1fb595e98f7_69717b2c66197029bb6e7fe0d72c5d6f_Frame-2.svg',
  },
];

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Community' },
    {
      name: 'description',
      content:
        'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering work securely and transparently. Build faster with full control.',
    },
    { property: 'og:title', content: 'OpenHands Community' },
    {
      property: 'og:description',
      content:
        'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering work securely and transparently. Build faster with full control.',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const MetadataIcon = ({ type }: { type: 'calendar' | 'clock' }) => {
  if (type === 'calendar') {
    return (
      <svg aria-hidden='true' viewBox='0 0 16 16' className='h-4 w-4 shrink-0'>
        <path
          fill='currentColor'
          d='M4.5 1a.75.75 0 0 1 .75.75V2.5h5.5v-.75a.75.75 0 0 1 1.5 0V2.5h.25A2.25 2.25 0 0 1 14.75 4.75v7A2.25 2.25 0 0 1 12.5 14h-9A2.25 2.25 0 0 1 1.25 11.75v-7A2.25 2.25 0 0 1 3.5 2.5h.25v-.75A.75.75 0 0 1 4.5 1Zm8.75 5h-10.5v5.75c0 .414.336.75.75.75h9a.75.75 0 0 0 .75-.75V6Z'
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden='true' viewBox='0 0 16 16' className='h-4 w-4 shrink-0'>
      <path
        fill='currentColor'
        d='M8 1.25a6.75 6.75 0 1 1 0 13.5a6.75 6.75 0 0 1 0-13.5Zm0 1.5a5.25 5.25 0 1 0 0 10.5a5.25 5.25 0 0 0 0-10.5Zm.75 1.5v3.19l2.22 1.48a.75.75 0 1 1-.84 1.24L7.58 8.46a.75.75 0 0 1-.33-.62V4.25a.75.75 0 0 1 1.5 0Z'
      />
    </svg>
  );
};

const MetadataItem = ({
  type,
  tone,
  children,
}: {
  type: 'calendar' | 'clock';
  tone: 'dark' | 'light';
  children: string;
}) => (
  <p
    className={[
      'inline-flex items-center gap-2 text-[16px] font-medium leading-[22.4px]',
      tone === 'light' ? 'text-brand-bg' : 'text-brand-fg',
    ].join(' ')}
  >
    <MetadataIcon type={type} />
    <span>{children}</span>
  </p>
);

const Community = () => {
  return (
    <main className='pt-[40px]'>
      <section className='px-10 pb-10 pt-0 lg:pb-14'>
        <div className='mx-auto flex max-w-[1238px] flex-col items-center gap-5 text-center'>
          <h1 className='max-w-[920px] fluid-h1 text-brand-fg'>
            Join the OpenHands Community
          </h1>
          <p className='max-w-[560px] fluid-body-lg font-medium text-brand-muted'>
            Connect with developers, contribute to open source, and help build the future of AI-powered autonomous software development.
          </p>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-4'>
            <a
              href='/joinslack'
              className='btn rounded-none flex items-center gap-3 text-brand-bg'
            >
              <img
                src='/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg'
                alt=''
                className='h-5 w-5'
              />
              <span>Join Slack</span>
            </a>
            <a
              href='#events'
              className='btn btn-outline border-none rounded-none'
            >
              View Events
            </a>
          </div>
        </div>
      </section>

      <section className='bg-brand-fg px-10 py-16 text-brand-bg'>
        <div className='mx-auto grid max-w-[1238px] gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center'>
          <div className='max-w-[560px]'>
            <h2 className='section-title text-brand-bg'>
              Latest Community Call
            </h2>
            <p className='mt-4 text-[16px] leading-[22.4px] text-brand-bg'>
              {LATEST_COMMUNITY_CALL.description}
            </p>
            <div className='mt-8 flex flex-wrap items-center gap-x-8 gap-y-3'>
              <MetadataItem type='calendar' tone='light'>
                {LATEST_COMMUNITY_CALL.date}
              </MetadataItem>
              <MetadataItem type='clock' tone='light'>
                {LATEST_COMMUNITY_CALL.duration}
              </MetadataItem>
            </div>
            <a
              href={LATEST_COMMUNITY_CALL.videoUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline border-none rounded-none mt-8 text-brand-bg border-brand-bg/30 hover:bg-brand-bg hover:text-brand-fg'
            >
              Watch on YouTube
            </a>
          </div>

          <div className='overflow-hidden rounded-[4px] bg-black/10'>
            <iframe
              title='Latest OpenHands community call'
              src={LATEST_COMMUNITY_CALL.embedUrl}
              className='aspect-video w-full border-0'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
              referrerPolicy='strict-origin-when-cross-origin'
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section id='events' className='px-10 py-20'>
        <div className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='section-title text-brand-fg'>
              Upcoming Events
            </h2>
          </div>

          <div className='mt-12 grid gap-6 lg:grid-cols-3'>
            {EVENTS.map((event) => (
              <a
                key={event.title}
                href={event.href}
                target='_blank'
                rel='noopener noreferrer'
                className='flex h-full flex-col rounded-[8px] border border-[#b3a88c] bg-transparent p-6 transition-transform hover:-translate-y-0.5'
              >
                <h2 className='fluid-h4 leading-[1.4] text-brand-fg'>
                  {event.title}
                </h2>
                <p className='mt-4 flex-1 text-[14px] leading-[1.5] text-brand-muted'>
                  {event.description}
                </p>
                <div className='mt-6 flex flex-wrap items-center gap-x-6 gap-y-2'>
                  <MetadataItem type='calendar' tone='dark'>
                    {event.date}
                  </MetadataItem>
                  <MetadataItem type='clock' tone='dark'>
                    {event.time}
                  </MetadataItem>
                </div>
              </a>
            ))}
          </div>

          <div className='mt-8 text-center'>
            <a
              href='https://luma.com/openhands?k=c'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline border-none rounded-none'
            >
              View All Events
            </a>
          </div>
        </div>
      </section>

      <section className='mt-[60px] bg-brand-fg px-10 py-16 text-brand-bg'>
        <div className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='inline-block section-title text-brand-bg'>
              Start contributing
            </h2>
            <p className='mx-auto mt-4 max-w-[520px] fluid-body-lg text-brand-bg'>
              Join our mission to build better AI development tools
            </p>
          </div>

          <div className='mt-10 grid gap-6 lg:grid-cols-3'>
            {CONTRIBUTION_PATHS.map((path) => (
              <article
                key={path.title}
                className='flex h-full flex-col rounded-[8px] border border-brand-bg/20 bg-transparent p-6 text-center'
              >
                <img src={path.icon} alt='' className='mx-auto h-14 w-14' />
                <h3 className='mt-6 fluid-h4 leading-[1.4] text-brand-bg'>
                  {path.title}
                </h3>
                <p className='mt-4 flex-1 text-[16px] leading-[22.4px] text-brand-bg'>
                  {path.description}
                </p>
                <a
                  href={path.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn btn-outline border-none rounded-none mt-6 inline-flex w-fit self-center text-brand-bg border-brand-bg/30 hover:bg-brand-bg hover:text-brand-fg'
                >
                  {path.cta}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='px-10 py-16'>
        <div className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='section-title text-brand-fg'>
              Recognizing first-time contributors
            </h2>
          </div>
          <div aria-hidden='true' className='h-28' />
        </div>
      </section>

      <section className='px-10 pb-[138px] pt-0'>
        <div className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='section-title text-brand-fg'>
              Community contributor spotlight
            </h2>
          </div>

          <div className='mx-auto mt-10 max-w-[1238px] rounded-[6px] border border-brand-fg/10 bg-transparent px-8 py-10 text-center lg:px-12'>
            <img
              src={MICHAEL_MAY_IMAGE}
              alt=''
              className='mx-auto h-20 w-20 rounded-full object-cover'
            />
            <h3 className='mt-5 inline-block fluid-h3 text-brand-fg'>
              Michael May
            </h3>
            <p className='mx-auto mt-6 max-w-[910px] text-[24px] leading-[33.6px] text-brand-fg'>
              “My team uses OpenHands for all our development tasks and we have found that it is hands-down better than Claude Code, cursor, Codex, and every other hot agentic DevTool out there. The caliber of the team at OpenHands and the caliber of the community they've curated is second to none, and this is evidenced by the quality of their product and the trajectory of their growth.”
            </p>
          </div>
        </div>
      </section>

      <MarketingFooterCta className='py-28' />
    </main>
  );
};

export default Community;
