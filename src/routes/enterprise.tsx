import type { CSSProperties } from 'react';
import type { Route } from './+types/enterprise';
import { AutomationStepsFlow } from '~/components/enterprise/automation-steps-flow';
import { ControlPlaneGraphic } from '~/components/enterprise/control-plane-graphic';
import { PixelBlastBackground } from '~/components/pixel-blast-background';
import { Footer } from '~/components/footer';
import { BootstrapIcon, type BootstrapIconName } from '~/components/icons/bootstrap-icons';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { getRouteFooterProps } from '~/constants/route-layout';
import {
  C3AI_AUTHOR_IMAGE,
  C3AI_LOGO_IMAGE,
} from '~/constants/webflow-assets';
import { createSocialPreviewMeta } from '~/utils/seo';

// Section base styles matching live Webflow: padding 80px 0, no horizontal
// padding on the section itself (inner container handles the gutter), and
// the dark surface lives on the SECTION itself rather than a wrapper div.
const SECTION_Y_PADDING = 'clamp(49.5714px, calc(31.9956px + 4.6869vw), 80.008px)';

const SECTION_BASE: React.CSSProperties = {
  display: 'block',
  paddingTop: SECTION_Y_PADDING,
  paddingBottom: SECTION_Y_PADDING,
  paddingLeft: '0px',
  paddingRight: '0px',
  position: 'relative',
};

const SECTION_DARK: React.CSSProperties = {
  ...SECTION_BASE,
  backgroundColor: 'rgb(24, 24, 24)',
  color: 'rgb(247, 243, 238)',
};

interface ControlFeature {
  icon: BootstrapIconName;
  eyebrow: string;
  heading: string;
  paragraph: string;
  bullets: string[];
}

const CONTROL_FEATURES: ControlFeature[] = [
  {
    icon: 'lightningCharge',
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
    icon: 'barChart',
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
    icon: 'lock',
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
    icon: 'graphUpArrow',
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
    icon: 'shieldShaded',
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
const CONTROL_HEADING_DESKTOP_WIDTHS = ['456.609375px', '317.328125px', 'auto', '467px', '261.359375px'];
const BUILT_HEADING_DESKTOP_WIDTHS = ['253.0625px', '178.90625px', '239.640625px', '343.59375px', '211.953125px'];

const desktopWidthStyle = (width: string): CSSProperties => (
  width === 'auto' ? {} : ({ '--enterprise-desktop-width': width } as CSSProperties)
);



interface BuiltForFeature {
  icon: BootstrapIconName;
  heading: string;
  paragraph: string;
}

const BUILT_FOR_FEATURES: BuiltForFeature[] = [
  {
    icon: 'hdd',
    heading: 'Self-hosted in your VPC',
    paragraph:
      'Deploy on your own Kubernetes infrastructure. Your code never leaves your environment. No shared tenancy.',
  },
  {
    icon: 'braces',
    heading: 'Source-available',
    paragraph:
      'Inspect all the code. Every capability and integration is readable and auditable by your security team.',
  },
  {
    icon: 'people',
    heading: 'Research team access',
    paragraph:
      'Enterprise contracts include direct access to the team building the models. Not just support tickets.',
  },
  {
    icon: 'link',
    heading: 'Enterprise integrations included',
    paragraph:
      'GitHub, GitLab, Slack, Jira, and Linear out of the box. RBAC, multi- user support, and conversation sharing built in.',
  },
  {
    icon: 'robot',
    heading: 'Bring your own LLM',
    paragraph:
      'Model-agnostic by design. Use Anthropic, OpenAl, Bedrock, or any other model provider your team prefers.',
  },
];

const ENTERPRISE_META_TITLE =
  'OpenHands for Enterprise | Secure, Scalable Agentic Software Development';
const ENTERPRISE_META_DESCRIPTION =
  'Scale AI agents in production with the control, visibility, and repeatability your enterprise needs. Self-hosted in your VPC, source-available, and backed by direct research-team access.';
const ENTERPRISE_SOCIAL_DESCRIPTION =
  'Deploy OpenHands securely across your organization. Enterprise-grade governance, compliance, and customization for regulated industries.';

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: ENTERPRISE_META_TITLE,
    description: ENTERPRISE_META_DESCRIPTION,
    socialDescription: ENTERPRISE_SOCIAL_DESCRIPTION,
    pathname: location.pathname,
  });

export const handle = { hideGlobalFooter: true };

// Live's `.container` resolves to max-width 1238px with no horizontal
// padding (margins handle the gutter at 101px on either side at 1440
// viewport).  Mirroring that exactly drops 7+ wfMismatch entries
// (paddingLeft/Right, marginLeft/Right, maxWidth) on each route.
const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`mx-auto ${className}`}
    data-wf-el='container'
    style={{ width: '90%', maxWidth: 'var(--enterprise-container-max-width, 1238px)' }}
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
    <main className='enterprise-page' data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column' }}>
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
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-0 overflow-hidden' style={{ '--ascii-opacity': '0.12', maxHeight: '100vh' } as CSSProperties} aria-hidden='true'>
          <PixelBlastBackground className='h-full w-full' />
        </div>
        {/* Live's `.container` sits inside `section-hero` with padding 0
         * vertically; the visual rhythm comes from the inner
         * `.hero-content.is-center` block, which has padding 56px 0px. */}
        <Container>
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
              data-enterprise-desktop-width
              style={{ marginTop: '0.5em', marginBottom: '1em', '--enterprise-desktop-width': '878.344px' } as CSSProperties}
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
              style={{ gap: '8px 16px', paddingTop: '32px', maxWidth: '100%', justifyContent: 'var(--enterprise-hero-btn-justify, center)', alignItems: 'var(--enterprise-hero-btn-align, center)' }}
            >
              <OverlayLinkButton
                href='/contact'
                label='Book a demo'
                wfEl='button-3'
                textWfEl='btn-text-3'
                className='!px-[30.4px] !py-[14.4px]'
              />
              <OverlayLinkButton
                href='https://install.r9.all-hands.dev/openhands/signup'
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
      <section data-wf-el='section' id='control-plane' style={SECTION_DARK}>
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
              style={{ marginBottom: '0.2em' }}
            >
              A control plane for every layer of your agent stack
            </h3>
            <p
              data-wf-el='paragraph-lg'
              className='fluid-body-lg text-[#b3a88c]'
              style={{ marginTop: '0.5em', marginBottom: '1em' }}
            >
              From the policies that govern how agents run, to the automations that trigger them, OpenHands Enterprise gives you control at every layer.
            </p>
          </div>
          <ControlPlaneGraphic />
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
          <h3 className='section-title text-brand-fg' style={{ marginBottom: '1.5em' }}>
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
            className='enterprise-feature-layout overflow-hidden md:grid md:grid-cols-2'
            style={{
              borderRadius: '24px',
              border: '1px solid rgb(179, 168, 140)',
              gap: '0px',
            }}
          >
            {CONTROL_FEATURES.map(({ icon, eyebrow, heading, paragraph, bullets }, idx) => (
              <article
                key={heading}
                data-wf-el='acp_features_item'
                data-card-index={idx}
                className={`enterprise-control-card flex flex-col items-start justify-start gap-4 ${idx === 0 ? 'md:col-span-2' : ''}`}
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
                  style={{ backgroundColor: 'rgb(24, 24, 24)', borderRadius: '8px', display: 'block', width: '24px', height: '24px', padding: '8px', boxSizing: 'content-box', aspectRatio: '1 / 1' }}
                >
                  <BootstrapIcon name={icon} />
                </div>
                {/* Live's eyebrow is title-cased text (e.g. "Automations")
                 * with no text-transform and normal letter-spacing — the
                 * `eyebrow` Webflow class doesn't actually uppercase. */}
                <div data-wf-el='acp_features_eyebrow' className='font-mono text-[14px] font-normal leading-[16.896px] text-brand-fg'>
                  {eyebrow}
                </div>
                <h3
                  data-wf-el='acp_features_heading'
                  data-enterprise-desktop-width={CONTROL_HEADING_DESKTOP_WIDTHS[idx] === 'auto' ? undefined : true}
                  className='fluid-h4 font-medium text-brand-fg'
                  style={{ marginBottom: 0, ...desktopWidthStyle(CONTROL_HEADING_DESKTOP_WIDTHS[idx]) }}
                >{heading}</h3>
                <p data-wf-el='acp_features_paragraph' className='text-[16px] leading-[22.4px] text-[#5f5f5f]' style={{ maxWidth: '808.961px', marginBottom: '0px' }}>{paragraph}</p>
                {/* Live's `.product-list_ul` has padding-left:0 and uses
                 * the dark-brown body color; bullets get explicit 16px
                 * top/bottom padding instead of the default UL spacing. */}
                {/* Live's `.product-list_ul` uses brand-fg (#181818)
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
      <section data-wf-el='section' id='automations' style={SECTION_DARK}>
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
                <h2 className='section-title text-brand-bg' style={{ width: '100%', maxWidth: '599px', marginBottom: '0.2em' }}>From event to PR, no human in the loop.</h2>
                <p data-wf-el='paragraph-lg' className='fluid-body-lg' style={{ marginBottom: '1em', width: '100%', color: 'var(--neutral-card-dark-muted)' }}>
                  Wire OpenHands to the tools your team already uses. When something happens, the right agent fires, does the work, and opens a pull request.
                  <br />
                  <br />
                  Every automated run is fully logged and governed by the same cost and security policies as manual sessions. Automation doesn't mean unsupervised.
                </p>
              </div>
            </div>
            <div className='flex basis-full flex-col px-5 lg:basis-1/2' style={{ position: 'relative' }}>
              <AutomationStepsFlow />
            </div>
          </div>
        </Container>
      </section>

      {/* C3.ai QUOTE — light section with ASCII hole bg */}
      <section data-wf-el='section' className='overflow-visible' style={SECTION_BASE}>
        <div data-wf-el='asci-wrap' className='absolute inset-0 bg-brand-accent' style={{ overflow: 'hidden', maxHeight: '100vh', pointerEvents: 'auto' }} aria-hidden='true'>
          <PixelBlastBackground className='h-full w-full' />
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
              style={{ marginTop: '0px', marginBottom: '0.5em' }}
            >
              “OpenHands was the only solution that let us prompt an autonomous coding agent remotely at scale — not just on a laptop or inside a narrow CI template.”
            </p>
            <div
              data-wf-el='acp_quote_wrap'
              className='flex flex-col items-center justify-center md:flex-row md:flex-nowrap'
              style={{ gap: 'var(--enterprise-quote-gap, 16px)' }}
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
                  width: '48px',
                  height: '48px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  backgroundColor: 'rgb(24, 24, 24)',
                  display: 'block',
                  overflow: 'visible',
                }}
              >
                <img
                  data-wf-el='acp_quote_img'
                  src={C3AI_AUTHOR_IMAGE}
                  alt=''
                  className='h-12 w-12 object-cover'
                  style={{ display: 'inline-block', width: '48px', height: '48px' }}
                  loading='lazy'
                />
              </div>
              {/* Live's .acp_quote_attr is the .h4 utility (24px /
               * 33.6px / weight 500); we were using 20/28/400 so the
               * author label rendered ~5px shorter and ~16% lighter. */}
              <p
                data-wf-el='acp_quote_attr'
                className='text-brand-fg'
                style={{ width: 'var(--enterprise-quote-attr-width, 100%)', marginBottom: '0px', fontSize: 'clamp(19.4357px, calc(17.8273px + 0.4289vw), 24px)', lineHeight: 1.4, fontWeight: 500 }}
              >
                Sina Pakazad, VP of Data Science at C3.ai
              </p>
              <div className='v-line rotate enterprise-quote-divider' style={{ width: 'var(--enterprise-quote-divider-width, 40px)', height: 'var(--enterprise-quote-divider-height, 1px)', backgroundColor: 'rgb(24, 24, 24)' }} />
              <img data-wf-el='acp_quote_logo' src={C3AI_LOGO_IMAGE} alt='' className='acp_quote_logo h-auto w-[80px]' style={{ display: 'block', width: '80px', height: 'auto', flexShrink: 0 }} loading='lazy' />
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
              <h2 className='section-title text-brand-fg' style={{ marginBottom: '0.2em' }}>Built for teams running agents at scale. </h2>
              <p data-wf-el='paragraph-lg' className='fluid-body-lg text-[#5f5f5f]' data-enterprise-desktop-width style={{ marginBottom: '1em', '--enterprise-desktop-width': '1168.08px' } as CSSProperties}>
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
            className='enterprise-feature-layout overflow-hidden md:grid md:grid-cols-6'
            style={{
              borderRadius: '24px',
              border: '1px solid rgb(179, 168, 140)',
              gap: '0px',
            }}
          >
            {BUILT_FOR_FEATURES.map(({ icon, heading, paragraph }, idx) => {
              // Row 1: cards 0,1,2 each span 2 of 6 cols (one-third).
              // Row 2: cards 3,4 each span 3 of 6 cols (one-half).
              const span = idx <= 2 ? 'md:col-span-2' : 'md:col-span-3';
              return (
                <article
                  key={heading}
                  data-wf-el='acp_enterprise_item'
                  data-card-index={idx}
                  className={`enterprise-built-card flex flex-col items-start justify-start gap-4 ${span}`}
                >
                  <div
                    data-wf-el='acp_features_icon'
                    className='h-10 w-10 p-2 text-[#FFFF8B]'
                    style={{ backgroundColor: 'rgb(24, 24, 24)', borderRadius: '8px', display: 'block', width: '24px', height: '24px', padding: '8px', boxSizing: 'content-box', aspectRatio: '1 / 1' }}
                  >
                    <BootstrapIcon name={icon} />
                  </div>
                  <h3
                    data-wf-el='acp_features_heading'
                    data-enterprise-desktop-width
                    className='fluid-h4 font-medium text-brand-fg'
                    style={{ marginBottom: 0, ...desktopWidthStyle(BUILT_HEADING_DESKTOP_WIDTHS[idx]) }}
                  >{heading}</h3>
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
              style={{ maxWidth: 'var(--enterprise-whitepaper-heading-max-width, 560px)', marginBottom: '0.2em' }}
            >
              Whitepaper: Modernize legacy systems before your expertise disappears
            </h3>
            <p
              data-wf-el='whitepaper_paragraph'
              className='fluid-body-lg text-[#b3a88c]'
              style={{ maxWidth: 'var(--enterprise-whitepaper-paragraph-max-width, 560px)', marginBottom: '1em' }}
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
      <Footer {...getRouteFooterProps('/enterprise')} />
    </main>
  );
};

export default Enterprise;
