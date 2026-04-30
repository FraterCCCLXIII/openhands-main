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
    title: 'Scale Enterprise AI Agents',
    description:
      'After ODSC, stop by our nearby event sponsored by OpenHands to learn about the latest best practices and trends in enterprise agentic AI. Our founder & CEO, Robert Brennan, will be sharing insights on what he’s been seeing and learning in the space. Food and drinks will be provided.',
    date: 'Apr 30, 2026',
    time: '9:30 PM UTC',
    href: 'https://luma.com/odsc-boston',
  },
  {
    title: 'OpenHands Community Call - May 7th',
    description:
      "Join our bi-weekly OpenHands Community Call! We'll announce new contributors, discuss project updates, demo new features, and talk about the future of AI. All are welcome!",
    date: 'May 7, 2026',
    time: '4:00 PM UTC',
    href: 'https://luma.com/openhands-community-7may26',
  },
  {
    title: 'OpenHands Community Call - May 21st',
    description:
      "Join our bi-weekly OpenHands Community Call! We'll announce new contributors, discuss project updates, demo new features, and talk about the future of AI. All are welcome!",
    date: 'May 21, 2026',
    time: '4:00 PM UTC',
    href: 'https://luma.com/openhands-community-21may26',
  },
];

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

const Community = () => {
  return (
    <main className='pt-[100px]'>
      <section className='px-10 pb-10 pt-0 lg:pb-14'>
        <div className='mx-auto flex max-w-[1238px] flex-col items-center gap-5 text-center'>
          <h1 className='max-w-[920px] text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
            Join the OpenHands Community
          </h1>
          <p className='max-w-[560px] text-[18px] leading-[1.35] font-medium text-brand-muted lg:text-[20px]'>
            Connect with developers, contribute to open source, and help build the future of AI-powered autonomous software development.
          </p>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-4'>
            <a href='/joinslack' className='btn btn-primary rounded-none flex items-center gap-3 whitespace-nowrap'>
              <img
                src='/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg'
                alt=''
                className='h-5 w-5'
              />
              <span>Join Slack</span>
            </a>
            <a href='#events' className='btn btn-outline rounded-none whitespace-nowrap'>
              View Events
            </a>
          </div>
        </div>
      </section>

      <section className='bg-brand-fg px-10 py-16 text-brand-bg'>
        <div className='mx-auto grid max-w-[1238px] gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center'>
          <div className='max-w-[560px]'>
            <h2 className='text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-bg lg:text-[44px]'>
              Latest Community Call
            </h2>
            <p className='mt-4 text-[18px] leading-[1.45] text-brand-bg'>
              {LATEST_COMMUNITY_CALL.description}
            </p>
            <div className='mt-8 flex flex-wrap items-center gap-8 text-[16px] font-medium text-brand-bg'>
              <p>{LATEST_COMMUNITY_CALL.date}</p>
              <p>{LATEST_COMMUNITY_CALL.duration}</p>
            </div>
            <a
              href={LATEST_COMMUNITY_CALL.videoUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline rounded-none mt-8 text-brand-bg border-brand-bg/30 hover:bg-brand-bg hover:text-brand-fg'
            >
              Watch on YouTube
            </a>
          </div>

          <div className='overflow-hidden rounded-[10px] bg-black/10'>
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
            <h2 className='text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg lg:text-[44px]'>
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
                className='flex h-full flex-col rounded-[8px] border border-brand-fg/10 bg-transparent p-6 transition-transform hover:-translate-y-0.5'
              >
                <h2 className='text-[26px] font-medium leading-[1.2] text-brand-fg'>{event.title}</h2>
                <p className='mt-4 flex-1 text-[16px] leading-[1.6] text-brand-muted'>{event.description}</p>
                <div className='mt-6 flex flex-col gap-1 text-[15px] font-medium text-brand-fg'>
                  <p>{event.date}</p>
                  <p>{event.time}</p>
                </div>
              </a>
            ))}
          </div>

          <div className='mt-8 text-center'>
            <a
              href='https://luma.com/openhands?k=c'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline rounded-none whitespace-nowrap'
            >
              View All Events
            </a>
          </div>
        </div>
      </section>

      <section className='px-10 py-16'>
        <div className='mx-auto max-w-[1238px] rounded-[28px] bg-brand-fg px-8 py-10 lg:px-12 lg:py-14'>
          <div className='text-center'>
            <h2 className='inline-block text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-bg lg:text-[44px]'>
              Start contributing
            </h2>
            <p className='mx-auto mt-4 max-w-[520px] text-[18px] leading-[1.6] text-[#b3a88c]'>
              Join our mission to build better AI development tools
            </p>
          </div>

          <div className='mt-10 grid gap-6 lg:grid-cols-3'>
            {CONTRIBUTION_PATHS.map((path) => (
              <article
                key={path.title}
                className='flex h-full flex-col rounded-[24px] border border-brand-bg/20 bg-transparent p-6 text-center'
              >
                <img src={path.icon} alt='' className='mx-auto h-14 w-14' />
                <h3 className='mt-6 text-[26px] font-medium leading-[1.2] text-brand-bg'>{path.title}</h3>
                <p className='mt-4 flex-1 text-[16px] leading-[1.6] text-[#b3a88c]'>{path.description}</p>
                <a
                  href={path.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn btn-outline rounded-none mt-6 w-fit self-center text-brand-bg border-brand-bg/30 hover:bg-brand-bg hover:text-brand-fg'
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
            <h2 className='text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg lg:text-[44px]'>
              Recognizing first-time contributors
            </h2>
          </div>
          <div aria-hidden='true' className='h-28' />
        </div>
      </section>

      <section className='px-10 py-16'>
        <div className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg lg:text-[44px]'>
              Community contributor spotlight
            </h2>
          </div>

          <div className='mx-auto mt-6 max-w-[1000px] rounded-[28px] border border-brand-fg/10 bg-white/60 px-8 py-8 text-center'>
            <h3 className='inline-block text-[32px] font-medium leading-[1.2] text-brand-fg'>Michael May</h3>
            <p className='mx-auto mt-4 max-w-[720px] text-[18px] leading-[1.7] text-brand-muted'>
              “My team uses OpenHands for all our development tasks and we have found that it is hands-down better than Claude Code, cursor, Codex, and every other hot agentic DevTool out there. The caliber of the team at OpenHands and the caliber of the community they’ve curated is second to none, and this is evidenced by the quality of their product and the trajectory of their growth.”
            </p>
          </div>
        </div>
      </section>

      <MarketingFooterCta />
    </main>
  );
};

export default Community;
