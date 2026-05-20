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
    titleWidth: '193px',
  },
  {
    name: 'smolpaws',
    title: 'Add issue duplicate automation workflow',
    href: 'https://github.com/OpenHands/OpenHands/pull/14444',
    avatar: 'https://avatars.githubusercontent.com/u/255025612?v=4',
    titleWidth: '150px',
  },
  {
    name: 'Cao-R',
    title: 'fix Windows compatibility: use cross-platform temp directory for sandbox',
    href: 'https://github.com/OpenHands/OpenHands/pull/14261',
    avatar: 'https://avatars.githubusercontent.com/u/176635150?v=4',
    titleWidth: '215px',
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
      <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='100%' viewBox='0 0 13 14' fill='none' className='svg h-full w-full'>
        <path
          d='M4.15625 0.65625C4.15625 0.292578 3.86367 0 3.5 0C3.13633 0 2.84375 0.292578 2.84375 0.65625V1.75H1.75C0.784766 1.75 0 2.53477 0 3.5V3.9375V5.25V12.25C0 13.2152 0.784766 14 1.75 14H10.5C11.4652 14 12.25 13.2152 12.25 12.25V5.25V3.9375V3.5C12.25 2.53477 11.4652 1.75 10.5 1.75H9.40625V0.65625C9.40625 0.292578 9.11367 0 8.75 0C8.38633 0 8.09375 0.292578 8.09375 0.65625V1.75H4.15625V0.65625ZM1.3125 5.25H10.9375V12.25C10.9375 12.4906 10.7406 12.6875 10.5 12.6875H1.75C1.50937 12.6875 1.3125 12.4906 1.3125 12.25V5.25Z'
          fill='currentColor'
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='100%' viewBox='0 0 14 14' fill='none' className='svg h-full w-full'>
      <path
        d='M12.6875 7C12.6875 10.139 10.139 12.6875 7 12.6875C3.86098 12.6875 1.3125 10.139 1.3125 7C1.3125 3.86098 3.86098 1.3125 7 1.3125C10.139 1.3125 12.6875 3.86098 12.6875 7ZM0 7C0 10.8634 3.13659 14 7 14C10.8634 14 14 10.8634 14 7C14 3.13659 10.8634 0 7 0C3.13659 0 0 3.13659 0 7ZM6.34375 3.28125V7C6.34375 7.21875 6.45312 7.42383 6.63633 7.54688L9.26133 9.29688C9.56211 9.49922 9.96953 9.41719 10.1719 9.11367C10.3742 8.81016 10.2922 8.40547 9.98867 8.20312L7.65625 6.65V3.28125C7.65625 2.91758 7.36367 2.625 7 2.625C6.63633 2.625 6.34375 2.91758 6.34375 3.28125Z'
        fill='currentColor'
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
    data-wf-el='previous-event_content_meta_item'
    className={[
      'inline-flex items-center gap-2',
      tone === 'light' ? 'text-brand-bg' : 'text-brand-fg',
    ].join(' ')}
  >
    <div data-wf-el='previous-event_content_meta_icon' className='h-4 w-4 shrink-0'>
      <MetadataIcon type={type} />
    </div>
    <p data-wf-el='previous-event_content_meta_text' className='text-[16px] font-normal leading-[22.4px]'>{children}</p>
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
        <div data-wf-el='hero' className='flex flex-col items-center overflow-hidden' style={{ height: '360.016px', position: 'relative' }}>
          <div data-wf-el='container' className='mx-auto flex max-w-[1238px] flex-col items-center gap-5 pt-14 text-center' style={{ width: '95%' }}>
          <h1 className='max-w-[920px] fluid-h1 text-brand-fg'>
            Join the OpenHands Community
          </h1>
          <p data-wf-el='paragraph-lg' className='max-w-[481px] fluid-body-lg font-medium text-brand-muted' style={{ marginTop: '10.4px', marginBottom: '20.8px', transform: 'translateY(-21px)' }}>
            Connect with developers, contribute to open source, and help build the future of AI-powered autonomous software development.
          </p>
          <div data-wf-el='hero_btn_wrap' className='mt-6 flex flex-wrap items-center justify-center gap-4' style={{ transform: 'translateY(-32px)' }}>
            <OverlayLinkButton
              href='/joinslack'
              label='Join Slack'
              variant='primary'
              iconSrc='/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg'
              wfEl='button'
              textWfEl='btn-text'
              iconWrapWfEl='btn-icon'
              iconColorWfEl='icon-color'
              iconWfEl='button-icon'
            />
            <OverlayLinkButton
              href='#events'
              label='View Events'
              variant='outline'
              wfEl='button'
              textWfEl='btn-text'
            />
          </div>
        </div>
        </div>
      </section>

      <section data-wf-el='section' className='bg-brand-fg py-20 text-brand-bg' style={{ height: '506.828px' }}>
        <div data-wf-el='container' className='mx-auto grid max-w-[1238px] gap-10 lg:grid-cols-[607px_591px] lg:items-center'>
          <div data-wf-el='previous-event_content_wrap' className='max-w-[607px]' style={{ paddingTop: '15px' }}>
            <div data-wf-el='previous-event_content_headers'>
              <h2 className='section-title text-brand-bg'>
                Latest Community Call
              </h2>
              <p className='text-[16px] leading-[22.4px] text-brand-bg' style={{ marginTop: '0px', marginBottom: '0px' }}>
                {LATEST_COMMUNITY_CALL.description}
              </p>
            </div>
            <div data-wf-el='previous-event_content_meta' className='mt-8 flex flex-wrap items-center gap-x-8 gap-y-3'>
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
              wfEl='button'
              textWfEl='btn-text'
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

      <section data-wf-el='section' id='events' className='py-20' style={{ height: '1110.52px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]'>
          <div className='text-center'>
            <h2 className='section-title text-brand-fg' style={{ marginBottom: '66px' }}>
              Upcoming Events
            </h2>
          </div>

          <div data-wf-el='events-list_cms_list' className='mt-12 grid gap-4 lg:grid-cols-3'>
            {EVENTS.map((event) => (
              <a
                key={event.title}
                href={event.href}
                target='_blank'
                rel='noopener noreferrer'
                data-wf-el='contribution_card_link'
                className='relative flex flex-col overflow-hidden rounded-[8px] border border-[#b3a88c] bg-transparent transition-transform hover:-translate-y-0.5'
                style={{ height: '742.547px' }}
              >
                <div data-wf-el='card-body' className='flex h-full flex-col p-6'>
                <div data-wf-el='events-list_card_content' className='flex h-full flex-col justify-between'>
                  <div data-wf-el='events-list_card_content_top' className='grid gap-2'>
                <h2 className='fluid-h4 leading-[1.4] text-brand-fg' style={{ marginBottom: '0px' }}>
                  {event.title}
                </h2>
                <p className='text-[16px] leading-[22.4px] text-brand-muted' style={{ marginTop: '0px', marginBottom: '0px' }}>
                  {event.description}
                </p>
                  </div>
                <div data-wf-el='previous-event_content_meta' className='flex flex-wrap items-center gap-x-6 gap-y-2'>
                  <MetadataItem type='calendar' tone='dark'>
                    {event.date}
                  </MetadataItem>
                  <MetadataItem type='clock' tone='dark'>
                    {event.time}
                  </MetadataItem>
                </div>
                </div>
                </div>
              </a>
            ))}
          </div>

          <div data-wf-el='events_button_wrap' className='mt-8 flex justify-center'>
            <OverlayLinkButton
              href='https://luma.com/openhands?k=c'
              label='View All Events'
              variant='outline'
              wfEl='button'
              textWfEl='btn-text'
            />
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='bg-brand-fg py-20 text-brand-bg' style={{ height: '582.484px' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]'>
          <div data-wf-el='heading-stack' className='flex flex-col items-center text-center'>
            <h2 className='section-title text-brand-bg'>
              Start contributing
            </h2>
            <p data-wf-el='paragraph-lg' className='max-w-[520px] fluid-body-lg text-brand-bg' style={{ marginTop: '0px', marginBottom: '20.8px' }}>
              Join our mission to build better AI development tools
            </p>
          </div>

          <div data-wf-el='community-contributing_cards_wrap' className='grid gap-6 lg:grid-cols-3' style={{ marginTop: '23px' }}>
            {CONTRIBUTION_PATHS.map((path) => (
              <article
                key={path.title}
                data-wf-el='community-contributing_cards_card'
                className='flex h-full flex-col items-center rounded-[8px] border border-brand-bg/20 bg-transparent p-6 text-center'
              >
                <img data-wf-el='community-contributing_cards_icon' src={path.icon} alt='' className='h-12 w-12' />
                <h3 className='w-full fluid-h4 leading-[1.4] text-brand-bg'>
                  {path.title}
                </h3>
                <p className='flex-1 text-[16px] leading-[22.4px] text-brand-bg' style={{ marginTop: '0px', marginBottom: '0px', width: path.title === 'Issues to fix' ? '251px' : undefined }}>
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
                  wfEl='button'
                  textWfEl='btn-text'
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
                    <span data-wf-el='lovewall_cms_item_top_name' className='text-[14.08px] leading-[19.712px]'>{contributor.name}</span>
                  </div>
                  <p className='text-[16px] font-normal leading-[22.4px] text-brand-fg' style={{ margin: 0, maxWidth: contributor.titleWidth }}>
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
              “My team uses OpenHands for all our development tasks and we have found that it is hands-down better than Claude Code, cursor, Codex, and every other hot agentic DevTool out there. The caliber of the team at OpenHands and the caliber of the community they’ve curated is second to none, and this is evidenced by the quality of their product and the trajectory of their growth.”
            </p>
          </div>
        </div>
      </section>

      <Footer standalone showSocialLinks compactNav />
    </main>
  );
};

export default Community;
