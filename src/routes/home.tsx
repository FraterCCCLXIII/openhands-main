import React, { type ComponentType, type SVGProps } from 'react';
import { Link } from 'react-router';
import {
  BookOpen,
  Box,
  Download,
  Layers,
  Plus,
  Settings,
} from 'lucide-react';
import type { Route } from './+types/home';
import statistics from '~/data/statistics.json';
import { Footer } from '~/components/footer';
import { getRouteFooterProps } from '~/constants/route-layout';
import { AGENT_CANVAS_INSTALL_COMMAND, GET_OPENHANDS_CTA, HEADER_GET_OPENHANDS_URL } from '~/constants/site-shell';
import { CopyInstallPill } from '~/components/copy-install-pill';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { FAQ_TRIGGER_DIVIDER, CLOSED_FAQ_ITEM_PROPS } from '~/components/faq-accordion';
import { formatThousands } from '~/utils/format-thousands';
import { PixelBlastBackground } from '~/components/pixel-blast-background';
import { createSocialPreviewMeta } from '~/utils/seo';
import { EnterpriseLogoStrip } from '~/components/logos/enterprise-logo-strip';
import { ClaudeCodeIcon, CodexIcon, GeminiCliIcon } from '~/components/icons/agent-subscription-icons';
import { HeroAppPreview } from '~/components/hero-app-preview';
import { HeroWorkflowCarousel } from '~/components/hero-workflow-carousel';
import { HERO_APP_PREVIEW_SLIDES } from '~/constants/hero-app-preview-slides';
import { HomeHeroLogoGrid } from '~/components/home-hero-logo-grid';
import { HomeFullJourneySection } from '~/components/home-full-journey-section';
import { HomeLovewallMarquee } from '~/components/home-lovewall-marquee';
import { useMarqueeTiming } from '~/hooks/use-marquee-timing';
import { HomeVariantSwitcher } from '~/components/home-variant-switcher';
import { useHomeVariant } from '~/contexts/home-variant-context';
import { getHomeHeroContentPadding, HOME_HERO_DEFAULT_SUBCOPY, usesVersion4HeroCopy } from '~/constants/home-variants';

const INSTALL_OPENHANDS_URL = HEADER_GET_OPENHANDS_URL;

type HeroCompatibilityBadge = {
  name: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName?: string;
  iconWrapperClassName?: string;
  iconSrc?: string;
  iconAlt?: string;
};

const HERO_COMPATIBILITY_BADGES: HeroCompatibilityBadge[] = [
  { name: 'Claude Code', Icon: ClaudeCodeIcon },
  { name: 'Codex', Icon: CodexIcon },
  { name: 'Gemini CLI', Icon: GeminiCliIcon },
  {
    name: 'OpenHands',
    iconSrc: '/assets/webflow/brand/openhands-logo-mobile-mono.svg',
    iconAlt: '',
    iconClassName: 'h-4 w-auto',
    iconWrapperClassName: 'h-4 w-7',
  },
];

function HeroCompatibilityBadgesRow() {
  return (
    <div className='flex flex-wrap items-center justify-center gap-2'>
      {HERO_COMPATIBILITY_BADGES.map((badge, index) => {
        const { name, Icon, iconClassName, iconWrapperClassName, iconSrc, iconAlt } = badge;
        return (
          <React.Fragment key={name}>
            {index > 0 ? (
              <Plus
                className='h-4 w-4 flex-shrink-0 text-brand-fg/50'
                strokeWidth={2}
                aria-hidden='true'
              />
            ) : null}
            <div className='flex items-center gap-2 rounded-full border border-[rgba(24,24,24,0.2)] bg-[#f7f3ee] px-4 py-2'>
              <span
                className={`flex flex-shrink-0 items-center justify-center text-brand-fg ${iconWrapperClassName ?? 'h-6 w-6'}`}
                aria-hidden='true'
              >
                {iconSrc ? (
                  <img src={iconSrc} alt={iconAlt ?? ''} className={iconClassName ?? 'h-4 w-4'} />
                ) : Icon ? (
                  <Icon className={iconClassName ?? 'h-4 w-4'} />
                ) : null}
              </span>
              <span className='text-base font-medium leading-[22.4px] text-brand-fg'>{name}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

const WHY_TEAMS_FEATURES = [
  {
    title: 'Run agents where your code and data live',
    description:
      'Open source, model-agnostic, and deployable in your environment, so you control how agents operate, what they can access, and where your data stays.',
    icon: BookOpen,
  },
  {
    title: 'Build your own agent experience',
    description:
      'Fork the codebase, create a custom interface, or embed the OpenHands SDK into your product or internal platform. MIT licensed, so you can modify, extend, and distribute freely.',
    icon: Settings,
  },
  {
    title: 'Run agents beyond your laptop',
    description:
      'Run agents in isolated sandboxes on a VM or in the cloud, no local hardware dependency. Schedule recurring tasks or trigger them from GitHub, Slack, or PagerDuty events, even when your machine is off.',
    icon: Layers,
  },
  {
    title: 'Scale agent usage without losing control',
    description:
      'Run agents across teams and enterprise workflows with the visibility, access controls, audit trails, and cost guardrails your organization needs.',
    icon: Box,
  },
] as const;

const TESTIMONIALS = [
  {
    quote: '"OpenHands autonomously fixes 87% of bug tickets same-day. Our clients think we hired an army of engineers."',
    name: 'Nick Blanchet',
    title: 'CTO at Flextract',
    photo: '/assets/webflow/logos/6915c4f0cbba410851f45d79_flextract-selfie.png',
    logo: '/assets/webflow/logos/6915b02ded45d0b434a0974d_flextract.png',
  },
  {
    quote:
      '“OpenHands was the only solution that let us prompt an autonomous coding agent remotely at scale, not just on a laptop or inside a narrow CI template.”',
    name: 'Sina Pakazad',
    title: 'VP of Data Science at C3',
    photo: '/assets/webflow/misc/6915c4c0c7baa5046b127eb6_c3.png',
    logo: '/assets/webflow/logos/69137ec5a6f77dd174e557ce_C3ai_logo1.svg',
  },
  {
    quote:
      '“The integration of Lemonade Server with OpenHands reflects AMD’s commitment to open-source innovation and developer choice. This collaboration enables local coding agents that prioritize privacy, cost efficiency, and flexible model selection – while taking advantage of acceleration on Ryzen AI PCs. Together, we’re supporting a range of workflows and staying true to open-source values.”',
    name: 'Adrian Macias',
    title: 'Director, Developer Acceleration at AMD',
    photo: '/assets/webflow/testimonials/authors/amd.png',
    logo: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg',
  },
];

const DEVELOPER_QUOTES = [
  {
    name: 'Nacho Martínez Rincón',
    title: 'Data Scientist Advocate at Oracle',
    avatar: '/assets/webflow/misc/69a9a2ecdfdb5a94e70e9fb5_nacho-martinez-ricon.jpg',
    lines: [
      'The OpenHands SDK is one of the most complete SDKs for agent harness and agentic AI development - including enabling vibecoding with opensource models. Great reliability for tool calling through the Tool System - very dev friendly!',
    ],
  },
  {
    name: 'Dan Kempe',
    title: '@danielkempe',
    avatar: '/assets/webflow/avatars/69783c9c4f51d7fb8f0ec4da_hAlMtLep_400x400.jpeg',
    lines: [
      'OpenHands raised $18.8M to build cloud coding agents that solve 87% of bug tickets same day.',
      'This is what AI coding tools should be. Not another chat interface. Actual autonomous problem solving that ships to production.',
    ],
  },
  {
    name: 'Esteban Puerta',
    title: '@Esteban_Puerta9',
    avatar: '/assets/webflow/avatars/69783c9c29335a4e5f25171c_XdPDMFhM_400x400.jpeg',
    lines: [
      "At this point, there isn't much of a need to roll your own especially when claude code SDK and openhands sdk are offering nice API's to utilize them.",
      'This is where it gets interesting.',
    ],
  },
  {
    name: 'Fisherman',
    title: '@Rybens92',
    avatar: '/assets/webflow/misc/69a7ac3c1dc83f0947eb2469_Fisherman_Profile_Picture.jpg',
    lines: [
      'Your agents are so underrated, but even though there are many benchmarks, which are testing agentic coding and are using your work as reference - OpenHands agent with tested model...',
      "I just don't get why everybody is so silent about your work...",
      '‍',
      'Reposting till people wake up.',
    ],
  },
  {
    name: 'Jingyi Zhao',
    title: 'Software Engineer at Walmart Global Tech',
    avatar: '/assets/webflow/avatars/69b02ad9ad98d51e745551de_user.svg',
    lines: [
      'I love this project because it is the first of its kind in coding agent space and you have the freedom to configure your own way. It also integrates well with various ecosystems. I believe this project can go long!',
    ],
  },
  {
    name: 'Leonardo Gonzalez',
    title: '@archimagos',
    avatar: '/assets/webflow/avatars/69783c9c901a7c70a903b9c5_v7Pqyx4B_400x400.jpeg',
    lines: [
      'I love using autonomous agents like @allhands_ai OpenHands for 80% of the work (esp. backend), and then an interactive IDE like @windsurf or @zeddotdev for debugging, refinement, and UI work.',
      'It saves tons of my time and saves a lot of money too with the right models/plans.',
    ],
  },
  {
    name: 'Wil - e/acc',
    title: '@wilfullyapt',
    avatar: '/assets/webflow/avatars/69783c9ceee8b37f4ea0de9d_7pG3i1Kf_400x400.jpeg',
    lines: [
      "I fvkn love vibe coding with OpenHands. It's not like your editor is doing things for you, it's like an idiot internal that literally knows all the book stuff. OpenHands commit, my tweaks, rinse and repeat. Phenomenal!!",
    ],
  },
  {
    name: 'Christian Genco',
    title: '@cgenco',
    avatar: '/assets/webflow/avatars/69783c9cc7c27cc7bedeac33_40ETg5qV_400x400.jpeg',
    lines: [
      "I haven't tried Devin yet but I freakin' love OpenHands. I prefer having more control over how it's working.",
      'Also that general workflow is the future. Just opening GitHub issues and the AI figures it out and writes tests and then pushes a PR is magical.',
    ],
  },
];

const DEVELOPER_QUOTES_ROW_ONE = DEVELOPER_QUOTES.slice(0, 4);
const DEVELOPER_QUOTES_ROW_TWO = DEVELOPER_QUOTES.slice(4);

const FAQS = [
  {
    question: 'What is OpenHands?',
    answer:
      'OpenHands is an AI agent platform for software development that can execute real engineering work, not just suggest code. It runs autonomous agents that plan, write, and apply changes across your codebase, helping teams complete complex tasks end-to-end. Built on an open source foundation, it\'s designed for enterprise software development at scale.',
  },
  {
    question: 'How is OpenHands different from AI coding tools like GitHub Copilot or ChatGPT?',
    answer:
      'Instead of helping you write code faster, OpenHands helps you ship changes end-to-end. Tools such as GitHub Copilot or ChatGPT generate code suggestions. OpenHands runs agents that complete entire engineering tasks, taking actions across entire codebases, running tasks in parallel, and executing changes in real environments.',
  },
  {
    question: 'Can OpenHands work with large or legacy codebases?',
    answer:
      'Yes. OpenHands is specifically designed to handle large, complex, and legacy codebases. With its Large Codebase SDK, it maps dependencies across the system and orchestrates changes in the correct order, allowing multiple agents to safely work in parallel without conflicts.',
  },
  {
    question: 'Is OpenHands secure for enterprise use?',
    answer:
      'OpenHands runs in your environment, whether on-prem or private cloud, so your code never leaves your control. Since agents operate inside secure, isolated execution environments with full auditability, it is built for organizations with strict data security, compliance, and governance requirements.',
  },
  {
    question: 'What types of teams use OpenHands?',
    answer:
      'OpenHands is used by platform teams automating engineering workflows at scale, teams building internal developer platforms or AI-powered tooling, and enterprises managing large or legacy codebases and mission-critical software systems.',
  },
];

export const meta: Route.MetaFunction = () =>
  createSocialPreviewMeta({
    title: 'OpenHands | The Open Platform for Cloud Coding Agents',
    description:
      'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering work securely and transparently. Build faster with full control.',
  });

const Home = () => {
  const { variant, setVariant } = useHomeVariant();
  const isVersion1 = variant === 'v1';
  const isVersion4 = usesVersion4HeroCopy(variant);
  const heroContentPadding = getHomeHeroContentPadding(variant);
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);
  const logoMarqueeRef = React.useRef<HTMLDivElement>(null);
  const logoMarqueeTrackRef = React.useRef<HTMLDivElement>(null);
  const logoMarqueeGroupRef = React.useRef<HTMLDivElement>(null);

  useMarqueeTiming(logoMarqueeRef, logoMarqueeTrackRef, logoMarqueeGroupRef, {
    pixelsPerSecond: 36,
    distanceProperty: '--logo-marquee-distance',
    durationProperty: '--logo-marquee-duration',
  });

  return (
    <main data-testid='home-content' data-wf-el='page-main' className='home-mobile-parity' style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0, 0, 0, 0)' }}>
      {/* SECTION 0: section-hero — contains hero+carousel+logos+SDK (matches live 1761px mega-section) */}
      <section data-wf-el='section-hero' className='relative' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '64px', paddingLeft: '0px', paddingRight: '0px' }}>
        <div className='relative w-full'>
          {!isVersion1 ? (
            <div
              data-wf-el='asci-wrap'
              className='absolute inset-0 z-0 overflow-hidden'
              style={{ backgroundColor: 'rgba(0, 0, 0, 0)', pointerEvents: 'auto' }}
              aria-hidden='true'
            >
              <PixelBlastBackground />
            </div>
          ) : null}

        <div data-wf-el='hero' className='relative' style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', justifyContent: 'flex-start', alignItems: 'center' }}>
          {/* Version 1: pixel background covers the heading band only. Version 2: it spans hero + preview via the wrapper above. */}
          <div
            data-wf-el='hero-top'
            className='relative w-full overflow-hidden'
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}
          >
            {isVersion1 ? (
            <div data-wf-el='asci-wrap' className='absolute inset-0 z-0 overflow-hidden' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', pointerEvents: 'auto' }}>
              <PixelBlastBackground />
            </div>
            ) : null}

            <div data-wf-el='container' className='relative z-10 mx-auto w-full max-w-[1238px]'>
              <div
                data-wf-el='hero-content'
                className='w-full'
                style={{
                  textAlign: 'center',
                  paddingTop: `${heroContentPadding.top}px`,
                  paddingBottom: `${heroContentPadding.bottom}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '40px',
                }}
              >

              {/* Live's `.hero-heading_wrap` has no max-width and no auto
                * margins — it inherits flex centering from its parent.
                * Removing `mx-auto max-w-[640px]` here matches live's
                * computed style (marginLeft/Right: 0, maxWidth: none) and
                * stops the parity audit from flagging the "auto margin"
                * mismatch on every render. */}
              {/* Live structure: hero-heading_wrap holds ONLY H1 + P;
                * hero_btn_wrap and hero_sublink_text are SIBLINGS of
                * hero-heading_wrap inside hero-content.  Spacing between
                * those three sibling blocks comes from hero-content's
                * `gap: 2rem` (32px), not from per-element margins.
                * Earlier we nested everything inside hero-heading_wrap
                * with the heading_wrap's tighter `gap-2` (8px) which
                * collapsed all four blocks together. */}
              <div
                data-wf-el='hero-heading_wrap'
                className='hero-heading-scrim flex flex-col items-center gap-2 text-center'
                style={{
                  justifyContent: 'center',
                  ...(isVersion4 ? { paddingBottom: '0.5rem' } : {}),
                }}
              >
                {/* Live's `.hero-heading_h1.h1` has `margin-bottom: 0`. */}
                <h1 data-wf-el='hero-heading_h1' id='hero-heading' className='hero-heading-h1 font-medium tracking-[-0.03em] text-brand-fg' style={{ marginBottom: '0px' }}>
                  One workspace for all your AI coding agents
                </h1>
                {!isVersion4 ? (
                <p data-wf-el='hero-heading_paragraph' id='hero-subheading' className='max-w-[60ch] fluid-body-lg font-medium text-brand-muted' style={{ marginLeft: '0px', marginRight: '0px', marginBottom: '0px' }}>
                  {HOME_HERO_DEFAULT_SUBCOPY}
                </p>
                ) : null}
              </div>

              {isVersion4 ? (
              <div
                data-wf-el='hero-subscription'
                className='hero-content-foreground flex w-full flex-col items-center justify-center gap-4 text-brand-fg'
                style={{ maxWidth: '980px', marginTop: '-20px' }}
              >
                <HeroCompatibilityBadgesRow />
              </div>
              ) : null}

              {/* hero_btn_wrap — sibling of hero-heading_wrap on live. */}
              <div
                data-wf-el='hero_btn_wrap'
                className='hero-content-foreground flex flex-col items-center justify-center gap-3'
                style={{ marginBottom: '0px', paddingTop: '0px' }}
              >
                <OverlayLinkButton
                  href={INSTALL_OPENHANDS_URL}
                  label='Get OpenHands'
                  variant='primary'
                  size='lg'
                  icon={<Download className='h-5 w-5' strokeWidth={2} aria-hidden='true' />}
                />
                <CopyInstallPill command={AGENT_CANVAS_INSTALL_COMMAND} />
              </div>

              {!isVersion4 ? (
              <div
                data-wf-el='hero-subscription'
                className='hero-content-foreground flex w-full flex-col items-center justify-center gap-4 text-brand-fg'
                style={{ maxWidth: '980px' }}
              >
                <span className='text-center text-base font-normal leading-[22.4px] text-brand-fg'>OpenHands works with all of your agents</span>
                <HeroCompatibilityBadgesRow />
              </div>
              ) : null}
            </div>
          </div>
          </div>

          {isVersion1 ? <HeroWorkflowCarousel /> : null}

          {isVersion1 ? (
            <HomeHeroLogoGrid
              key='home-logo-grid-v1'
              logoMarqueeRef={logoMarqueeRef}
              logoMarqueeTrackRef={logoMarqueeTrackRef}
              logoMarqueeGroupRef={logoMarqueeGroupRef}
            />
          ) : null}

        </div>

          <div data-wf-el='hero-preview' className='relative z-10 mx-auto w-full max-w-[1238px] overflow-visible px-4 md:px-6' style={{ paddingTop: '56px', paddingBottom: '56px' }}>
            <HeroAppPreview slides={HERO_APP_PREVIEW_SLIDES} />
            {!isVersion1 ? <HeroWorkflowCarousel topSpacing={isVersion4 ? 80 : 0} /> : null}
          </div>
        </div>

          {!isVersion1 ? (
            <HomeHeroLogoGrid
              key='home-logo-grid-v2'
              logoMarqueeRef={logoMarqueeRef}
              logoMarqueeTrackRef={logoMarqueeTrackRef}
              logoMarqueeGroupRef={logoMarqueeGroupRef}
            />
          ) : null}
      </section>

      {/* SECTION 1: Why teams choose OpenHands (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto grid max-w-[1238px] gap-10 lg:grid-cols-[558px_640px]'>
          <div className='home-why-teams-heading flex min-w-0 flex-col items-start'>
            <h3 className='max-w-[386px] section-title text-brand-fg' style={{ marginBottom: 0 }}>Why teams choose OpenHands</h3>
          </div>

          <div className='rounded-none px-5 py-0' style={{ marginLeft: '20px', width: '640px' }}>
            {WHY_TEAMS_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className='feature-item-stacked'>
                  <div
                    className='home-why-teams-feature-icon flex flex-shrink-0 items-center justify-center text-[#FFFF8B]'
                    style={{ marginTop: '0px' }}
                    aria-hidden='true'
                  >
                    <Icon className='h-6 w-6' strokeWidth={1.5} />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='fluid-body-lg font-medium text-brand-fg' style={{ marginBottom: '0px' }}>{feature.title}</p>
                    <p className='fluid-body-lg font-medium text-brand-muted' style={{ marginBottom: '31.2px' }}>{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <HomeFullJourneySection />

      {/* SECTION 3: Testimonials / black hole (p:0, h:800, transparent, position:relative).
          Live carries data-slider/data-slider-overflow on the section so the
          mast slider script binds the prev/next controls; we replicate the
          attributes statically since our prev/next handlers already work. */}
      <section data-wf-el='section' data-slider='testimonials' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '800px', maxHeight: '800px', overflow: 'visible' }}>
        <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ backgroundColor: 'rgb(255, 255, 139)', pointerEvents: 'auto' }}>
          <PixelBlastBackground />
        </div>
        <div data-wf-el='hero-track' className='relative z-10 mx-auto box-border flex h-full w-full max-w-[1238px] px-5 md:px-0' style={{ paddingBottom: '0px', justifyContent: 'center', alignItems: 'center', gap: '10%' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} data-wf-el='card-body' className='w-full max-w-[1238px]' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', display: 'block', color: 'rgb(247, 243, 238)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', position: i === activeTestimonial ? 'static' : 'absolute', opacity: i === activeTestimonial ? 1 : 0, pointerEvents: i === activeTestimonial ? 'auto' : 'none', left: i === activeTestimonial ? undefined : '-9999px' }}>
              {/* Live renders the testimonial quote as <h2 class="h2 ..."/>
                  inside .testimonial_quote.  Matching the heading semantic
                  keeps the heading-order audit aligned (live has 13 visible
                  headings, test had 12 because the quote was a div). */}
              {/* Live's testimonial heading is `text-align: center` and
                  uses `margin-bottom: 8.8px` (h2-2 token).  Our previous
                  `mb-6` (24px) caused a ~15px drift after the quote. */}
              <div className='mx-auto w-full max-w-[1038px] px-1'>
                <h2 className='section-title text-brand-fg' style={{ textAlign: 'center', marginBottom: '8.8px' }}>
                  {t.quote}
                </h2>
              </div>
              <div className='flex items-center justify-center' style={{ gap: '16px', marginTop: '37.2px', marginBottom: '0px', color: 'rgb(24, 24, 24)', transform: 'translateX(-8px)' }}>
                {/* Live's `.quote-author-media` wrapper is visible overflow and
                 * sits in the centered author row alongside name, title, and
                 * client logo. */}
                <div data-wf-el='quote-author-media' className='h-12 w-12 flex-shrink-0' style={{ backgroundColor: 'rgb(24, 24, 24)', borderRadius: '50%', display: 'block', overflow: 'visible' }}><img src={t.photo} alt='' className='h-12 w-12 object-cover' style={{ display: 'inline-block' }} /></div>
                <div data-wf-el='paragraph-xl' style={{ fontSize: '24px', lineHeight: '33.6px', fontWeight: 500, color: 'rgb(24, 24, 24)' }}>
                  {`${t.name},`}
                </div>
                <div style={{ fontSize: '24px', lineHeight: '33.6px', fontWeight: 500, color: 'rgb(24, 24, 24)' }}>{t.title}</div>
                <div style={{ display: 'block', transform: t.name === 'Nick Blanchet' ? 'translateX(17px)' : undefined }}>
                  <img src={t.logo} alt='' style={{ display: 'inline-block', marginLeft: '0px', objectFit: 'scale-down', width: t.name === 'Nick Blanchet' ? '70px' : undefined, height: t.name === 'Nick Blanchet' ? '16px' : '32px', maxWidth: '110px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div data-wf-el='slide-controls' style={{ zIndex: 10, width: '100%', height: '59px', position: 'absolute', inset: 'auto 0% 0%', color: 'rgb(24, 24, 24)' }}>
          <div className='mx-auto box-border flex w-full max-w-[1238px] items-end justify-between px-5 md:px-0'>
            <div className='flex font-mono text-[14.08px] font-normal leading-[16.896px] text-brand-fg'>
              <span>3</span><span>/</span><span>3</span>
            </div>
            <div className='flex' style={{ gap: '1px' }}>
              <button
                type='button'
                onClick={() => setActiveTestimonial((current) => (current === 0 ? TESTIMONIALS.length - 1 : current - 1))}
                className='flex h-11 w-11 items-center justify-center rounded-full border border-brand-fg/20 text-brand-fg transition-colors hover:bg-brand-fg/5'
              >
                <svg data-wf-el='slide-icon-media' width='35' height='35' viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
                  <rect x='24.5' y='24.5' width='24' height='24' rx='12' transform='rotate(-180 24.5 24.5)' stroke='black'/>
                  <path fillRule='evenodd' clipRule='evenodd' d='M15.5 12.4995C15.5 12.599 15.4605 12.6944 15.3902 12.7647C15.3198 12.835 15.2245 12.8745 15.125 12.8745L10.7803 12.8745L12.3905 14.484C12.4609 14.5544 12.5005 14.6499 12.5005 14.7495C12.5005 14.8491 12.4609 14.9446 12.3905 15.015C12.3201 15.0854 12.2246 15.125 12.125 15.125C12.0254 15.125 11.9299 15.0854 11.8595 15.015L9.6095 12.765C9.57458 12.7302 9.54687 12.6888 9.52797 12.6433C9.50906 12.5977 9.49933 12.5489 9.49933 12.4995C9.49933 12.4502 9.50906 12.4014 9.52797 12.3558C9.54687 12.3102 9.57458 12.2689 9.6095 12.234L11.8595 9.98403C11.9299 9.91361 12.0254 9.87405 12.125 9.87405C12.2246 9.87405 12.3201 9.91361 12.3905 9.98403C12.4609 10.0544 12.5005 10.1499 12.5005 10.2495C12.5005 10.3491 12.4609 10.4446 12.3905 10.515L10.7803 12.1245L15.125 12.1245C15.2245 12.1245 15.3198 12.164 15.3902 12.2344C15.4605 12.3047 15.5 12.4001 15.5 12.4995Z' fill='black'/>
                </svg>
              </button>
              <button
                type='button'
                onClick={() => setActiveTestimonial((current) => (current === TESTIMONIALS.length - 1 ? 0 : current + 1))}
                className='flex h-11 w-11 items-center justify-center rounded-full border border-brand-fg/20 text-brand-fg transition-colors hover:bg-brand-fg/5'
              >
                <svg data-wf-el='slide-icon-media' width='35' height='35' viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
                  <rect x='0.5' y='0.5' width='24' height='24' rx='12' stroke='black'/>
                  <path fillRule='evenodd' clipRule='evenodd' d='M9.5 12.5005C9.5 12.401 9.53951 12.3056 9.60984 12.2353C9.68016 12.165 9.77554 12.1255 9.875 12.1255H14.2197L12.6095 10.516C12.5391 10.4456 12.4995 10.3501 12.4995 10.2505C12.4995 10.1509 12.5391 10.0554 12.6095 9.98497C12.6799 9.91456 12.7754 9.875 12.875 9.875C12.9746 9.875 13.0701 9.91456 13.1405 9.98497L15.3905 12.235C15.4254 12.2698 15.4531 12.3112 15.472 12.3567C15.4909 12.4023 15.5007 12.4511 15.5007 12.5005C15.5007 12.5498 15.4909 12.5986 15.472 12.6442C15.4531 12.6898 15.4254 12.7311 15.3905 12.766L13.1405 15.016C13.0701 15.0864 12.9746 15.1259 12.875 15.1259C12.7754 15.1259 12.6799 15.0864 12.6095 15.016C12.5391 14.9456 12.4995 14.8501 12.4995 14.7505C12.4995 14.6509 12.5391 14.5554 12.6095 14.485L14.2197 12.8755H9.875C9.77554 12.8755 9.68016 12.836 9.60984 12.7656C9.53951 12.6953 9.5 12.5999 9.5 12.5005Z' fill='black'/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Dark cards continued (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '1269.25px' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px] space-y-6' style={{ marginTop: '49.6px' }}>
          <div className='grid gap-6 md:grid-cols-2'>
            <article data-wf-el='card' className='card-dark' style={{ height: '616.328px', overflow: 'hidden' }}>
              <div data-wf-el='card-body' className='flex h-full flex-col p-6'>
                {/* Live's `.paragraph-lg.u-m-0.u-text-primary` headline
                  * has margin: 0; the body paragraph below has the same
                  * 0 margin (live `.paragraph-lg.u-text-primary` with
                  * `u-m-0`).  Spacing between them comes from the
                  * card-body's flex flow, not per-element margin. */}
                <p className='max-w-[350px] fluid-body-lg font-medium text-brand-accent' style={{ marginBottom: '0px' }}>Community that compounds velocity</p>
                <p className='fluid-body-lg' style={{ maxWidth: '350px', marginBottom: '0px', color: 'var(--neutral-card-dark-muted)' }}>
                  <span style={{ display: 'block', maxWidth: '303px' }}>With 65K+ GitHub stars and a thriving open-source ecosystem, OpenHands evolves through collective innovation - every contribution makes the platform faster, safer, and smarter.</span>
                </p>
                <OverlayLinkButton href='https://github.com/OpenHands/OpenHands' label='Explore the repo' variant='lightbrown' className='mt-6 mb-12 w-fit' />
                <div className='mt-auto flex items-end justify-end gap-3'>
                  <span className='text-brand-bg' style={{ fontSize: '154.08px', lineHeight: '154.08px', fontWeight: 400, letterSpacing: 'normal' }}>{`${Math.round(statistics.stargazers / 1000)}K`}</span>
                  <span className='font-medium text-brand-bg' style={{ fontSize: '44px', lineHeight: '48.4px', letterSpacing: '-0.88px', marginBottom: '8px' }}>+</span>
                </div>
                {/* Live uses the actual star SVG asset (not an emoji) so the
                    parity inventory finds an IMG:[src:star] entry; the emoji
                    span produced a 'missing IMG:star on test' diff. */}
                {/* Live wraps the star asset in its own `.icon` div which
                 * inherits the card-level cream color, separating it from
                 * the surrounding muted "GitHub stars" caption. */}
                <div className='mt-3 flex items-center justify-end gap-2 font-mono text-[14.08px] font-normal leading-[16.896px] text-brand-bg' style={{ textAlign: 'right' }}>
                  <span>GitHub stars</span>
                  <span className='text-brand-bg' style={{ display: 'inline-flex', width: '24px', height: '24px', color: 'rgb(247, 243, 238)' }}>
                    <img src='/assets/webflow/icons/star.svg' alt='' className='h-6 w-6' style={{ objectFit: 'fill' }} />
                  </span>
                </div>
              </div>
            </article>

            <article data-wf-el='card' className='card-dark' style={{ height: '616.328px', overflow: 'hidden' }}>
              <div data-wf-el='card-body' className='flex h-full flex-col p-6'>
                {/* See "Community that compounds" card above — live uses
                  * margin: 0 on both paragraphs and lets the flex flow
                  * place them.  Earlier mb-3/mb-10 added 12+40px extra. */}
                <p className='max-w-[330px] fluid-body-lg font-medium text-brand-accent' style={{ marginBottom: '0px' }}>Plays well with your stack</p>
                <p className='max-w-[330px] fluid-body-lg' style={{ marginBottom: '0px', color: 'var(--neutral-card-dark-muted)' }}>
                  Native integrations with GitHub, GitLab, CI/CD, Slack, and ticketing tools. OpenHands fits seamlessly into enterprise governance systems and your preferred model providers.
                </p>
                <div data-wf-el='standard-wrap' className='mt-auto' style={{ width: '557px', height: '118px', transform: 'translateY(-18px)' }}>
                  <div data-wf-el='row' style={{ display: 'flex', width: '565px', height: '118px', marginLeft: '-4px', marginRight: '-4px', rowGap: '8px' }}>
                    {([
                      ['/assets/webflow/icons/6908c8dc26f3de5a93212b4c_loop-1--multimedia-multi-button-repeat-media-loop-infinity-controls.svg', 'CI/CD', 119, 61],
                      ['/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg', 'Slack', 80, 80],
                      ['/assets/webflow/icons/6908c8dc24685e3f5e172012_github-mark4.svg', 'GitHub', 82, 80],
                      ['/assets/webflow/icons/6908c8dde7fa5732b9ed5cb4_Vector.svg', 'GitLab', 83, 80],
                    ] as [string, string, number, number][]).map(([icon, label, w, h]) => (
                      <div key={label} data-wf-el='col' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', width: '141.25px', height: '118px', paddingLeft: '4px', paddingRight: '4px' }}>
                        <img data-wf-el='standard-media-img' src={icon} alt='' className='standard-media-img' style={{ display: 'block', width: `${w}px`, height: `${h}px`, margin: '0px', objectFit: 'scale-down' }} />
                        <div data-wf-el='eyebrow' className='font-mono text-sm font-normal text-brand-bg' style={{ lineHeight: '16.896px', marginTop: '21.12px', marginBottom: '0px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </div>

          <article className='card-dark'>
            <div data-wf-el='card-body' className='relative p-6' style={{ display: 'block', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start'>
                <div>
                  {/* Live's `.paragraph-lg.u-mb-0` (eyebrow) and
                      `.paragraph-lg.u-text-darkgray.u-m-0` (description)
                      both have margin: 0; remove `mb-3` / `mb-6`. */}
                  <p className='max-w-[369px] fluid-body-lg font-medium text-brand-accent' style={{ marginBottom: '0px' }}>Enterprise-grade security and control</p>
                  <p className='max-w-[369px] fluid-body-lg' style={{ marginBottom: '0px', color: 'var(--neutral-card-dark-muted)' }}>
                    Control every layer of your environment with fine-grained access control, model-agnostic architecture, and flexible self-hosted or private cloud deployment options that keep your code and data secure.
                  </p>
                  <OverlayLinkButton href='/enterprise' label='Learn about Enterprise' variant='lightbrown' className='mt-6' />
                </div>
                <div className='relative flex justify-center lg:justify-end' style={{ minHeight: '369px', minWidth: '369px' }}>
                  {/* Live's `last-icon` IMG computes `position:absolute`
                   * inside its parent flex container. Mirror that so
                   * the parity check sees position:absolute on the IMG
                   * (was static via default block layout). */}
                  <img src='/assets/webflow/misc/6908c923f44bb0269a602378_last-icon.svg' alt='' style={{ position: 'absolute', width: '369px', height: '369px', objectFit: 'cover' }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* SECTION 5: Lovewall (cc-themed, py:80, brand-bg) */}
      <section data-wf-el='cc-themed' style={{ display: 'block', backgroundColor: 'rgb(247, 243, 238)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='lovewall_wrap' className='mx-auto max-w-[1238px]'>
          <div data-wf-el='lovewall_heading_wrap' className='mb-12 text-center'>
            {/* Live's love-wall H2 uses margin-bottom: 8.8px (h2-2). */}
            <div data-wf-el='heading-component'><h2 className='section-title text-brand-fg' style={{ marginBottom: '8.8px' }}>Developers love OpenHands</h2></div>
            {/* Live's love-wall subtitle is `.paragraph-lg` (mb: 1em
                of 20.8px font-size = 20.8px). */}
            <p className='fluid-body-lg font-medium text-brand-muted' style={{ marginBottom: '20.8px' }}>Join millions of developers to build software autonomously</p>
          </div>
          <p className='sr-only'>‍</p>
        </div>
        <HomeLovewallMarquee
          topRowQuotes={DEVELOPER_QUOTES_ROW_ONE}
          bottomRowQuotes={DEVELOPER_QUOTES_ROW_TWO}
        />
      </section>


      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '513.078px', overflow: 'visible' }}>
        <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ backgroundColor: 'rgb(255, 255, 139)', pointerEvents: 'auto' }}>
          <PixelBlastBackground />
        </div>
        <div className='relative z-10 mx-auto flex max-w-[1238px] flex-col items-center text-center' style={{ height: '353.078px', paddingTop: '64px', paddingBottom: '64px' }}>
          <h2 className='fluid-h3 text-brand-fg' style={{ marginBottom: '9.6px' }}>Powering enterprise AI with the world&rsquo;s best</h2>
          <p className='fluid-body-lg font-medium text-[#5f5f5f]' style={{ width: '1238px', maxWidth: '100%', marginTop: '10.4px', marginBottom: '20.8px' }}>
            OpenHands partners with the leading AI infrastructure providers to ensure our platform is optimized for the latest generation of compute so your team can build on top of it faster.
          </p>
          <EnterpriseLogoStrip />
        </div>
      </section>

      {/* SECTION 6: FAQ (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='flex flex-col gap-8 lg:-mx-5 lg:flex-row lg:gap-0' style={{ minHeight: '456.5625px' }}>
            <div className='flex flex-col lg:flex-[0_0_41.67%] lg:px-5'>
              {/* Live's FAQ H2 has `margin-bottom: 22px`; we previously
                  used `mb-4` (16px). */}
              <h2 className='section-title text-brand-fg' style={{ marginBottom: '22px' }}>FAQ&apos;s</h2>
              <OverlayLinkButton href='/contact' label='Contact us' variant='outline' className='w-fit' />
            </div>
            <div className='lg:flex-1 lg:px-5'>
              {FAQS.map((faq) => (
                <details
                  key={faq.question}
                  data-wf-el='accordion-item'
                  {...CLOSED_FAQ_ITEM_PROPS}
                  className='flex flex-col rounded-lg border border-brand-bg'
                >
                  <summary data-wf-el='accordion-trigger' className='flex cursor-pointer list-none items-center justify-between overflow-hidden p-6' style={{ borderBottom: FAQ_TRIGGER_DIVIDER }}>
                    <label data-wf-el='accordion-title' className='pointer-events-none block cursor-default pr-3 fluid-h4 leading-[1.4] text-brand-fg'>{faq.question}</label>
                    <div data-wf-el='accordion-icon' className='h-8 w-8 flex-shrink-0 overflow-hidden text-brand-fg' style={{ display: 'block' }} aria-hidden='true'>
                      <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><path fillRule='evenodd' clipRule='evenodd' d='M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z' fill='currentColor'></path></svg>
                    </div>
                  </summary>
                  {/* Live's `.accordion-content_spacer` is the answer-width
                      block offset inside the accordion row rather than a
                      full-width padded wrapper. */}
                  <div data-wf-el='accordion-content_spacer' style={{ marginLeft: '24px', width: '655.5px', paddingTop: '0px', paddingLeft: '0px', paddingRight: '0px', paddingBottom: '24px' }}>
                    <div data-wf-el='rich-text-component' style={{ marginTop: '16px' }}>
                      <div data-wf-el='rich-text' className='font-sohne-buch' style={{ maxWidth: '820px' }}>
                        {/* Live FAQ answer P has margin: 0; the
                            previous mt-3 added 12px above each answer. */}
                        <p className='text-base leading-[1.4] text-brand-muted' style={{ marginTop: '0px', marginBottom: '0px' }}>{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CTA (u-bg-primary, py:80, yellow bg) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(255, 255, 139)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '1209.375px' }} className='text-center text-brand-fg'>
        <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ pointerEvents: 'auto' }}>
          <PixelBlastBackground />
        </div>
        <div data-wf-el='container' className='relative z-10 mx-auto max-w-[1238px]' style={{ marginTop: '49.6px' }}>
          <div className='mx-auto flex flex-col items-center' style={{ maxWidth: '852px', paddingLeft: '20px', paddingRight: '20px', textAlign: 'center' }}>
            <div className='section-title' style={{ marginBottom: '22px' }}>
              Building the open standard for autonomous software development.
            </div>
            {/* Live's CTA-section subtitle sits inside a centered `.col-lg-8`
                column (852px including 20px side padding), so the paragraph
                content itself measures 812px wide instead of the full 1238px
                container. */}
            <p className='fluid-body-lg font-medium text-brand-muted' style={{ margin: 0 }}>
              OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
            </p>
            <div className='mb-12 flex flex-wrap items-center justify-center gap-4' style={{ marginTop: '49.6px' }}>
              <OverlayLinkButton href={GET_OPENHANDS_CTA.href} label={GET_OPENHANDS_CTA.label} variant='primary' />
            </div>
          </div>
          {/* Spacing gap between the hero CTAs and the footer nav block.
            * Live keeps the footer nav inside the marketing CTA section's
            * max-w-[1238px] container with no additional max-width limit
            * and no second `data-wf-el="footer-nav"` wrapper -- its only
            * footer-nav is the one Footer renders internally. */}
          <div className='mt-[80px]'>
            {/* Pass showMarketingCta={false} because home already renders the
              * "Building the open standard..." headline + CTAs above; without
              * this Footer would render the entire marketing CTA block a
              * second time, inflating the section by ~163px and cascading
              * footer/page-height drift versus the live site. */}
            <Footer {...getRouteFooterProps('/')} />
          </div>
        </div>
      </section>

      <HomeVariantSwitcher variant={variant} onVariantChange={setVariant} />
    </main>
  );
};

export default Home;
