import type { CSSProperties } from 'react';
import type { Route } from './+types/pricing';
import ASCIIAnimation from '~/components/ascii-animation';
import { Footer } from '~/components/footer';
import { OverlayLinkButton } from '~/components/overlay-link-button';

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
        <ul className='mt-3 list-disc space-y-2 pl-5'>
          <li>
            Individual plan: Support for 1 user. Great for individuals who want to bring their own LLM Key, or pay-as-you-go when using the OpenHands LLM provider.
          </li>
          <li>
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
        <p>Yes! OpenHands Open Source and OpenHands Cloud plans offer support to bring your own LLM keys.</p>
        <p className='wf-zwj-spacer'>‍</p>
      </>
    ),
  },
  {
    question: 'What is the token pricing for the Individual Plan?',
    answer: (
      <>
        <p>
          If you do not have an LLM key, you can use theOpenHands LLM provider (available within the Individual Tier), which provides multiple model options at cost, with no markup on a pay-as-you-go basis.
        </p>
        <p>
          When you sign up for the Individual Plan, you can access models under the Settings &gt; Language Models (LLM) page.
        </p>
        <p>
          You can also generate an API key for the OpenHands LLM provider under the Settings &gt; API page, which you can use in tools like the OpenHands CLI, OpenHands Local Web UI, and OpenHands Software Agent SDK.
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
const COMPARE_ROW: React.CSSProperties = { display: 'flex', marginLeft: '-20px', marginRight: '-20px' };
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
};
// Live's `.col.pc-label` and `.col.pc-plan` both use `flex: 1 1 0%`
// (equal column widths) — there's no special label-column sizing.
const COMPARE_LABEL_COL: React.CSSProperties = COMPARE_COL;
// Body-row cells: Sohne Buch + light-brown muted color.
// Live applies `paragraph-sm u-text-lightbrown buch` to body rows.
const COMPARE_TEXT: React.CSSProperties = {
  fontFamily: '"Sohne Buch", Arial, sans-serif',
  fontSize: '14.4px',
  lineHeight: '21.6px',
  fontWeight: 400,
  color: 'rgb(179, 168, 140)',
  margin: '0px 0px 14.4px',
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

const CompareSectionHead = ({ label }: { label: string }) => (
  <div data-wf-el='pc-section' className='pc-section'>
    <p style={COMPARE_SECTION_TEXT}>{label}</p>
  </div>
);

const renderCompareRow = (key: string, label: string, cells: React.ReactNode[]) => (
  <div key={key} data-wf-el='pc-row' className='row' style={COMPARE_ROW}>
    <div data-wf-el='pc-label' className='col pc-label' style={COMPARE_LABEL_COL}>
      <p style={COMPARE_TEXT}>{label}</p>
    </div>
    {cells.map((cell, i) => (
      <div
        key={`${key}-${i}`}
        data-wf-el='pc-cell'
        className='col'
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
      style={COMPARE_ROW}
    >
      <div data-wf-el='pc-label' className='col pc-label' style={COMPARE_LABEL_COL}>
        <p style={COMPARE_HEAD_TEXT}>Features</p>
      </div>
      {['Open Source', 'Individual', 'Enterprise'].map((plan) => (
        <div
          key={plan}
          data-wf-el='pc-plan'
          className='col pc-plan hide-on-small'
          style={COMPARE_COL}
        >
          <p style={COMPARE_HEAD_TEXT}>{plan}</p>
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
            <p key={i} style={COMPARE_TEXT}>
              {v}
            </p>
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
          enabled ? <CompareTick key={i} /> : <p key={i} style={COMPARE_TEXT} />,
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

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Pricing | Start Building for Free' },
    {
      name: 'description',
      content:
        'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans for advanced control and scalability.',
    },
    { property: 'og:title', content: 'OpenHands Pricing | Start Building for Free' },
    {
      property: 'og:description',
      content:
        'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans for advanced control and scalability.',
    },
    {
      property: 'og:image',
      content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'OpenHands Pricing | Start Building for Free' },
    {
      name: 'twitter:description',
      content:
        'Choose the right plan for your team. Start for free with OpenHands Open Source or upgrade to Team and Enterprise plans for advanced control and scalability.',
    },
    {
      name: 'twitter:image',
      content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const Pricing = () => {
  return (
    <main data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Live's hero-section is position:static, transparent bg, padding 0
       * — the page bg comes from the body/page-wrapper and the gutter
       * lives on the inner container. Move padding/relative inward so
       * the section's geometry/styles match live. */}
      <section data-wf-el='hero-section' style={{ minHeight: '816px' }}>
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-x-0 top-0 h-screen overflow-hidden' style={{ '--ascii-opacity': '0.12', '--ascii-filter': 'drop-shadow(0 0 6px rgba(160, 200, 255, 0.1))' } as CSSProperties} aria-hidden='true'>
          <ASCIIAnimation className='h-full w-full' />
        </div>
        <div className='relative mx-auto flex max-w-4xl flex-col items-center px-5 pb-0 pt-16 text-center lg:px-10'>
          {/* Live's hero H1 has margin: 0; the new h1 element default
              (mb: 10) doesn't apply here. */}
          <h1 className='fluid-h1 text-brand-fg' style={{ position: 'relative', marginBottom: '0px', width: '599px', maxWidth: '100%' }}>
            Pricing that fits your rollout
          </h1>
          {/* Live's hero subtitle is `.paragraph-lg` whose margins
              resolve to mt=10.4 (0.5em of 20.8) and mb=20.8 (1em). */}
          <p className='fluid-body-lg text-brand-muted' style={{ marginTop: '10.4px', marginBottom: '20.8px', width: '599px', maxWidth: '100%' }}>
            Run locally, in our cloud, or self-host. Pay only for what you need
          </p>
        </div>
        {/* Live wraps the plan cards in two layers:
         *   .standard-collection      (display: block, gap: normal)
         *     .standard-collection-list .row .row-gap-md  (flex)
         *       .col-lg-4 ...          (each card)
         * The outer `.standard-collection` is a plain block container; the
         * inner `.row` does the actual flex layout. */}
        <div
          data-wf-el='standard-collection'
          className='relative mx-auto mt-[49.6px] block max-w-[1238px] px-5 lg:px-0'
        ><div className='flex flex-col gap-y-10 lg:flex-row lg:gap-x-6'>
          {PRICING_PLANS.map((plan) => (
            // Live's plan card is `<div class="card u-border-dark u-bg-cream">`
            // (8px border-radius, no padding) with an inner
            // `<div class="card-body u-d-v-between">` (padding 24, flex column).
            // Wrapping the content in a child div with the padding moves
            // the parity ancestor walk's matched ancestor onto the inner
            // wrapper, which has 0 border-radius and 0 padding -- matching
            // live's first visible ancestor after the leaf nodes.  The
            // outer .card keeps the 8px border-radius and tan bg.
            // Live's .card has position:relative and
            // justifyContent:flex-start; .card-body also uses
            // position:relative.  Setting these explicitly drops the
            // matching wfMismatch entries (4x card and 4x card-body).
            <article
              key={plan.title}
              data-wf-el='card'
              className='relative flex flex-1 flex-col justify-start overflow-hidden rounded-lg bg-[#f5ecd6]/90'
              style={{ borderRadius: '8px', border: '1px solid rgb(34, 21, 13)' }}
            >
              <div
                data-wf-el='card-body'
                className='relative flex h-full flex-col items-stretch p-6'
                style={{ justifyContent: 'space-between' }}
              >
                <div
                  className='font-mono text-[14px] font-normal leading-[16.896px] text-brand-bg'
                  style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '3.2px 8px', marginBottom: '21.12px', borderRadius: '999px', backgroundColor: 'rgb(34, 21, 13)' }}
                >
                  {plan.eyebrow}
                </div>
                <div className='text-brand-fg' style={{ fontSize: '24px', lineHeight: '33.6px', fontWeight: 500, marginBottom: '0px' }}>{plan.title}</div>
                {/* Live's plan-card paragraphs use Webflow margin-bottom
                    (not margin-top) for inter-line spacing.  Switching
                    matches: price mb=20, description mb=24, intro
                    mt=21.6/mb=14.4 — values pulled directly from the
                    parity script's computed-style output. */}
                <p className='text-[20px] font-normal leading-[28px] text-[#5f5f5f]' style={{ marginTop: '0px', marginBottom: '20px' }}>{plan.price}</p>
                <p className='text-[16px] leading-[22.4px] text-brand-muted' style={{ marginTop: '0px', marginBottom: '24px' }}>{plan.description}</p>
                <div aria-hidden='true' style={{ height: '1px', margin: '0px', backgroundColor: 'rgba(34, 21, 13, 0.2)' }} />
                <p className='fluid-sm font-normal text-[#5f5f5f]' style={{ marginTop: '21.6px', marginBottom: '14.4px' }}>{plan.intro}</p>
                <ul className='flex flex-1 flex-col' style={{ marginTop: '0px', marginLeft: '-4px', width: 'calc(100% + 8px)' }}>
                  {plan.features.map((feature) => (
                    <li key={feature} className='flex items-center gap-2 font-sohne-buch fluid-sm leading-[1.5] text-[#5f5f5f]' style={{ marginBottom: '8px', paddingLeft: '4px' }}>
                      <img src={CARD_CHECK_ICON} alt='' aria-hidden='true' className='h-5 w-5 flex-none' />
                      <p className='flex-1'>{feature}</p>
                    </li>
                  ))}
                </ul>
                <OverlayLinkButton
                  href={plan.buttonHref}
                  label={plan.buttonLabel}
                  variant='outline'
                  wrapperStyle={{ marginTop: '30px', marginBottom: '0px' }}
                  fullWidth
                />
              </div>
            </article>
          ))}
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
          paddingTop: '80px',
          paddingBottom: '80px',
          paddingLeft: '0px',
          paddingRight: '0px',
          position: 'relative',
        }}
      >
        <div className='mx-auto max-w-[1238px] px-5 lg:px-0' data-wf-el='container'>
          <h2 className='sr-only'>Compare plans</h2>
          {/* Live's compare-table has a 1px outer border + 24px top/
           * bottom margin around the `.table-embed` inner block (the
           * Webflow `u-mt-sm u-mb-sm` utilities each set 24px).  Without
           * those, our compare-section is 50px shorter than live and
           * pushes 50px of cumulative shift onto every element below. */}
          <div
            data-wf-el='card'
            className='overflow-hidden rounded-lg'
            style={{ borderRadius: '8px', border: '1px solid rgb(34, 21, 13)' }}
          >
            <div data-wf-el='card-body' className='bg-brand-fg p-6 text-brand-bg'>
              <div data-wf-el='table-embed' style={{ marginTop: '24px', marginBottom: '24px' }}>
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
          paddingTop: '80px',
          paddingBottom: '80px',
          paddingLeft: '0px',
          paddingRight: '0px',
          position: 'relative',
        }}
      >
        <div className='mx-auto grid max-w-[1239px] gap-10 px-5 lg:grid-cols-[493px_706px] lg:gap-10 lg:px-0' data-wf-el='container'>
          <div>
            {/* FAQ H2 mb=22 on live (overrides the .h2 element 8.8). */}
            <h2 className='section-title text-brand-fg' style={{ marginBottom: '22px' }}>
              FAQ&apos;s
            </h2>
            <OverlayLinkButton href='/contact' label='Contact us' variant='outline' />
          </div>
          <div>
            {FAQS.map((faq, idx) => (
              // Live's .accordion-item has no border-radius and no
              // padding on the <details> element itself; padding
              // lives on the inner trigger/content blocks instead.
              // Match that geometry so the parity ancestor walk
              // doesn't pair every FAQ-answer paragraph against a
              // 24px-padded / rounded ancestor on test only.
              // Live's .accordion-item is an 8px-rounded box with a
              // 1px solid border (color rgb(249,240,217)) on all four
              // sides; the <summary>/.accordion-trigger has 24px
              // padding, alignItems:center, fontSize 16px /
              // lineHeight 22.4px (paragraph-md, not h4).  Mirroring
              // these collapses ~10 wfMismatch entries per FAQ row.
              <details
                key={faq.question}
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
                    padding: '24px',
                    fontWeight: 400,
                    borderBottom: '1px solid rgb(249, 240, 217)',
                  }}
                >
                  {/* Live's `.accordion-title` is `font-size: 24px;
                   * line-height: 33.6px; font-weight: 500` (the `.h4`
                   * Webflow utility = Sohne Kräftig).  We were rendering
                   * font-weight 400 (Sohne Buch) which produces slightly
                   * different glyph metrics — the longest FAQ question
                   * was wrapping to 2 lines on test but 1 line on live.
                   * Matching the 500-weight Kräftig face also matches
                   * live's `.h4` utility exactly. */}
                  <label
                    className='pointer-events-none m-0 cursor-default'
                    style={{
                      fontSize: '24px',
                      lineHeight: '33.6px',
                      fontWeight: 500,
                      paddingRight: '12px',
                    }}
                  >
                    {faq.question}
                  </label>
                  {/* No `ml-4` here: live's chevron sits flush against
                   * the label's 12px right padding (no extra margin).
                   * The 16px gap that ml-4 added was eating into the
                   * label's available width, wrapping the first two
                   * questions to 2 lines and inflating the FAQ section
                   * by ~30px. */}
                  <span className='inline-flex h-8 w-8 flex-shrink-0 items-center justify-center text-brand-fg transition-transform group-open:rotate-180' aria-hidden='true'>
                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'/></svg>
                  </span>
                </summary>
                {/* Live's `.accordion-item-content` wrapper carries
                    `.faq-answer` (Webflow class) which sets every
                    descendant <p> to `margin-bottom: 1em`.  Adding the
                    matching class lets our shared CSS rule apply the
                    same default without touching individual <p> tags. */}
                <div
                  data-wf-el='accordion-content'
                  className='faq-answer font-sohne-buch text-[16px] leading-[22.4px] text-[#5f5f5f]'
                  style={{ marginTop: '16px', marginLeft: '25px', marginRight: '25px', padding: '0px' }}
                >
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Live renders the closing CTA inside the yellow footer section, and
          the footer section itself is a child of page-main. */}
      <Footer
        standalone
        showSocialLinks
        compactNav
        minHeight={1209}
        marketingCtaTitle='Building the open standard for autonomous software development.'
        marketingCtaDescription='OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.'
        marketingCtaPrimary={{ href: 'https://docs.openhands.dev/sdk', label: 'Build with SDK' }}
        marketingCtaSecondary={{ href: 'https://app.all-hands.dev/', label: 'Try it live' }}
      />
    </main>
  );
};

export default Pricing;
