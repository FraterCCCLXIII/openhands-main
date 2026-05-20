import type { Route } from './+types/community';
import { Footer } from '~/components/footer';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { createSocialPreviewMeta } from '~/utils/seo';

const LATEST_COMMUNITY_CALL = {
  description:
    'Catch up on our most recent community call where we discuss updates, roadmap, and answer questions from the community.',
  date: 'May 8, 2026',
  duration: '17:13',
  videoUrl: 'https://www.youtube.com/watch?v=20HNd4cb2vA',
  embedUrl: 'https://www.youtube.com/embed/20HNd4cb2vA',
};

const EVENTS = [
  {
    title: 'OpenHands Community Call - May 21st',
    description:
      "Join our bi-weekly OpenHands Community Call! We'll announce new contributors, discuss project updates, demo new features, and talk about the future of AI. All are welcome! Recording and agenda will be available post meeting.",
    date: 'May 21, 2026',
    time: '4:00 PM UTC',
    href: 'https://luma.com/openhands-community-21may26',
  },
  {
    title: 'Scaling Enterprise AI Agents: Security, Privacy & Real-World Deployment',
    description:
      'AI agents are rapidly moving from experimentation to mission-critical enterprise workflows — but scaling them securely remains one of the industry’s biggest challenges. Join us for an evening of conversation with leading engineers, founders, and AI infrastructure experts as we explore what it takes to deploy AI agents at enterprise scale while maintaining strong security, privacy, governance, and reliability standards. Expect practical insights, candid discussions, and networking with builders shaping the next generation of enterprise AI. Panelists: Robert Brennan — CEO and Co-Founder of OpenHands Dillon Zhang Forrest — Solutions Architect at Vercel Mahan Salehi — Product Manager at NVIDIA Chris Bradbury — Principal at Alumni Ventures Schedule: 5:30 - Doors Open 6:00 - Panel 6:30 - QA 7:00 - Networking 7:30 - End Enjoy complimentary food and beverage at the event. By RSVPing, you consent to receive marketing emails from the hosts. You can withdraw consent at any time via the unsubscribe link.',
    date: 'May 26, 2026',
    time: '9:30 PM UTC',
    href: 'https://luma.com/openhands-enterprise-ai-agents',
  },
  {
    title: 'OpenHands Community Call - June 4th',
    description:
      "Join our bi-weekly OpenHands Community Call! We'll announce new contributors, discuss project updates, demo new features, and talk about the future of AI. All are welcome! Recording and agenda will be available post meeting.",
    date: 'Jun 4, 2026',
    time: '4:00 PM UTC',
    href: 'https://luma.com/openhands-community-4jun26',
  },
];

const MICHAEL_MAY_IMAGE = '/assets/webflow/team/698653c2074b111e59086ff8_mike.jpeg';

const FIRST_TIME_CONTRIBUTORS = [
  {
    name: 'Kage18',
    title: 'fix: avoid rewriting provider credit errors',
    href: 'https://github.com/OpenHands/OpenHands/pull/14437',
    avatar: 'https://avatars.githubusercontent.com/u/39442065?v=4',
  },
  {
    name: 'smolpaws',
    title: 'Add issue duplicate automation workflow',
    href: 'https://github.com/OpenHands/OpenHands/pull/14444',
    avatar: 'https://avatars.githubusercontent.com/u/255025612?v=4',
  },
  {
    name: 'Cao-R',
    title: 'fix Windows compatibility: use cross-platform temp directory for sandbox',
    href: 'https://github.com/OpenHands/OpenHands/pull/14261',
    avatar: 'https://avatars.githubusercontent.com/u/176635150?v=4',
  },
] as const;

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

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: 'OpenHands Community',
    description:
      'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering work securely and transparently. Build faster with full control.',
    pathname: location.pathname,
  });
export const handle = { hideGlobalFooter: true };


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
  // Live wraps each metadata datum in a flex `div` whose inner `<p>`
  // remains a regular block element — keeping the icon outside the
  // paragraph.  We were emitting `<p class="inline-flex ...">…</p>`,
  // which collapsed icon + label into the paragraph and left the
  // computed `display` of the `P:4:00 pm utc` text element as `flex`
  // (vs live's `block`).
  <div
    className={[
      'inline-flex items-center gap-2',
      tone === 'light' ? 'text-brand-bg' : 'text-brand-fg',
    ].join(' ')}
  >
    <MetadataIcon type={type} />
    <p className='text-[16px] font-normal leading-[22.4px]'>{children}</p>
  </div>
);

const Community = () => {
  return (
    <main data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column' }}>
      <section data-wf-el='section-community-hero' className='pb-10 pt-0 lg:pb-14' style={{ height: '360.016px', paddingBottom: '0px' }}>
        {/* Live wraps the hero in `<div class="hero"><div class="container"><div class="hero-content is-center">`.
            `.hero-content` carries `padding: 2rem 0 4rem` (collapsing to ~56px top at the
            community breakpoint), which is what shifts the H1 from `top:84` to `top:140`
            on live. Mirror it with `pt-14` on the inner content wrapper. */}
        <div className='mx-auto flex max-w-[1238px] flex-col items-center gap-5 pt-14 text-center'>
          <h1 className='max-w-[920px] fluid-h1 text-brand-fg'>
            Join the OpenHands Community
          </h1>
          <p className='max-w-[560px] fluid-body-lg font-medium text-brand-muted' style={{ marginTop: '10.4px', marginBottom: '20.8px', transform: 'translateY(-21px)' }}>
            Connect with developers, contribute to open source, and help build the future of AI-powered autonomous software development.
          </p>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-4' style={{ transform: 'translateY(-32px)' }}>
            <OverlayLinkButton
              href='/joinslack'
              label='Join Slack'
              variant='primary'
              iconSrc='/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg'
            />
            <OverlayLinkButton
              href='#events'
              label='View Events'
              variant='outline'
            />
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='bg-brand-fg py-20 text-brand-bg' style={{ height: '506.828px' }}>
        <div className='mx-auto grid max-w-[1238px] gap-10 lg:grid-cols-[607px_591px] lg:items-center'>
          <div className='max-w-[607px]' style={{ paddingTop: '15px' }}>
            <h2 className='section-title text-brand-bg'>
              Latest Community Call
            </h2>
            <p className='text-[16px] leading-[22.4px] text-brand-bg' style={{ marginTop: '0px', marginBottom: '0px' }}>
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
            <OverlayLinkButton
              href={LATEST_COMMUNITY_CALL.videoUrl}
              label='Watch on YouTube'
              variant='lightbrown'
              className='mt-8 w-fit'
            />
          </div>

          <div className='overflow-hidden rounded-[4px]'>
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

      <section data-wf-el='section' id='events' className='py-20' style={{ height: '1088.12px' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='section-title text-brand-fg' style={{ marginBottom: '66px' }}>
              Upcoming Events
            </h2>
          </div>

          <div className='mt-12 grid gap-4 lg:grid-cols-3'>
            {EVENTS.map((event) => (
              <a
                key={event.title}
                href={event.href}
                target='_blank'
                rel='noopener noreferrer'
                className='relative flex h-[720px] flex-col overflow-hidden rounded-[8px] border border-[#b3a88c] bg-transparent transition-transform hover:-translate-y-0.5'
              >
                <div className='flex h-full flex-col p-6'>
                <h2 className='fluid-h4 leading-[1.4] text-brand-fg' style={{ marginBottom: '0px' }}>
                  {event.title}
                </h2>
                <p className='flex-1 text-[16px] leading-[22.4px] text-brand-muted' style={{ marginTop: '0px', marginBottom: '0px' }}>
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
                </div>
              </a>
            ))}
          </div>

          <div className='mt-8 flex justify-center'>
            <OverlayLinkButton
              href='https://luma.com/openhands?k=c'
              label='View All Events'
              variant='outline'
            />
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='bg-brand-fg py-20 text-brand-bg' style={{ height: '582.484px' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='flex flex-col items-center text-center'>
            <h2 className='section-title text-brand-bg'>
              Start contributing
            </h2>
            <p className='max-w-[520px] fluid-body-lg text-brand-bg' style={{ marginTop: '0px', marginBottom: '20.8px' }}>
              Join our mission to build better AI development tools
            </p>
          </div>

          <div className='grid gap-6 lg:grid-cols-3' style={{ marginTop: '23px' }}>
            {CONTRIBUTION_PATHS.map((path) => (
              <article
                key={path.title}
                className='flex h-full flex-col items-center rounded-[8px] border border-brand-bg/20 bg-transparent p-6 text-center'
              >
                <img src={path.icon} alt='' className='h-12 w-12' />
                <h3 className='w-full fluid-h4 leading-[1.4] text-brand-bg'>
                  {path.title}
                </h3>
                <p className='flex-1 text-[16px] leading-[22.4px] text-brand-bg' style={{ marginTop: '0px', marginBottom: '0px' }}>
                  {path.description}
                </p>
                {/* Live's per-card CTA uses Webflow's overlay-link
                    pattern: visible label in an aria-hidden div, with
                    an absolute-positioned anchor covering the wrapper.
                    The anchor itself has padding:0, position:absolute,
                    margin:0 — the wrapper carries the visual padding. */}
                <OverlayLinkButton
                  href={path.href}
                  label={path.cta}
                  variant='lightbrown'
                  className='mx-auto mt-6 w-fit'
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='py-20' style={{ height: '437.562px' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='section-title text-brand-fg'>
              Recognizing first-time contributors
            </h2>
          </div>
          <div className='mt-12 grid gap-6 lg:grid-cols-4'>
            {FIRST_TIME_CONTRIBUTORS.map((contributor) => (
              <a
                key={contributor.name}
                href={contributor.href}
                target='_blank'
                rel='noopener noreferrer'
                className='relative flex h-[181px] flex-col overflow-hidden rounded-[8px] border border-[#b3a88c] p-0 text-left text-brand-fg'
              >
                <div className='p-6'>
                  <div className='mb-4 flex items-center gap-3'>
                    <img
                      src={contributor.avatar}
                      alt={contributor.name}
                      className='h-12 w-12 object-cover'
                      style={{ borderRadius: '100%' }}
                    />
                    <span className='text-[16px] leading-[22.4px]'>{contributor.name}</span>
                  </div>
                  <p className='text-[16px] font-normal leading-[22.4px] text-brand-fg' style={{ margin: 0 }}>
                    {contributor.title}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='py-20' style={{ height: '706.344px' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='section-title text-brand-fg'>
              Community contributor spotlight
            </h2>
          </div>

          <div className='mx-auto mt-10 flex max-w-[1238px] flex-col items-center rounded-[6px] border border-brand-fg/10 bg-transparent px-8 py-10 text-center lg:px-12'>
            <img
              src={MICHAEL_MAY_IMAGE}
              alt=''
              className='img-block h-24 w-24'
              style={{ borderRadius: '100%', objectFit: 'fill' }}
            />
            <h3 className='fluid-h3 text-brand-fg'>
              Michael May
            </h3>
            <p className='max-w-[910px] text-[24px] font-medium leading-[33.6px] text-brand-fg' style={{ marginBottom: '24px' }}>
              “My team uses OpenHands for all our development tasks and we have found that it is hands-down better than Claude Code, cursor, Codex, and every other hot agentic DevTool out there. The caliber of the team at OpenHands and the caliber of the community they've curated is second to none, and this is evidenced by the quality of their product and the trajectory of their growth.”
            </p>
          </div>
        </div>
      </section>

      <Footer standalone showSocialLinks compactNav />
    </main>
  );
};

export default Community;
