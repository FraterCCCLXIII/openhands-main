import { useEffect, useState, type ReactNode } from 'react';
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
    title: 'Scaling Enterprise AI Agents: Security, Privacy & Real-World Deployment',
    titleScale: 1.0032,
    description:
      `AI agents are rapidly moving from experimentation to mission-critical enterprise workflows — but scaling them securely remains one of the industry’s biggest challenges.
Join us for an evening of conversation with leading engineers, founders, and AI infrastructure experts as we explore what it takes to deploy AI agents at enterprise scale while maintaining strong security, privacy, governance, and reliability standards. Expect practical insights, candid discussions, and networking with builders shaping the next generation of enterprise AI.
Panelists:
Robert Brennan — CEO and Co-Founder of OpenHands
Dillon Zhang Forrest — Solutions Architect at Vercel
Mahan Salehi — Product Manager at NVIDIA
Alex Starr — Corporate Fellow at AMD
Chris Bradbury — Principal at Alumni Ventures
Schedule:
5:30 - Doors Open
6:00 - Panel
6:30 - QA
7:00 - Networking
7:30 - End
Enjoy complimentary food and beverage at the event.

Robert Brennan; CEO and Co-Founder of OpenHands
Robert Brennan has been writing software for 15 years, with a focus on natural language processing and developer tools. He is currently the CEO of All Hands AI, the company behind OpenHands (formerly OpenDevin), a fully autonomous AI developer. Previously he was VP of Product Development at Fairwinds, ran a startup called Datafire, and worked as a Senior Software Engineer at Google.
Dillon Zhang Forrest; Solutions Architect at Vercel
Most businesses struggle to adopt AI. As a solutions architect at Vercel, I help businesses ship production AI applications that actually generate positive ROI.
Mahan Salehi; Product Manager at NVIDIA
Mahan Salehi is a product management leader at NVIDIA, currently focused on building "co-scientist" AI agents for biology and life sciences research. He has served as product owner for several NVIDIA flagship products, including Triton Inference Server, NIM, and NeMo Microservices. Before joining NVIDIA, Mahan was the CEO and co-founder of an AI startup dedicated to improving mental health treatment. He holds an engineering degree from the University of Toronto.
Alex Starr; Corporate Fellow at AMD
With AMD for over twenty years, Alex Starr leads an Applied AI team called Shift Left AI, which helps shape how agentic AI transforms chip design.
Chris Bradbury; Principal at Alumni Ventures

By RSVPing, you consent to receive marketing emails from the hosts. You can withdraw consent at any time via the unsubscribe link.`,
    descriptionHeight: '1231px',
    date: 'May 26, 2026',
    time: '9:30 PM UTC',
    startsAt: '2026-05-26T21:30:00Z',
    href: 'https://luma.com/event-26may26',
  },
  {
    title: 'OpenHands Community Call - June 4th',
    description:
      "Join our bi-weekly OpenHands Community Call! We'll announce new contributors, discuss project updates, demo new features, and talk about the future of AI. All are welcome! Recording and agenda will be available post meeting.",
    date: 'Jun 4, 2026',
    time: '4:00 PM UTC',
    startsAt: '2026-06-04T16:00:00Z',
    href: 'https://luma.com/openhands-community-4jun26',
  },
  {
    title: 'OpenHands Community Call - June 18th',
    description:
      "Join our bi-weekly OpenHands Community Call! We'll announce new contributors, discuss project updates, demo new features, and talk about the future of AI. All are welcome! Recording and agenda will be available post meeting.",
    date: 'Jun 18, 2026',
    time: '4:00 PM UTC',
    startsAt: '2026-06-18T16:00:00Z',
    href: 'https://luma.com/openhands-community-18jun26',
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
    textWidth: '346.656px',
    titleScale: 1.0066,
    descriptionWidth: '346.656px',
    descriptionScale: 1,
  },
  {
    title: 'Issues to fix',
    description: 'Find beginner-friendly issues in our CLI repository',
    cta: 'Browse Issues',
    href: 'https://github.com/OpenHands/OpenHands-CLI/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22',
    icon: '/assets/webflow/misc/6980a326220ace0b3d3e54a1_5ec23b145729a1b01238c2d570990989_Frame-1.svg',
    textWidth: '346.672px',
    descriptionWidth: '346.672px',
    descriptionScale: 0.903,
  },
  {
    title: 'Start Contributing',
    description: 'Learn how to contribute to OpenHands.',
    cta: 'Get Started',
    href: 'https://docs.openhands.dev/overview/contributing',
    icon: '/assets/webflow/misc/6980a3270e8db1fb595e98f7_69717b2c66197029bb6e7fe0d72c5d6f_Frame-2.svg',
    textWidth: '279px',
    titleScale: 1.0052,
    descriptionWidth: '279px',
    descriptionScale: 1,
    minTextHeight: '89.568px',
  }
];

const DEFAULT_FOOTER_PRIMARY = { href: 'https://docs.openhands.dev/sdk', label: 'Build with SDK' };
const DEFAULT_FOOTER_SECONDARY = { href: 'https://app.all-hands.dev/', label: 'Try it live' };

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
        d='M12.6875 7C12.6875 10.139 10.139 12.6875 7 12.6875C3.86098 12.6875 1.3125 10.139 1.3125 7C1.3125 3.86098 3.86098 1.3125 7 1.3125C10.139 1.3125 12.6875 3.86098 12.6875 7ZM0 7C0 10.8634 3.13659 14 7 14C10.8634 14 14 10.8634 14 7C14 3.13659 10.8634 0 7 0C3.13659 0 0 3.13659 0 7ZM6.34375 3.28125V7C6.34375 7.21875 6.45312 7.42383 6.63633 7.54688L9.26133 9.29688C9.56211 9.49922 9.96953 9.41719 10.1719 9.11367Cnan nan 10.2922 8.40547 9.98867 8.20312L7.65625 6.65V3.28125C7.65625 2.91758 7.36367 2.625 7 2.625Cnan nan 6.34375 2.91758 6.34375 3.28125Z'
        fill='currentColor'
      />
    </svg>
  );
};


const useLocalEventLabel = (
  startsAt: string | undefined,
  fallback: string,
  options: Intl.DateTimeFormatOptions,
) => {
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    if (!startsAt) return;
    setLabel(new Intl.DateTimeFormat(undefined, options).format(new Date(startsAt)));
  }, [fallback, options, startsAt]);

  return label;
};

const EventDate = ({ startsAt, fallback }: { startsAt?: string; fallback: string }) => {
  const label = useLocalEventLabel(startsAt, fallback, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return <>{label}</>;
};

const EventTime = ({ startsAt, fallback }: { startsAt?: string; fallback: string }) => {
  const label = useLocalEventLabel(startsAt, fallback, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return <>{label}</>;
};

const MetadataItem = ({
  type,
  tone,
  children,
}: {
  type: 'calendar' | 'clock';
  tone: 'dark' | 'light';
  children: ReactNode;
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
      'flex items-center justify-start gap-2',
      tone === 'light' ? 'text-brand-bg' : 'text-brand-fg',
    ].join(' ')}
  >
    <div data-wf-el='previous-event_content_meta_icon' className='w-4 shrink-0' style={{ height: type === 'calendar' ? '17.2188px' : '16px' }}>
      <MetadataIcon type={type} />
    </div>
    <p data-wf-el='previous-event_content_meta_text' className='text-[16px] font-normal leading-[22.4px]'>{children}</p>
  </div>
);

const Community = () => {
  return (
    <main data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column' }}>
      <section data-wf-el='section-community-hero' style={{ height: '360.016px', padding: '0px' }}>
        <div data-wf-el='hero' className='flex flex-col items-center overflow-hidden' style={{ height: '360.016px', position: 'relative', justifyContent: 'flex-start' }}>
          <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ width: '100%', height: '360.016px' }}>
            <div data-wf-el='hero-content' className='flex flex-col items-center justify-center text-center' style={{ position: 'relative', height: '360.016px', padding: '56px 0px' }}>
              <h1 className='fluid-h1 text-brand-fg' style={{ margin: 0 }}>
                Join the OpenHands Community
              </h1>
              <p data-wf-el='paragraph-lg' className='fluid-body-lg font-medium text-brand-muted' style={{ maxWidth: '560px', width: '560px', marginTop: '10.4px', marginBottom: '20.8px' }}>
                <span style={{ display: 'inline-block', transform: 'scaleX(0.914)', transformOrigin: 'center' }}>Connect with developers, contribute to open source, and help build the future of AI-powered autonomous software development.</span>
              </p>
              <div data-wf-el='hero_btn_wrap' className='flex' style={{ columnGap: '16px', rowGap: '8px', paddingTop: '32px', maxWidth: '100%' }}>
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
        </div>
      </section>

      <section data-wf-el='section' className='bg-brand-fg text-brand-bg' style={{ height: '506.828px', padding: '80px 0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ height: '346.828px' }}>
          <div className='row row-justify-center row-gap-md' style={{ display: 'flex', justifyContent: 'center', rowGap: '24px', marginLeft: '-12px', marginRight: '-12px' }}>
            <div className='col' style={{ display: 'flex', flexDirection: 'column', position: 'relative', width: '631px', padding: '0px 12px' }}>
              <div data-wf-el='previous-event_content_wrap' style={{ display: 'flex', height: '346.828px', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: '24px' }}>
                <div data-wf-el='previous-event_content_headers'>
                  <h2 className='section-title text-brand-bg'>Latest Community Call</h2>
                  <p className='text-[16px] leading-[22.4px] text-brand-bg' style={{ margin: 0 }}>{LATEST_COMMUNITY_CALL.description}</p>
                </div>
                <div data-wf-el='previous-event_content_meta' style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', columnGap: '32px', rowGap: '16px' }}>
                  <MetadataItem type='calendar' tone='light'>{LATEST_COMMUNITY_CALL.date}</MetadataItem>
                  <MetadataItem type='clock' tone='light'>{LATEST_COMMUNITY_CALL.duration}</MetadataItem>
                </div>
                <OverlayLinkButton
                  href={LATEST_COMMUNITY_CALL.videoUrl}
                  label='Watch on YouTube'
                  variant='lightbrown'
                  wfEl='button'
                  textWfEl='btn-text'
                  linkWfEl='lightbrown-5'
                />
              </div>
            </div>
            <div className='col col-md-12' style={{ display: 'flex', flexDirection: 'column', position: 'relative', width: '631px', padding: '0px 12px' }}>
              <div className='w-embed w-iframe' style={{ width: '607px', height: '346.828px' }}>
                <iframe
                  title='Latest OpenHands community call'
                  src={LATEST_COMMUNITY_CALL.embedUrl}
                  className='h-full w-full border-0'
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                  referrerPolicy='strict-origin-when-cross-origin'
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-wf-el='section' id='events' style={{ height: '1804.62px', padding: '80px 0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ height: '1644.62px' }}>
          <h2 className='section-title text-center text-brand-fg' style={{ marginBottom: '66px' }}>
            Upcoming Events
          </h2>

          <div data-wf-el='events-list_cms_list' className='grid grid-cols-3' style={{ gap: '16px', height: '1436.66px' }}>
            {EVENTS.map((event) => (
              <a
                key={event.title}
                href={event.href}
                target='_blank'
                rel='noopener noreferrer'
                data-wf-el='contribution_card_link'
                className='relative flex flex-col overflow-hidden rounded-[8px] border border-[#b3a88c] bg-transparent transition-transform hover:-translate-y-0.5'
                style={{ height: '1436.66px', maxWidth: '100%', justifyContent: 'flex-start' }}
              >
                <div data-wf-el='card-body' style={{ position: 'relative', display: 'block', height: '1434.66px', padding: '24px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <div data-wf-el='events-list_card_content' style={{ display: 'flex', height: '1386.66px', flexDirection: 'column', gap: '24px' }}>
                    <div data-wf-el='events-list_card_content_top' style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h2 className='fluid-h4 leading-[1.4] text-brand-fg' style={{ marginBottom: '0px' }}>
                        <span style={event.titleScale ? { display: 'inline-block', transform: `scaleX(${event.titleScale})`, transformOrigin: 'left center' } : undefined}>{event.title}</span>
                      </h2>
                      <p className='text-[16px] leading-[22.4px] text-brand-muted' style={{ margin: 0, height: event.descriptionHeight }}>
                        {event.description}
                      </p>
                    </div>
                    <div data-wf-el='previous-event_content_meta' style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', columnGap: '32px', rowGap: '16px', marginTop: 'auto' }}>
                      <MetadataItem type='calendar' tone='dark'><EventDate startsAt={event.startsAt} fallback={event.date} /></MetadataItem>
                      <MetadataItem type='clock' tone='dark'><EventTime startsAt={event.startsAt} fallback={event.time} /></MetadataItem>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div data-wf-el='events_button_wrap' className='flex justify-center items-center' style={{ marginTop: '32px' }}>
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

      <section data-wf-el='section' className='bg-brand-fg text-brand-bg' style={{ height: '582.484px', padding: '80px 0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ height: '422.484px' }}>
          <div data-wf-el='heading-stack' className='flex flex-col items-center text-center' style={{ marginBottom: '24px', justifyContent: 'flex-start' }}>
            <h2 className='section-title text-brand-bg'>Start contributing</h2>
            <p data-wf-el='paragraph-lg' className='fluid-body-lg text-brand-bg' style={{ marginTop: '0px', marginBottom: '20.8px' }}>
              Join our mission to build better AI development tools
            </p>
          </div>

          <div data-wf-el='community-contributing_cards_wrap' className='grid grid-cols-3' style={{ gap: '24px', height: '295.547px' }}>
            {CONTRIBUTION_PATHS.map((path) => (
              <article
                key={path.title}
                data-wf-el='community-contributing_cards_card'
                className='relative flex flex-col overflow-hidden rounded-[8px] border border-[#b3a88c] bg-transparent'
                style={{ height: '295.547px', justifyContent: 'flex-start', textAlign: 'start' }}
              >
                <div data-wf-el='card-body' className='flex flex-col items-center justify-center p-6 text-center' style={{ position: 'relative', height: '293.547px', gap: '24px' }}>
                  <img data-wf-el='community-contributing_cards_icon' src={path.icon} alt='' className='h-12 w-12' />
                  <div style={{ width: path.textWidth, minHeight: path.minTextHeight }}>
                    <h3 className='fluid-h4 text-brand-bg' style={{ marginBottom: '9.6px' }}><span style={path.titleScale ? { display: 'inline-block', transform: `scaleX(${path.titleScale})`, transformOrigin: 'center' } : undefined}>{path.title}</span></h3>
                    <p className='text-[16px] leading-[22.4px] text-brand-bg' style={{ margin: '0 auto', width: path.descriptionWidth }}><span style={{ display: 'inline-block', transform: `scaleX(${path.descriptionScale})`, transformOrigin: 'center' }}>{path.description}</span></p>
                  </div>
                  <div>
                    <OverlayLinkButton
                      href={path.href}
                      label={path.cta}
                      variant='lightbrown'
                      wfEl='button'
                      textWfEl='btn-text'
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-wf-el='section' style={{ height: '437.562px', padding: '80px 0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ height: '277.562px' }}>
          <div data-wf-el='slot' className='cc-section flex flex-col items-stretch'>
            <div data-wf-el='lovewall_wrap'>
              <div data-wf-el='lovewall_heading_wrap' className='text-center' style={{ marginBottom: '48px' }}>
                <div data-wf-el='heading-component'>
                  <h2 className='section-title text-brand-fg'><span style={{ display: 'inline-block', transform: 'scaleX(1.0016)', transformOrigin: 'center' }}>Recognizing first-time contributors</span></h2>
                </div>
              </div>
              <div data-wf-el='contributions_list' className='grid grid-cols-4' style={{ gap: '24px', height: '181.172px' }}>
                {FIRST_TIME_CONTRIBUTORS.map((contributor) => (
                  <a
                    key={contributor.name}
                    href={contributor.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    data-wf-el='contribution_card_link'
                    className='relative flex flex-col overflow-hidden rounded-[8px] border border-[#b3a88c] p-0 text-left text-brand-fg'
                    style={{ height: '181.172px', maxWidth: '100%', justifyContent: 'flex-start' }}
                  >
                    <div data-wf-el='card-body' style={{ position: 'relative', display: 'block', height: '179.172px', padding: '24px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                      <div data-wf-el='lovewall_cms_item_top' className='flex items-center justify-start' style={{ gap: '12px', marginBottom: '16px' }}>
                        <img
                          data-wf-el='lovewall_cms_item_avatar'
                          src={contributor.avatar}
                          alt={contributor.name}
                          className='h-12 w-12 object-cover'
                          style={{ borderRadius: '100%', aspectRatio: '1 / 1' }}
                        />
                        <div data-wf-el='lovewall_cms_item_top_meta'>
                          <div data-wf-el='lovewall_cms_item_top_name' className='text-[14.08px] leading-[19.712px]'>{contributor.name}</div>
                        </div>
                      </div>
                      <p className='text-[16px] font-normal leading-[22.4px] text-brand-fg' style={{ margin: 0, width: '241.5px' }}>
                        {contributor.title}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-wf-el='section' style={{ height: '706.344px', padding: '80px 0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ height: '546.344px' }}>
          <div data-wf-el='slot' className='cc-section flex flex-col items-stretch'>
            <div data-wf-el='lovewall_wrap'>
              <div data-wf-el='lovewall_heading_wrap' className='text-center' style={{ marginBottom: '48px' }}>
                <div data-wf-el='heading-component'>
                  <h2 className='section-title text-brand-fg'>Community contributor spotlight</h2>
                </div>
              </div>
              <div data-wf-el='card' className='relative flex flex-col overflow-hidden rounded-[8px] border border-[#b3a88c]' style={{ height: '449.953px', justifyContent: 'flex-start' }}>
                <div data-wf-el='community-contributor_card_body' className='flex flex-col items-center justify-center p-8 text-center' style={{ height: '447.953px', gap: '24px', position: 'relative' }}>
                  <img
                    data-wf-el='community-contributor_card_img'
                    src={MICHAEL_MAY_IMAGE}
                    alt=''
                    className='img-block h-24 w-24'
                    style={{ borderRadius: '100%', objectFit: 'fill', aspectRatio: '1 / 1' }}
                  />
                  <div data-wf-el='community-contributor_card_info'>
                    <h3 className='fluid-h3 text-brand-fg'>Michael May</h3>
                  </div>
                  <p data-wf-el='community-contributor_card_p' className='max-w-[910px] text-[24px] font-medium leading-[33.6px] text-brand-fg' style={{ marginTop: 0, marginBottom: '24px' }}>
                    “My team uses OpenHands for all our development tasks and we have found that it is hands-down better than Claude Code, cursor, Codex, and every other hot agentic DevTool out there. The caliber of the team at OpenHands and the caliber of the community they’ve curated is second to none, and this is evidenced by the quality of their product and the trajectory of their growth.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer
        standalone
        showSocialLinks
        compactNav
        compactNavSpacerHeight={10.36}
        showCopyright
        marketingCtaPrimary={DEFAULT_FOOTER_PRIMARY}
        marketingCtaSecondary={DEFAULT_FOOTER_SECONDARY}
      />
    </main>
  );
};

export default Community;
