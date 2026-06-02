import type { CSSProperties } from 'react';
import type { Route } from './+types/pricing';
import { PixelBlastBackground } from '~/components/pixel-blast-background';
import { Footer } from '~/components/footer';
import { getRouteFooterProps } from '~/constants/route-layout';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { FAQ_TRIGGER_DIVIDER } from '~/components/faq-accordion';
import { createSocialPreviewMeta } from '~/utils/seo';

export const handle = { hideGlobalFooter: true };

const CARD_CHECK_ICON = '/assets/webflow/icons/690cb1513c759a7404df1ba1_check.svg';
const TABLE_TICK_ICON = '/assets/webflow/icons/691234bd9e72712ffbcf9470_tick.svg';

const PRICING_PLANS = [
  {
    eyebrow: 'Local',
    title: 'Open Source',
    price: 'Free',
    description: 'Free, local OpenHands for getting started',
    intro: 'Includes:',
    buttonLabel: 'Download',
    buttonHref: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    features: [
      'Best-in-class OpenHands Agent',
      'Web-based GUI, Terminal UI, and CLI',
      'Git integrations',
      'Community support',
      'Model agnostic',
    ],
  },
  {
    eyebrow: 'SaaS',
    title: 'Individual',
    price: 'Free',
    description: 'Bring your own key or use our providers at-cost',
    intro: 'Everything in Free, plus:',
    buttonLabel: 'Get started free',
    buttonHref: 'https://app.all-hands.dev/',
    features: [
      'Hosted cloud access from desktop and mobile',
      'API support for automation and scripting',
      'Jira and Slack integrations',
      'BYOK or use OpenHands models at-cost',
    ],
  },
  {
    eyebrow: 'SaaS or Self-hosted',
    title: 'Enterprise',
    price: 'Custom pricing',
    description: 'Full control and support. Private VPC and BYOK options',
    intro: 'Includes:',
    buttonLabel: 'Contact us',
    buttonHref: '/contact',
    features: [
      'SaaS or Self-hosted in your VPC',
      'Enterprise SAML / SSO',
      'Unlimited concurrent convos per user',
      'Large Codebase SDK',
      'Priority support & shared Slack channel',
    ],
  },
];

type ComparisonRow =
  | { type: 'section'; label: string }
  | { type: 'values'; label: string; values: [string, string, string] }
  | { type: 'ticks'; label: string; values: [boolean, boolean, boolean] };

const COMPARISON_ROWS: ComparisonRow[] = [
  { type: 'section', label: 'Features' },
  { type: 'values', label: 'Pricing', values: ['Free', 'Free', 'Contact Us'] },
  { type: 'section', label: 'Key Capabilities' },
  { type: 'values', label: 'Deployment options', values: ['Runs locally', 'SaaS', 'Self-hosted'] },
  { type: 'values', label: 'Agent', values: ['OpenHands', 'OpenHands', 'OpenHands'] },
  { type: 'values', label: 'Users', values: ['1', '1', 'Unlimited'] },
  { type: 'values', label: 'Max Daily Conversations', values: ['Unlimited', '10', 'Unlimited'] },
  {
    type: 'ticks',
    label: 'Bring your own key, or you use OpenHands provider at-cost',
    values: [true, true, true],
  },
  { type: 'ticks', label: 'Web-based GUI', values: [true, true, true] },
  { type: 'ticks', label: 'OpenHands CLI', values: [true, true, true] },
  { type: 'ticks', label: 'Git Integrations (GitHub, Bitbucket, GitLab)', values: [true, true, true] },
  { type: 'ticks', label: 'Secrets', values: [true, true, true] },
  { type: 'ticks', label: 'Cloud Agent SDK', values: [true, true, true] },
  { type: 'ticks', label: 'MCP Support', values: [true, true, true] },
  { type: 'ticks', label: 'Organization Support', values: [true, true, true] },
  { type: 'ticks', label: 'Multi-user RBAC', values: [false, false, true] },
  { type: 'ticks', label: 'Centralized team billing', values: [false, false, true] },
  { type: 'section', label: 'Integrations' },
  { type: 'ticks', label: 'Enterprise SAML/SSO', values: [false, false, true] },
  { type: 'ticks', label: 'Cloud APIs', values: [true, true, true] },
  { type: 'ticks', label: 'Jira Integration', values: [true, true, true] },
  { type: 'ticks', label: 'Slack Integration', values: [true, true, true] },
  { type: 'ticks', label: 'Large Codebase SDK', values: [false, false, true] },
  { type: 'section', label: 'Support' },
  { type: 'ticks', label: 'Priority support', values: [false, false, true] },
  { type: 'ticks', label: 'Ticket based support', values: [false, false, true] },
  { type: 'ticks', label: 'Named Customer Engineer', values: [false, false, true] },
  { type: 'ticks', label: 'Shared Slack Channel', values: [false, false, true] },
];

const FAQS = [
  {
    question: 'What are the main differences between the pricing plans?',
    answer: (
      <>
        <p>
          OpenHands Cloud is a hosted SaaS version of OpenHands that provides out-of-the-box runtime support and a high token rate LLM access. There are a few options with OpenHands Cloud:
        </p>
        <ul className='list-disc' style={{ margin: '0px 0px 16px', paddingLeft: '35.2px', paddingBottom: '0.1px' }}>
          <li style={{ marginBottom: '4.8px' }}>
            Individual plan: Support for 1 user. Great for individuals who want to bring their own LLM Key, or pay-as-you-go when using the OpenHands LLM provider.
          </li>
          <li style={{ marginBottom: '4.8px' }}>
            Enterprise plan: A self-hosted option and support for multiple users. Great for organizations who want to deploy OpenHands across many teams and centrally manage access on-premise. Additional support and enterprise services are included.
          </li>
        </ul>
        {/* Webflow rich-text exports trailing ZWJ-only paragraphs as
            spacers; live gives them margin: 0 (they're not really
            empty, so we can't rely on `:empty`).  Use a sentinel
            class. */}
        <p className='wf-zwj-spacer'>‍</p>
      </>
    ),
  },
  {
    question: 'What are the main differences between OpenHands open source, and OpenHands Cloud?',
    answer: (
      <>
        <p>
          OpenHands Open Source is a full, MIT licensed version of OpenHands that is designed for a single user and can run locally on your machine with your own LLM key. At a high level, our open source options include a local Web GUI, a CLI, and a Software Agent SDK.
        </p>
        <p>
          OpenHands Cloud is a SaaS-based version of OpenHands with both a free Individual tier, as well as commercial tiers for organizations and businesses. OpenHands Cloud also comes with additional features like Cloud APIs, ticketing system integrations, Git provider integrations, and more.
        </p>
        <p className='wf-zwj-spacer'>‍</p>
      </>
    ),
  },
  {
    question: 'Can I bring my own model keys?',
    answer: (
      <>
        <p>Yes! OpenHands Open Source and OpenHands Cloud plans offer support to bring your own LLM keys.</p>
        <p className='wf-zwj-spacer'>‍</p>
      </>
    ),
  },
  {
    question: 'What is the token pricing for the Individual Plan?',
    answer: (
      <>
        <p>
          If you do not have an LLM key, you can use theOpenHands LLM provider (available within the Individual Tier), which provides multiple model options <strong style={{ color: 'rgb(0, 0, 0)' }}>at cost, with no markup </strong>on a pay-as-you-go basis.
        </p>
        <p>
          When you sign up for the Individual Plan, you can access models under the Settings &gt; Language Models (LLM) page.
        </p>
        <p>
          You can also generate an API key for the OpenHands LLM provider under the Settings &gt; API page, which you can use in tools like the OpenHands CLI, OpenHands Local Web UI, and OpenHands Software Agent SDK.
        </p>
      </>
    ),
  },
];

// Live's `.plans-compare` is built as a vertical CSS grid (gap 8px)
// of <div class="row"> children, each laid out as a horizontal flex
// of 4 cols (1 label + 3 plan values).  Plan values are either a
// <p class="paragraph-sm u-text-lightbrown buch"> for text or an
// <img src=tick.svg width=12 height=12> when the feature is enabled.
// Section dividers are 1px-tall <div class="line"> rows with vertical
// margins from `.u-mb-xs` (8) and `.u-mb-sm` (24) Webflow utilities.
// Live row CSS: row is `display: flex`, col is `display: flex` with
// `padding: 0px 20px`, and the inner `<p class="paragraph-sm">` is
// font 14.4 / lineHeight 21.6 with `margin: 0 0 14.4px`.  The col's
// 36px height comes from the p's 21.6 + 14.4 margin-bottom.  Match
// these exact values so each row is 36px on test (was 22.4) and the
// total compare-table height matches live (1431).
const COMPARE_ROW: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', marginLeft: '-20px', marginRight: '-20px' };
// Live's `.col` is `display: flex; flex-direction: column` — the
// column direction is critical because it makes the cross-axis
// horizontal, so the inner `<p>` stretches to fill the col's inner
// width (252px) instead of shrinking to its text content (~5–60px).
// Without this the parity layout report flagged hundreds of tiny
// width mismatches across every comparison-table cell.
const COMPARE_COL: React.CSSProperties = {
  padding: '0 20px',
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
};
// Live's `.col.pc-label` and `.col.pc-plan` both use `flex: 1 1 0%`
// (equal column widths) — there's no special label-column sizing.
const COMPARE_LABEL_COL: React.CSSProperties = COMPARE_COL;
// Body-row cells: Sohne Buch + light-brown muted color.
// Live applies `paragraph-sm u-text-lightbrown buch` to body rows.
const COMPARE_TEXT: React.CSSProperties = {
  fontFamily: '"Sohne Buch", Arial, sans-serif',
  fontSize: 'var(--pricing-compare-font-size)',
  lineHeight: 'var(--pricing-compare-line-height)',
  fontWeight: 400,
  color: 'rgb(179, 168, 140)',
  margin: '0px 0px var(--pricing-compare-margin-bottom)',
};
// Header-row cells (Features / Open Source / Individual / Enterprise):
// Sohne Kraftig + cream color. Live uses `paragraph-sm u-text-cream`
// (no `buch` modifier) on the pc-head row.
const COMPARE_HEAD_TEXT: React.CSSProperties = {
  ...COMPARE_TEXT,
  fontFamily: '"Sohne Kraftig", Arial, sans-serif',
  color: 'rgb(249, 240, 217)',
};
// Section-header cells (Key Capabilities / Integrations / Support):
// Sohne Kraftig (no `buch` modifier on live) but keep the muted light-
// brown color from COMPARE_TEXT.
const COMPARE_SECTION_TEXT: React.CSSProperties = {
  ...COMPARE_TEXT,
  fontFamily: '"Sohne Kraftig", Arial, sans-serif',
};

// Live's tick image is `display: inline-block` with `width: 10px;
// height: auto;` (no explicit width/height attributes).  Setting an
// explicit `height={12}` made the natural-square image stretch to
// 12×36 inside a 36px-tall flex column — generating 42 image-rendered
// diffs in the parity report.  Mirror live exactly: drop the
// explicit `height` and let the natural aspect ratio drive sizing.
const CompareTick = () => (
  <img
    src={TABLE_TICK_ICON}
    alt='tick icon'
    style={{ display: 'inline-block', width: '12px', height: 'auto' }}
  />
);

const CompareLine = ({
  cls,
  marginTop = '0',
  marginBottom = '0',
}: {
  cls: string;
  marginTop?: string;
  marginBottom?: string;
}) => (
  <div
    data-wf-el='pc-line'
    className={cls}
    style={{ height: '1px', backgroundColor: 'rgb(95, 95, 95)', marginTop, marginBottom }}
  />
);

const CompareParagraph = ({
  children,
  style = COMPARE_TEXT,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <p data-wf-el='paragraph-sm' style={style}>
    {children}
  </p>
);

const CompareSectionHead = ({ label }: { label: string }) => (
  <div data-wf-el='pc-section' className='pc-section'>
    <CompareParagraph style={COMPARE_SECTION_TEXT}>{label}</CompareParagraph>
  </div>
);

const renderCompareRow = (key: string, label: string, cells: React.ReactNode[]) => (
  <div key={key} className='row' style={COMPARE_ROW}>
    <div data-wf-el='pc-label' className='col pc-label pricing-compare-label' style={COMPARE_LABEL_COL}>
      <CompareParagraph>{label}</CompareParagraph>
    </div>
    {cells.map((cell, i) => (
      <div
        key={`${key}-${i}`}
        className={`col pricing-compare-plan ${i === 1 ? 'pricing-compare-mobile-selected' : 'pricing-compare-mobile-hidden'}`}
        style={COMPARE_COL}
      >
        {cell}
      </div>
    ))}
  </div>
);

const CompareTable = () => {
  const out: React.ReactNode[] = [];

  // Header row (pc-head) — Features label + 3 plan names
  out.push(
    <div
      key='pc-head'
      data-wf-el='pc-head'
      className='row pc-head'
      style={{ ...COMPARE_ROW, gap: '40px normal' }}
    >
      <div data-wf-el='pc-label' className='col pc-label pricing-compare-label' style={COMPARE_LABEL_COL}>
        <CompareParagraph style={COMPARE_HEAD_TEXT}>Features</CompareParagraph>
      </div>
      <div data-wf-el='hide-on-large' className='col hide-on-large pricing-compare-mobile-control' style={COMPARE_COL}>
        <div data-wf-el='pc-mobile-ctrl' className='pc-mobile-ctrl paragraph-sm u-text-cream'>
          <select data-wf-el='select-form' className='select-form' defaultValue='Individual' style={{ fontSize: 'var(--pricing-compare-font-size)', lineHeight: 'var(--pricing-compare-line-height)', height: 'var(--pricing-compare-line-height)' }}>
            <option>Individual</option>
            <option>Enterprise</option>
          </select>
          <img src='/assets/webflow/icons/690e1fc1bceb905b0d646dc9_Vector.svg' alt='Description of image' loading='lazy' style={{ width: '10px', height: 'auto', maxWidth: '100%' }} />
        </div>
      </div>
      {['Open Source', 'Individual', 'Enterprise'].map((plan) => (
        <div
          key={plan}
          data-wf-el='pc-plan'
          className='col pc-plan hide-on-small pricing-compare-desktop-head'
          style={COMPARE_COL}
        >
          <CompareParagraph style={COMPARE_HEAD_TEXT}>{plan}</CompareParagraph>
        </div>
      ))}
    </div>,
  );
  out.push(<CompareLine key='line-after-head' cls='line u-mb-xs' marginBottom='8px' />);

  // Iterate the data rows.  We've already emitted the pc-head, so
  // skip the leading "Features" section header.  The first values
  // row ("Pricing") is followed by a thicker u-mb-sm divider; every
  // subsequent section header gets a u-mb-sm u-mt-sm divider before
  // it.
  let firstSectionEmitted = false;
  let pricingRowEmitted = false;
  for (const row of COMPARISON_ROWS) {
    if (row.type === 'section') {
      if (row.label === 'Features') continue;
      if (firstSectionEmitted) {
        out.push(
          <CompareLine
            key={`line-${row.label}`}
            cls='line u-mb-sm u-mt-sm'
            marginTop='24px'
            marginBottom='24px'
          />,
        );
      }
      out.push(<CompareSectionHead key={`section-${row.label}`} label={row.label} />);
      firstSectionEmitted = true;
      continue;
    }
    if (row.type === 'values') {
      out.push(
        renderCompareRow(
          `row-${row.label}`,
          row.label,
          row.values.map((v, i) => (
            <CompareParagraph key={i}>{v}</CompareParagraph>
          )),
        ),
      );
      if (!pricingRowEmitted) {
        out.push(
          <CompareLine
            key={`line-after-${row.label}`}
            cls='line u-mb-sm'
            marginBottom='24px'
          />,
        );
        pricingRowEmitted = true;
      }
      continue;
    }
    out.push(
      renderCompareRow(
        `row-${row.label}`,
        row.label,
        row.values.map((enabled, i) =>
          enabled ? <CompareTick key={i} /> : <CompareParagraph key={i} />,
        ),
      ),
    );
  }

  return (
    <div className='mx-auto w-full' style={{ maxWidth: '1129px' }}>
      <section
        data-wf-el='plans-compare'
        className='bg-brand-fg text-brand-bg plans-compare w-full'
        style={{ display: 'grid', gap: '8px', padding: '0px' }}
      >
        <h2 className='sr-only' data-wf-el='pc-visually-hidden'>
          Compare plans
        </h2>
        {out}
      </section>
    </div>
  );
};

const PRICING_META_TITLE = 'OpenHands Pricing | Start Building for Free';
const PRICING_META_DESCRIPTION =
  'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans for advanced control and scalability.';

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: PRICING_META_TITLE,
    description: PRICING_META_DESCRIPTION,
    pathname: location.pathname,
  });

const Pricing = () => {
  return (
    <main data-wf-el='page-main' className='pricing-page' style={{ display: 'flex', flexDirection: 'column' }}>
      <section data-wf-el='hero-section'>
        <div
          data-wf-el='hero-content'
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--pricing-hero-content-padding)' }}
        >
          <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-x-0 top-0 h-screen overflow-hidden' style={{ '--ascii-opacity': '0.12', '--ascii-filter': 'drop-shadow(0 0 6px rgba(160, 200, 255, 0.1))', maxHeight: '100vh' } as CSSProperties} aria-hidden='true'>
            <PixelBlastBackground className='pricing-ascii h-full w-full' />
          </div>
          <div data-wf-el='container' className='pricing-container mx-auto block max-w-[1238px]'>
            <div className='flex flex-col items-center text-center'>
              <h1 className='fluid-h1 text-brand-fg' style={{ position: 'relative', marginBottom: '0px', width: '100%', maxWidth: '599px', textAlign: 'center' }}>
                Pricing that fits your rollout
              </h1>
              <p data-wf-el='paragraph-lg' className='fluid-body-lg text-brand-muted' style={{ marginTop: 'calc(var(--paragraph-lg-font-size) / 2)', marginBottom: 'var(--paragraph-lg-font-size)', width: 'var(--pricing-hero-copy-width)', textAlign: 'center' }}>
                Run locally, in our cloud, or self-host. Pay only for what you need
              </p>
            </div>
          </div>
          <div
            data-wf-el='standard-collection'
            className='pricing-container relative z-[1] mx-auto mt-[49.6px] block max-w-[1238px]'
          >
            <div data-wf-el='standard-collection-list' className='pricing-plan-list flex' style={{ margin: '0px -12px', gap: '24px normal' }}>
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.title}
                  data-wf-el='standard-collection-list-item'
                  className='pricing-plan-item'
                  style={{ padding: '0px 12px', position: 'relative', alignItems: 'center', gap: '16px' }}
                >
                  <article
                    data-wf-el='card'
                    className='relative flex h-full w-full flex-col justify-start overflow-hidden rounded-lg bg-brand-bg'
                    style={{ borderRadius: '8px', border: '1px solid rgb(34, 21, 13)' }}
                  >
                    <div
                      data-wf-el='card-body'
                      className='relative flex h-full flex-col items-stretch text-brand-fg'
                      style={{ justifyContent: 'space-between', padding: 'var(--pricing-card-body-padding)' }}
                    >
                      <div data-wf-el='standard-wrap'>
                        <div
                          data-wf-el='hero-surface-eyebrow'
                          className='font-mono text-[14.08px] font-normal leading-[16.896px] text-brand-fg'
                          style={{ display: 'inline-block', padding: '3.2px 9.6px', marginBottom: '21.12px', borderRadius: '20px', backgroundColor: 'rgb(179, 168, 140)' }}
                        >
                          {plan.eyebrow}
                        </div>
                        <div data-wf-el='paragraph-xl' className='text-brand-fg' style={{ fontSize: 'var(--pricing-plan-title-font-size)', lineHeight: 'var(--pricing-plan-title-line-height)', fontWeight: 500, marginBottom: '0px' }}>{plan.title}</div>
                        <p data-wf-el='paragraph-md' className='font-normal text-[#5f5f5f]' style={{ fontSize: 'var(--pricing-plan-price-font-size)', lineHeight: 'var(--pricing-plan-price-line-height)', marginTop: '0px', marginBottom: 'var(--pricing-plan-price-margin-bottom)' }}>{plan.price}</p>
                        <p className='text-[16px] text-brand-muted' style={{ lineHeight: 'var(--pricing-body-copy-line-height)', marginTop: '0px', marginBottom: '24px' }}>{plan.description}</p>
                        <div aria-hidden='true' style={{ height: '1px', margin: '0px', backgroundColor: 'rgba(34, 21, 13, 0.2)' }} />
                        <p data-wf-el='paragraph-sm' className='fluid-sm font-normal text-[#5f5f5f]' style={{ marginTop: 'var(--pricing-card-intro-margin-top)', marginBottom: 'var(--pricing-card-intro-margin-bottom)' }}>{plan.intro}</p>
                        <div className='flex flex-1 flex-col' style={{ marginTop: '0px', width: '100%' }}>
                          {plan.features.map((feature) => (
                            <div key={feature} className='row row-gap-sm row-align-center u-mb-xs' style={{ display: 'flex', alignItems: 'center', gap: '8px normal', margin: '0px -4px 8px', padding: '0px' }}>
                              <div className='col col-shrink' style={{ display: 'flex', flexDirection: 'column', position: 'relative', flex: '0 0 auto', padding: '0px 4px' }}>
                                <img data-wf-el='icon-media' src={CARD_CHECK_ICON} alt='' aria-hidden='true' className='icon-media' style={{ display: 'block', width: '20px', height: '20px', color: 'rgb(34, 21, 13)', fontSize: '16px', lineHeight: '22.4px', fontFamily: '"Sohne Kraftig", Arial, sans-serif' }} />
                              </div>
                              <div className='col' style={{ display: 'flex', flexDirection: 'column', position: 'relative', flex: '1 1 0%', padding: '0px 4px' }}>
                                <p data-wf-el='paragraph-sm' className='fluid-sm font-sohne-buch text-[#5f5f5f]' style={{ margin: '0px' }}>{feature}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <OverlayLinkButton
                        href={plan.buttonHref}
                        label={plan.buttonLabel}
                        variant='outline'
                        wrapperStyle={{ marginTop: '30px', marginBottom: '0px' }}
                        fullWidth
                        wfEl='button'
                        textWfEl='btn-text'
                      />
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live's plans-compare section has padding 0 on all sides; the
       * dark surface lives on the outer <section> itself rather than a
       * nested div.  Drop section padding entirely and move the
       * horizontal gutter onto the inner container so the section
       * height matches live. */}
      {/* Live wraps the comparison table in:
       *   section.section (transparent bg, 80px 0 padding)
       *     .container > .row > .col > .card (rounded 8px, transparent)
       *       .card-body.u-bg-darkbrown (bg darkbrown, padding 24)
       *         .table-embed (transparent)
       *           section.plans-compare (display grid, gap 8px, bg darkbrown, padding 0)
       *
       * Mirroring that hierarchy means the parity ancestor walk for
       * each table cell lands on a `display:grid; gap:8px` ancestor
       * (the inner plans-compare section) instead of our previous
       * `rounded-[24px]; padding:24-32` wrapper, collapsing ~87
       * ancestor mismatches that all originated from a single
       * structural difference. */}
      <section
        data-wf-el='section'
        style={{
          display: 'block',
          paddingTop: 'var(--pricing-section-padding-y)',
          paddingBottom: 'var(--pricing-section-padding-y)',
          paddingLeft: '0px',
          paddingRight: '0px',
          position: 'relative',
        }}
      >
        <div className='pricing-container mx-auto max-w-[1238px]' data-wf-el='container'>
          <h2 className='sr-only'>Compare plans</h2>
          {/* Live's compare-table has a 1px outer border + 24px top/
           * bottom margin around the `.table-embed` inner block (the
           * Webflow `u-mt-sm u-mb-sm` utilities each set 24px).  Without
           * those, our compare-section is 50px shorter than live and
           * pushes 50px of cumulative shift onto every element below. */}
          <div
            data-wf-el='card'
            className='relative flex flex-col justify-start overflow-hidden rounded-lg'
            style={{ borderRadius: '8px', border: '1px solid rgb(179, 168, 140)' }}
          >
            <div
              data-wf-el='card-body'
              className='relative bg-brand-fg text-brand-fg'
              style={{ backgroundColor: 'rgb(34, 21, 13)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', padding: 'var(--pricing-card-body-padding)' }}
            >
              <div
                data-wf-el='table-embed'
                style={{ display: 'flex', width: 'var(--pricing-table-embed-width)', margin: '24px var(--pricing-table-embed-margin-right) 24px var(--pricing-table-embed-margin-left)', color: 'rgb(34, 21, 13)' }}
              >
                {/* Live's compare-table is a div-grid (NOT a <table>):
                 *
                 *   section.plans-compare         display: grid; gap: 8px
                 *     h2.pc-visually-hidden       sr-only
                 *     div.row.pc-head             flex row, header cells
                 *     div.line.u-mb-xs            1px divider, mb 8
                 *     div.row                     "Pricing" values row
                 *     div.line.u-mb-sm            1px divider, mb 24
                 *     div.pc-section              "Key Capabilities" header
                 *     div.row × N                 feature rows
                 *     div.line.u-mb-sm.u-mt-sm    section divider, my 24
                 *     div.pc-section              next section header
                 *     ...
                 *
                 * Each row has 4 cols (label + 3 plan values).  Plan
                 * values are either a `<p>` (text) or an `<img>` of the
                 * 12×12 tick.svg.  This div structure was the missing
                 * 27px of compare-section height and was the source of
                 * persistent `[container] display: live=block test=
                 * grid` and `[table-embed] display: live=flex test=
                 * block` parity diffs. */}
                <CompareTable />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Match live: padding is 80px 0 on the SECTION itself, with the
       * inner container handling the horizontal gutter.  Using inline
       * styles keeps the parity script's container audit happy. */}
      <section
        data-wf-el='section'
        style={{
          display: 'block',
          paddingTop: 'var(--pricing-section-padding-y)',
          paddingBottom: 'var(--pricing-section-padding-y)',
          paddingLeft: '0px',
          paddingRight: '0px',
          position: 'relative',
        }}
      >
        <div className='pricing-container mx-auto block max-w-[1238px]' data-wf-el='container'>
          <div className='pricing-faq-layout lg:grid lg:grid-cols-[493px_705.5px] lg:gap-10'>
            <div>
              <h2 className='section-title text-brand-fg' style={{ marginBottom: 'var(--pricing-faq-heading-margin-bottom)' }}>
                FAQ&apos;s
              </h2>
              <div data-wf-el='standard-wrap' style={{ width: 'var(--pricing-faq-contact-width)' }}>
                <OverlayLinkButton href='/contact' label='Contact us' variant='outline' wfEl='button' textWfEl='btn-text' />
              </div>
            </div>
            <div data-wf-el='standard-collection'>
              <div data-wf-el='standard-collection-list'>
                {FAQS.map((faq, idx) => (
                  <div key={faq.question} data-wf-el='standard-collection-list-item' style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <details
                      data-wf-el='accordion-item'
                      data-accordion-start-open={idx === 0 ? 'true' : 'false'}
                      className='flex flex-col'
                      style={{
                        border: '1px solid rgb(249, 240, 217)',
                        borderRadius: '8px',
                      }}
                    >
                      <summary
                        data-wf-el='accordion-trigger'
                        className='flex cursor-pointer list-none items-center justify-between text-brand-fg'
                        style={{
                          padding: 'var(--pricing-accordion-padding)',
                          fontWeight: 400,
                          borderBottom: FAQ_TRIGGER_DIVIDER,
                          overflow: 'hidden',
                        }}
                      >
                        <label
                          data-wf-el='accordion-title'
                          className='pointer-events-none m-0 cursor-default'
                          style={{
                            fontSize: 'var(--pricing-accordion-title-font-size)',
                            lineHeight: 'var(--pricing-accordion-title-line-height)',
                            fontWeight: 500,
                            paddingRight: 'var(--pricing-accordion-title-padding-right)',
                          }}
                        >
                          {faq.question}
                        </label>
                        <svg
                          data-wf-el='accordion-icon'
                          className='accordion-icon flex-shrink-0 overflow-hidden text-brand-fg transition-transform group-open:rotate-180'
                          xmlns='http://www.w3.org/2000/svg'
                          width='100%'
                          viewBox='0 0 32 32'
                          fill='none'
                          style={{ display: 'var(--pricing-accordion-icon-display)', width: 'var(--pricing-accordion-icon-size)', height: 'var(--pricing-accordion-icon-size)', alignItems: 'var(--pricing-accordion-icon-align-items)', verticalAlign: 'baseline' }}
                          aria-hidden='true'
                        >
                          <path fillRule='evenodd' clipRule='evenodd' d='M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z' fill='currentColor' />
                        </svg>
                      </summary>
                      <div style={{ marginLeft: 'var(--pricing-accordion-padding)', marginRight: 'var(--pricing-accordion-padding)' }}>
                        <div data-wf-el='accordion-content_spacer' style={{ padding: '0px 0px var(--pricing-accordion-content-padding-bottom)' }}>
                          <div data-wf-el='slot' style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div data-wf-el='rich-text-component' style={{ marginTop: '16px', width: '100%' }}>
                              <div
                                data-wf-el='rich-text'
                                className='faq-answer pricing-rich-text w-richtext font-sohne-buch text-[16px] text-brand-fg'
                                style={{ height: idx === 0 ? 'var(--pricing-first-faq-rich-text-height)' : undefined, lineHeight: 'var(--pricing-body-copy-line-height)', padding: '0px', maxWidth: '820px' }}
                              >
                                {faq.answer}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live renders the closing CTA inside the yellow footer section, and
          the footer section itself is a child of page-main. */}
      <Footer {...getRouteFooterProps('/pricing')} />
    </main>
  );
};

export default Pricing;
