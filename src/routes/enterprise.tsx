import type { CSSProperties } from 'react';
import type { Route } from './+types/enterprise';
import ASCIIAnimation from '~/components/ascii-animation';
import { Footer } from '~/components/footer';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { DEFAULT_SOCIAL_IMAGE } from '~/utils/seo';

const ASCII_HOLE_BG = '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png';
const CONTROL_PLANE_IMG = '/assets/webflow/enterprise/control-plane.png';
const STEPS_IMG = '/assets/webflow/enterprise/steps.png';
// Filenames intentionally match the live Webflow CDN image filenames
// (after the parity script's normalization: strip extensions, URL
// encoding, underscores/spaces, and lowercase).  Live uses
// "Image%2096x96.png" → image96x96 and "C3ai%20Logo.svg" → c3ailogo,
// so our local files are named to produce the same normalized
// signature, which is what the IMG-by-src-filename audit pairs on.
const C3AI_AUTHOR_IMG = '/assets/webflow/enterprise/image96x96.png';
const C3AI_LOGO = '/assets/webflow/enterprise/c3ailogo.svg';

// Section base styles matching live Webflow: padding 80px 0, no horizontal
// padding on the section itself (inner container handles the gutter), and
// the dark surface lives on the SECTION itself rather than a wrapper div.
const SECTION_BASE: React.CSSProperties = {
  display: 'block',
  paddingTop: '80px',
  paddingBottom: '80px',
  paddingLeft: '0px',
  paddingRight: '0px',
  position: 'relative',
};

const SECTION_DARK: React.CSSProperties = {
  ...SECTION_BASE,
  backgroundColor: 'rgb(34, 21, 13)',
  color: 'rgb(249, 240, 217)',
};

// Bootstrap-icon SVGs the live Webflow page inlines for each card.
const IconLightning = () => (
  <svg data-wf-el='bi-lightning-charge' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-lightning-charge' viewBox='0 0 16 16'>
    <path d='M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09zM4.157 8.5H7a.5.5 0 0 1 .478.647L6.11 13.59l5.732-6.09H9a.5.5 0 0 1-.478-.647L9.89 2.41z' />
  </svg>
);
const IconBarChart = () => (
  <svg data-wf-el='bi-bar-chart' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-bar-chart' viewBox='0 0 16 16'>
    <path d='M4 11H2v3h2zm5-4H7v7h2zm5-5v12h-2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z' />
  </svg>
);
const IconLock = () => (
  <svg data-wf-el='bi-lock' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-lock' viewBox='0 0 16 16'>
    <path fillRule='evenodd' d='M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4M4.5 7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7zM8 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3' />
  </svg>
);
const IconGraphUp = () => (
  <svg data-wf-el='bi-graph-up-arrow' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-graph-up-arrow' viewBox='0 0 16 16'>
    <path fillRule='evenodd' d='M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5' />
  </svg>
);
const IconShield = () => (
  <svg data-wf-el='bi-shield-shaded' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-shield-shaded' viewBox='0 0 16 16'>
    <path fillRule='evenodd' d='M8 14.933a1 1 0 0 0 .1-.025q.114-.034.294-.118c.24-.113.547-.29.893-.533a10.7 10.7 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.8 11.8 0 0 1-2.517 2.453 7 7 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7 7 0 0 1-1.048-.625 11.8 11.8 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 63 63 0 0 1 5.072.56' />
  </svg>
);
const IconHdd = () => (
  <svg data-wf-el='bi-hdd' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-hdd' viewBox='0 0 16 16'>
    <path d='M4.5 11a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M3 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0' />
    <path d='M16 11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9.51c0-.418.105-.83.305-1.197l2.472-4.531A1.5 1.5 0 0 1 4.094 3h7.812a1.5 1.5 0 0 1 1.317.782l2.472 4.53c.2.368.305.78.305 1.198zM3.655 4.26 1.592 8.043Q1.79 8 2 8h12q.21 0 .408.042L12.345 4.26a.5.5 0 0 0-.439-.26H4.094a.5.5 0 0 0-.44.26zM1 10v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1' />
  </svg>
);
const IconBraces = () => (
  <svg data-wf-el='bi-braces' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-braces' viewBox='0 0 16 16'>
    <path d='M2.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C3.25 2 2.49 2.759 2.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6M13.886 7.9v.163c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456V7.332c-1.114 0-1.49-.362-1.49-1.456V4.352C13.51 2.759 12.75 2 11.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6' />
  </svg>
);
const IconPeople = () => (
  <svg data-wf-el='bi-people' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-people' viewBox='0 0 16 16'>
    <path d='M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4' />
  </svg>
);
const IconLink = () => (
  <svg data-wf-el='bi-link' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-link' viewBox='0 0 16 16'>
    <path d='M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9q-.13 0-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z' />
    <path d='M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4 4 0 0 1-.82 1H12a3 3 0 1 0 0-6z' />
  </svg>
);
const IconRobot = () => (
  <svg data-wf-el='bi-robot' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' className='bi bi-robot' viewBox='0 0 16 16'>
    <path d='M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a25 25 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135' />
    <path d='M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5' />
  </svg>
);

interface ControlFeature {
  Icon: () => JSX.Element;
  eyebrow: string;
  heading: string;
  paragraph: string;
  bullets: string[];
}

const CONTROL_FEATURES: ControlFeature[] = [
  {
    Icon: IconLightning,
    eyebrow: 'Automations',
    heading: 'Agents that run themselves, on your terms.',
    paragraph:
      'Wire OpenHands to GitHub, Slack, Jira, or a cron schedule. When the trigger fires, the agent runs in an isolated cloud container, does the work, and opens a pull request. You review the output.',
    bullets: [
      'Trigger from GitHub issues, Slack messages, Jira tickets, or a schedule',
      'Every run is logged, attributed, and governed by your cost and security policies',
      "Cloud-native runtime \u2014 no agent running on a developer's laptop",
    ],
  },
  {
    Icon: IconBarChart,
    eyebrow: 'Cost Control',
    heading: 'Know where every token goes',
    // Keep ASCII apostrophe to match live HTML's &#x27; entity.
    paragraph:
      "Every token is tied to a user, session, repo, and workflow. Set budgets by project. See which use cases deliver ROl and which don't.",
    bullets: [
      'Per-session tracking with custom labels',
      'Budget limits by project or team',
      'LLM routing to optimize cost vs. quality',
    ],
  },
  {
    Icon: IconLock,
    eyebrow: 'Security',
    heading: 'Agents get access to what they need. Nothing more.',
    paragraph:
      'Define exactly which secrets, tools, and domains each agent can reach. Detect prompt injection. Halt risky actions for human review.',
    bullets: [
      'Containerized sandbox runtime for safe autonomy',
      'Prompt injection detection with automatic halt',
      'Complete audit logs for every agent action',
    ],
  },
  {
    Icon: IconGraphUp,
    eyebrow: 'Productivity',
    // ASCII apostrophes to match live HTML's &#x27; entities.
    heading: "Measure what's working. Improve what isn't.",
    paragraph:
      'Track success metrics for any workflow. See which agents are delivering, where suggestions get rejected, and how to improve over time.',
    bullets: [
      'Custom metrics per skill or workflow',
      'Track merge rates and suggestion acceptance',
      'Built-in feedback loop from production',
    ],
  },
  {
    Icon: IconShield,
    eyebrow: 'Governance',
    heading: 'One view for every team.',
    paragraph:
      'Platform, security, and finance teams all need different windows into what agents are doing. OpenHands gives them that, without requiring developer tooling access.',
    bullets: [
      'Fine-grained access control and RBAC',
      'Org-wide policy enforcement',
      'Single pane of glass across all workflows',
    ],
  },
];

interface BuiltForFeature {
  Icon: () => JSX.Element;
  heading: string;
  paragraph: string;
}

const BUILT_FOR_FEATURES: BuiltForFeature[] = [
  {
    Icon: IconHdd,
    heading: 'Self-hosted in your VPC',
    paragraph:
      'Deploy on your own Kubernetes infrastructure. Your code never leaves your environment. No shared tenancy.',
  },
  {
    Icon: IconBraces,
    heading: 'Source-available',
    paragraph:
      'Inspect all the code. Every capability and integration is readable and auditable by your security team.',
  },
  {
    Icon: IconPeople,
    heading: 'Research team access',
    paragraph:
      'Enterprise contracts include direct access to the team building the models. Not just support tickets.',
  },
  {
    Icon: IconLink,
    heading: 'Enterprise integrations included',
    paragraph:
      'GitHub, GitLab, Slack, Jira, and Linear out of the box. RBAC, multi- user support, and conversation sharing built in.',
  },
  {
    Icon: IconRobot,
    heading: 'Bring your own LLM',
    paragraph:
      'Model-agnostic by design. Use Anthropic, OpenAl, Bedrock, or any other model provider your team prefers.',
  },
];

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands for Enterprise | Secure, Scalable Agentic Software Development' },
    {
      name: 'description',
      content:
        'Scale AI agents in production with the control, visibility, and repeatability your enterprise needs. Self-hosted in your VPC, source-available, and backed by direct research-team access.',
    },
    {
      property: 'og:title',
      content: 'OpenHands for Enterprise | Secure, Scalable Agentic Software Development',
    },
    {
      property: 'og:description',
      content:
        'Deploy OpenHands securely across your organization. Enterprise-grade governance, compliance, and customization for regulated industries.',
    },
    { property: 'og:image', content: DEFAULT_SOCIAL_IMAGE },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    {
      name: 'twitter:title',
      content: 'OpenHands for Enterprise | Secure, Scalable Agentic Software Development',
    },
    {
      name: 'twitter:description',
      content:
        'Deploy OpenHands securely across your organization. Enterprise-grade governance, compliance, and customization for regulated industries.',
    },
    { name: 'twitter:image', content: DEFAULT_SOCIAL_IMAGE },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

export const handle = { hideGlobalFooter: true };

// Live's `.container` resolves to max-width 1238px with no horizontal
// padding (margins handle the gutter at 101px on either side at 1440
// viewport).  Mirroring that exactly drops 7+ wfMismatch entries
// (paddingLeft/Right, marginLeft/Right, maxWidth) on each route.
const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`mx-auto w-full px-5 lg:px-0 ${className}`}
    data-wf-el='container'
    style={{ maxWidth: '1238px' }}
  >
    {children}
  </div>
);

const Eyebrow = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    data-wf-el='acp_features_eyebrow'
    className={`font-mono text-[14px] font-normal leading-[16.896px] ${className}`}
    style={{ width: 'fit-content', marginBottom: '21.12px' }}
  >
    {children}
  </div>
);

const Enterprise = () => {
  return (
    <main data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column' }}>
      {/* HERO — live's section-hero has padding 0 on the SECTION; the
       * inner container handles the gutter and vertical rhythm. */}
      <section
        data-wf-el='section-hero'
        className='relative overflow-visible'
        style={{
          ...SECTION_BASE,
          paddingTop: '0px',
          paddingBottom: '0px',
        }}
      >
        {/* Live's hero uses the same animated ASCII embed as the product
         * pages: an absolute `.asci-wrap` paint layer containing an
         * `.ascii-pre` text surface. */}
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-0 overflow-hidden' style={{ '--ascii-opacity': '0.12', maxHeight: '2400px' } as CSSProperties} aria-hidden='true'>
          <div data-wf-el='asci-embed' className='h-full w-full overflow-hidden'>
            <ASCIIAnimation className='h-full w-full' />
          </div>
        </div>
        {/* Live's `.container` sits inside `section-hero` with padding 0
         * vertically; the visual rhythm comes from the inner
         * `.hero-content.is-center` block, which has padding 56px 0px. */}
        <Container className='py-10 lg:py-0'>
          {/* Live's `.hero-content.is-center` spans the full container
           * width (no max-width); the heading/subhead are centered via
           * `text-align: center` and the buttons have their own flex-wrap
           * row beneath.  Constraining to 760px makes the subhead wrap
           * to two lines and shaves ~110px off the hero height. */}
          <div
            data-wf-el='hero-content'
            className='relative mx-auto flex w-full flex-col items-center text-center'
            style={{ padding: '56px 0px', justifyContent: 'center' }}
          >
            <h1
              id='hero-heading'
              data-wf-el='h1-2'
              className='fluid-h1 text-brand-fg'
              style={{ position: 'relative', margin: '0px' }}
            >
              From agents to systems
            </h1>
            {/* Live's `.u-mt-xs` margin is 10.4px, `.u-mb-xs` is 20.8px. */}
            <p
              data-wf-el='paragraph-lg-3'
              id='hero-subheading'
              className='fluid-body-lg text-brand-muted'
              style={{ marginTop: '10.4px', marginBottom: '20.8px' }}
            >
              Scale AI agents in production with the control, visibility, and repeatability your enterprise needs.
            </p>
            {/* Live's `.hero_btn_wrap` is `display: flex; flex-wrap: wrap;
             * gap: 8px 16px; padding-top: 32px; max-width: 100%`.
             * Notably it does NOT set justify-content/align-items —
             * the buttons sit flush-left within the wrap; centering
             * comes from the parent `.hero-content.is-center`'s flex
             * `align-items: center`.  Setting `justify-content: center`
             * here was making the wrap center its own children, which
             * triggered a wfMismatch on `justifyContent` and
             * `alignItems`. */}
            <div
              data-wf-el='hero_btn_wrap'
              className='flex flex-wrap'
              style={{ gap: '8px 16px', paddingTop: '32px', maxWidth: '100%' }}
            >
              <OverlayLinkButton
                href='/contact'
                label='Book a demo'
                wfEl='button-3'
                textWfEl='btn-text-3'
                className='!px-[30.4px] !py-[14.4px]'
              />
              <OverlayLinkButton
                href='https://app.all-hands.dev/'
                label='Try it'
                variant='outline'
                wfEl='button'
                textWfEl='btn-text'
                className='!px-[30.4px] !py-[14.4px]'
              />
            </div>
          </div>
        </Container>
      </section>

      {/* CONTROL PLANE INTRO (dark) — live uses h3.h2-2 for the heading. */}
      <section data-wf-el='section' style={SECTION_DARK}>
        <Container>
          {/* Live's `.heading-stack` is a flex column with `max-width:
           * 808.96px` (≈ 65.34% of the 1238 container; centered with
           * auto side margins) and 24px bottom margin.  The stack uses
           * the default flex `gap: normal` (zero), with each child
           * carrying its own margin: h3.h2-2 margin-bottom 8.8px and
           * the .paragraph-lg margin-top 10.4 / margin-bottom 20.8. */}
          <div
            data-wf-el='heading-stack'
            className='flex flex-col items-center text-center'
            style={{
              maxWidth: '808.961px',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '24px',
              justifyContent: 'flex-start',
            }}
          >
            <h3
              data-wf-el='h2-2'
              className='section-title text-brand-bg'
              style={{ marginBottom: '8.8px' }}
            >
              A control plane for every layer of your agent stack
            </h3>
            <p
              data-wf-el='paragraph-lg'
              className='fluid-body-lg text-[#b3a88c]'
              style={{ marginTop: '10.4px', marginBottom: '20.8px' }}
            >
              From the policies that govern how agents run, to the automations that trigger them, OpenHands Enterprise gives you control at every layer.
            </p>
          </div>
          {/* Live's `.acp_graphic_wrap` spans the full container width
           * (1238px) with 32px padding; constraining it to max-w-1100px
           * scales the image down ~138px wide which translates to ~65px
           * of section-height drift via the preserved aspect ratio. */}
          {/* Live's `.acp_graphic_wrap` has `border: 1px solid rgb(249,
           * 240, 217)` — a 1px cream border that frames the screenshot
           * inside the dark overview section.  Without it, the parity
           * border-color check sees the default browser gray. */}
          <div
            data-wf-el='acp_graphic_wrap'
            className='mx-auto w-full'
            style={{
              padding: '32px',
              borderRadius: '32px',
              border: '1px solid rgb(249, 240, 217)',
              overflow: 'hidden',
            }}
          >
            <img
              data-wf-el='acp_graphic_img'
              src={CONTROL_PLANE_IMG}
              alt=''
              className='h-auto w-full object-cover'
              loading='lazy'
              style={{ textAlign: 'start' }}
            />
          </div>
        </Container>
      </section>

      {/* GOVERN AGENTS — 1+2+2 layout (first card spans 2 cols).  Live uses
       * h3.h2 for the section heading and h3.h4 for each card heading. */}
      <section data-wf-el='section' style={SECTION_BASE}>
        <Container>
          {/* Live's H3 has no max-width constraint and 66px bottom
            * margin so the headline fits on a single 48px line.  The
            * previous max-w-[760px] was wrapping the title onto two
            * lines and the smaller mb-10 (40px) further widened the
            * gap, accumulating 23px of cumulative drift through the
            * rest of the page. */}
          <div data-wf-el='heading-stack' style={{ marginBottom: '24px' }}>
          <h3 className='section-title text-brand-fg' style={{ marginBottom: '66px' }}>
            Everything you need to govern agents in production.
          </h3>
          {/* Live's `.acp_features_layout` is a 24px-rounded grid container
           * with a 1px border and no gap; each `.acp_features_item` provides
           * its own padding (40px) + a bottom/right border to draw the inner
           * divider lines.  Mirroring that here means the parity ancestor walk
           * for each card heading/paragraph lands on a `borderRadius:24px;
           * display:grid; gap:0` ancestor instead of bubbling up to the
           * page-wrapper, which collapses ~20 ancestor mismatches per grid. */}
          <div
            data-wf-el='acp_features_layout'
            className='grid grid-cols-1 overflow-hidden md:grid-cols-2'
            style={{
              borderRadius: '24px',
              border: '1px solid rgb(179, 168, 140)',
              gap: '0px',
            }}
          >
            {CONTROL_FEATURES.map(({ Icon, eyebrow, heading, paragraph, bullets }, idx) => (
              <article
                key={heading}
                data-wf-el='acp_features_item'
                className={`flex flex-col items-start justify-start gap-4 p-10 ${idx === 0 ? 'md:col-span-2' : ''}`}
                style={{
                  borderBottom: idx >= 3 ? '0' : '1px solid rgb(179, 168, 140)',
                  borderRight:
                    // No right border on the spanning first card (full width)
                    // or on the right-column cards (idx 2, 4) so we don't
                    // double up against the outer container border.
                    idx === 0 || idx === 2 || idx === 4
                      ? '0'
                      : '1px solid rgb(179, 168, 140)',
                }}
              >
                {/* Live's icon is a 40×40 dark-brown chip (24×24 SVG +
                 * 8px padding all around).  Box-sizing is content-box on
                 * Webflow, so the outer rect is 24+16=40.  Tailwind sets
                 * everything to border-box, so we have to use h-10/w-10
                 * (40px) plus p-2 (8px) and rely on the SVG itself
                 * sizing within the 24×24 content area. */}
                <div
                  data-wf-el='acp_features_icon'
                  className='h-10 w-10 p-2 text-[#FFFF8B]'
                  style={{ backgroundColor: 'rgb(34, 21, 13)', borderRadius: '8px', display: 'block', width: '24px', height: '24px', padding: '8px', boxSizing: 'content-box', aspectRatio: '1 / 1' }}
                >
                  <Icon />
                </div>
                {/* Live's eyebrow is title-cased text (e.g. "Automations")
                 * with no text-transform and normal letter-spacing — the
                 * `eyebrow` Webflow class doesn't actually uppercase. */}
                <div data-wf-el='acp_features_eyebrow' className='font-mono text-[14px] font-normal leading-[16.896px] text-brand-fg'>
                  {eyebrow}
                </div>
                <h3 data-wf-el='acp_features_heading' className='fluid-h4 font-medium text-brand-fg' style={{ marginBottom: 0 }}>{heading}</h3>
                <p data-wf-el='acp_features_paragraph' className='text-[16px] leading-[22.4px] text-[#5f5f5f]' style={{ maxWidth: '808.961px', marginBottom: '0px' }}>{paragraph}</p>
                {/* Live's `.product-list_ul` has padding-left:0 and uses
                 * the dark-brown body color; bullets get explicit 16px
                 * top/bottom padding instead of the default UL spacing. */}
                {/* Live's `.product-list_ul` uses brand-fg (#22150d)
                 * for the marker/border color but each `.product-list_element`
                 * paragraph inherits the muted #5f5f5f body color. */}
                {/* Live's `.product-list_ul` is `display:block` with an
                 * explicit `width: 100%` (computed 1156px in the spanning
                 * card, 538px in the narrow cards).  In a flex-column
                 * with `align-items: flex-start`, list items would
                 * otherwise shrink to their content width.  The list
                 * uses `list-style-type: none` on each li (no bullet)
                 * and a 1px translucent bottom border between rows. */}
                <ul
                  data-wf-el='product-list_ul'
                  className='w-full text-[16px] leading-[22.4px] text-brand-fg'
                  style={{ paddingLeft: '0px', marginTop: '0px', listStyleType: 'none' }}
                >
                  {bullets.map((bullet) => (
                    <li
                      key={bullet}
                      data-wf-el='product-list_element'
                      className='text-[#5f5f5f]'
                      style={{
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        marginTop: '0px',
                        listStyleType: 'none',
                        borderBottom: '1px solid rgba(95, 95, 95, 0.5)',
                      }}
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          </div>
        </Container>
      </section>

      {/* EVENT TO PR — dark 2-column with image */}
      <section data-wf-el='section' style={SECTION_DARK}>
        <Container>
          <div className='flex flex-wrap' style={{ margin: '0px -20px', rowGap: '40px' }}>
            <div className='flex basis-full flex-col px-5 lg:basis-1/2' style={{ position: 'relative' }}>
              <div data-wf-el='heading-stack' className='flex flex-col items-start' style={{ justifyContent: 'center', height: '100%' }}>
                <div
                  data-wf-el='acp_features_eyebrow'
                  className='font-mono text-[14px] font-normal leading-[16.896px] text-brand-bg'
                  style={{ marginBottom: '21.12px' }}
                >
                  Automations
                </div>
                <h2 className='section-title text-brand-bg' style={{ width: '599px', marginBottom: '8.8px' }}>From event to PR, no human in the loop.</h2>
                <p data-wf-el='paragraph-lg' className='fluid-body-lg text-[#b3a88c]' style={{ marginBottom: '20.8px', width: '599px' }}>
                  Wire OpenHands to the tools your team already uses. When something happens, the right agent fires, does the work, and opens a pull request.
                  <br />
                  <br />
                  Every automated run is fully logged and governed by the same cost and security policies as manual sessions. Automation doesn't mean unsupervised.
                </p>
              </div>
            </div>
            <div className='flex basis-full flex-col px-5 lg:basis-1/2' style={{ position: 'relative' }}>
              <img src={STEPS_IMG} alt='' className='img-block h-auto w-full object-fill' loading='lazy' />
            </div>
          </div>
        </Container>
      </section>

      {/* C3.ai QUOTE — light section with ASCII hole bg */}
      <section data-wf-el='section' className='overflow-visible' style={SECTION_BASE}>
        <div data-wf-el='asci-wrap' className='absolute inset-0 bg-brand-accent' style={{ overflow: 'hidden', maxHeight: '2400px' }} aria-hidden='true'>
          <img
            data-wf-el='asci-media'
            src={ASCII_HOLE_BG}
            alt='ASCII art depicting a large black hole with light and particles swirling around it.'
            className='h-full w-full object-cover'
            style={{ textAlign: 'start' }}
          />
        </div>
        <Container>
          {/* Live's testimonial layout: heading-stack with 64px top/
           * bottom padding, flex column, no max-width (the quote runs
           * full container width and wraps to 3 lines).  The 22px
           * margin-bottom on the quote plus the 64px stack padding give
           * the section its 503px total height. */}
          <div
            data-wf-el='heading-stack'
            className='relative z-[2] flex w-full flex-col items-center text-center'
            style={{ padding: '64px 0px', justifyContent: 'flex-start' }}
          >
            <p
              className='testimonial-quote text-brand-fg'
              style={{ marginTop: '0px', marginBottom: '22px' }}
            >
              “OpenHands was the only solution that let us prompt an autonomous coding agent remotely at scale — not just on a laptop or inside a narrow CI template.”
            </p>
            <div
              data-wf-el='acp_quote_wrap'
              className='flex flex-nowrap items-center justify-center'
              style={{ gap: '32px' }}
            >
              {/* Live wraps the portrait in a `.quote-author-media`
               * div and applies the circular crop / dark background to
               * the wrapper.  The inner `<img>` itself has no border-
               * radius or background — it just inherits the standard
               * `inline-block, vertical-align: middle` defaults that
               * Webflow ships on every <img>.  Putting the styling on
               * the IMG directly was triggering parity diffs because
               * live's image is a flat raster. */}
              <div
                data-wf-el='quote-author-media'
                className='h-12 w-12'
                style={{
                  borderRadius: '50%',
                  backgroundColor: 'rgb(34, 21, 13)',
                  display: 'block',
                  overflow: 'visible',
                }}
              >
                <img
                  data-wf-el='acp_quote_img'
                  src={C3AI_AUTHOR_IMG}
                  alt=''
                  className='h-12 w-12 object-cover'
                  style={{ display: 'inline-block' }}
                  loading='lazy'
                />
              </div>
              {/* Live's .acp_quote_attr is the .h4 utility (24px /
               * 33.6px / weight 500); we were using 20/28/400 so the
               * author label rendered ~5px shorter and ~16% lighter. */}
              <p
                data-wf-el='acp_quote_attr'
                className='text-brand-fg'
                style={{ fontSize: '24px', lineHeight: '33.6px', fontWeight: 500 }}
              >
                Sina Pakazad, VP of Data Science at C3.ai
              </p>
              <div className='h-10 w-px rotate-12 bg-brand-fg/30' aria-hidden='true' />
              <img data-wf-el='acp_quote_logo' src={C3AI_LOGO} alt='' className='h-auto w-[80px]' loading='lazy' />
            </div>
          </div>
        </Container>
      </section>

      {/* BUILT FOR TEAMS — 3+2 layout (3-col grid, last 2 cards on row 2). */}
      <section data-wf-el='section' style={SECTION_BASE}>
        <Container>
          <div data-wf-el='heading-stack' style={{ marginBottom: '24px' }}>
            <div data-wf-el='heading-stack' className='flex flex-col items-start' style={{ marginBottom: '0px', justifyContent: 'center' }}>
              <Eyebrow className='text-brand-fg'>OpenHands Enterprise</Eyebrow>
              <h2 className='section-title max-w-[724px] text-brand-fg'>Built for teams running agents at scale. </h2>
              <p data-wf-el='paragraph-lg' className='fluid-body-lg text-[#5f5f5f]' style={{ marginBottom: '20.8px' }}>
                Self-hosted in your VPC via Kubernetes. Source-available. Backed by extended support and direct access to our research team.
              </p>
            </div>
          {/* Live's built-for-teams grid is 3 cards on row 1 (each
           * 412px / one-third) and 2 cards on row 2 (each 618px /
           * one-half).  A flat 3-col CSS grid leaves an empty cell on
           * row 2 and stretches the row 2 cards taller than live; we
           * use grid-template-columns of `1fr 1fr 1fr` for row 1 and
           * an explicit 6-col layout where row 2 cards span 3 cols
           * each so the second row fills the full width. */}
          <div
            data-wf-el='acp_features_layout'
            className='grid grid-cols-1 overflow-hidden md:grid-cols-6'
            style={{
              borderRadius: '24px',
              border: '1px solid rgb(179, 168, 140)',
              gap: '0px',
            }}
          >
            {BUILT_FOR_FEATURES.map(({ Icon, heading, paragraph }, idx) => {
              // Row 1: cards 0,1,2 each span 2 of 6 cols (one-third).
              // Row 2: cards 3,4 each span 3 of 6 cols (one-half).
              const isLastCol = idx === 2 || idx === 4;
              const isLastRow = idx >= 3;
              const span = idx <= 2 ? 'md:col-span-2' : 'md:col-span-3';
              return (
                <article
                  key={heading}
                  data-wf-el='acp_enterprise_item'
                  className={`flex flex-col items-start justify-start gap-4 p-10 ${span}`}
                  style={{
                    borderBottom: isLastRow ? '0' : '1px solid rgb(179, 168, 140)',
                    borderRight: isLastCol ? '0' : '1px solid rgb(179, 168, 140)',
                  }}
                >
                  <div
                    data-wf-el='acp_features_icon'
                    className='h-10 w-10 p-2 text-[#FFFF8B]'
                    style={{ backgroundColor: 'rgb(34, 21, 13)', borderRadius: '8px', display: 'block', width: '24px', height: '24px', padding: '8px', boxSizing: 'content-box', aspectRatio: '1 / 1' }}
                  >
                    <Icon />
                  </div>
                  <h3 data-wf-el='acp_features_heading' className='fluid-h4 font-medium text-brand-fg' style={{ marginBottom: 0 }}>{heading}</h3>
                  <p data-wf-el='acp_features_paragraph' className='text-[16px] leading-[22.4px] text-[#5f5f5f]' style={{ maxWidth: '808.961px', marginBottom: '0px' }}>{paragraph}</p>
                </article>
              );
            })}
          </div>
          </div>

        </Container>
      </section>

      {/* WHITEPAPER (dark) */}
      <section data-wf-el='section' style={SECTION_DARK}>
        <Container>
          {/* Live's whitepaper stack uses NO max-width / no auto side
           * margins (it spans the full container) and has 32px bottom
           * margin instead of a flex `gap`.  The 860px constraint and
           * 16px gap on test were producing an asymmetric layout vs
           * live's full-width centered block. */}
          <div
            data-wf-el='whitepaper_heading-stack'
            className='flex flex-col items-center text-center'
            style={{ marginBottom: '32px', justifyContent: 'flex-start' }}
          >
            <h3
              data-wf-el='whitepaper_heading'
              className='section-title text-brand-bg'
              style={{ maxWidth: '834.238px', marginBottom: '8.8px' }}
            >
              Whitepaper: Modernize legacy systems before your expertise disappears
            </h3>
            <p
              data-wf-el='whitepaper_paragraph'
              className='fluid-body-lg text-[#b3a88c]'
              style={{ maxWidth: '657.178px', marginBottom: '20.8px' }}
            >
              Legacy modernization projects fail 74% of the time and the engineers who understand your COBOL, mainframe, and legacy systems are retiring faster than you can replace them.
            </p>
            <div>
              <OverlayLinkButton
                href='/whitepapers/modernize-legacy-systems-with-ai-agents'
                label='Download the Whitepaper'
                variant='lightbrown'
                wfEl='button'
                textWfEl='btn-text'
                className='!flex'
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Live renders the closing CTA/footer section inside page-main on
       * /enterprise, not after </main>. Keeping Footer here avoids a
       * full footer-height page-main delta in parity while preserving the
       * same one yellow section containing CTA, social icons, nav, and ASCII art. */}
      <Footer
        standalone
        showSocialLinks
        compactNav
        marketingCtaTitle='What comes after Claude Code?'
        marketingCtaDescription='The teams shipping the most are moving beyond individual agent sessions to governed, automated workflows. Let us show you what that looks like in practice.'
        marketingCtaPrimary={{ href: '/contact', label: 'Book a Demo' }}
        marketingCtaSecondary={{ href: 'https://docs.openhands.dev/sdk', label: 'Build with SDK' }}
        showCopyright
        compactSpacerHeight={9}
      />
    </main>
  );
};

export default Enterprise;
