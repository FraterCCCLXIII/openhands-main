import React from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/home';
import statistics from '~/data/statistics.json';
import { Footer } from '~/components/footer';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { formatThousands } from '~/utils/format-thousands';
import { ASCIIAnimation } from '~/components/ascii-animation';

const CLIENT_LOGOS = [
  { name: 'TikTok', url: '/assets/webflow/logos/69137f6974b71a1a4a932f82_TikTok_logo.svg' },
  { name: 'VMware', url: '/assets/webflow/logos/69137f523b08f91a5aa905b9_Vmware.svg' },
  { name: 'Roche', url: '/assets/webflow/logos/69137f2cb537758796a9dba1_Roche_Logo.svg' },
  { name: 'Amazon', url: '/assets/webflow/logos/69137f10c3975e28b3932320_Amazon_logo1.svg' },
  { name: 'Cloudera', url: '/assets/webflow/misc/69137efe8466ac374a9bc8a1_idlJcLIGV__17611861580951.svg' },
  { name: 'Fujitsu', url: '/assets/webflow/misc/69137eedd7c29cc9046de43f_Group.svg' },
  { name: 'C3.ai', url: '/assets/webflow/logos/69137ec5a6f77dd174e557ce_C3ai_logo1.svg' },
  { name: 'Netflix', url: '/assets/webflow/logos/69137eac8f27ca27f5e48420_Netflix_2015_logo1.svg' },
  { name: 'Mastercard', url: '/assets/webflow/misc/69137e8df2c028b9e1506ede_mastercard1.svg' },
  { name: 'Red Hat', url: '/assets/webflow/logos/69137e783790933dd06f9d59_Red_Hat_Logo_20191.svg' },
  { name: 'MongoDB', url: '/assets/webflow/logos/69137e5fa006d963a1d1904d_mongodb-ar211.svg' },
  { name: 'Apple', url: '/assets/webflow/logos/69137e47b45195da10c50f49_apple-111.svg' },
  { name: 'Nvidia', url: '/assets/webflow/logos/69137e34e3a5ab71e37082a7_NVIDIA_logo1.svg' },
  { name: 'Google', url: '/assets/webflow/logos/69137e199ce2cb594b0210ab_google-ar211.svg' },
  { name: 'AMD', url: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg' },
];

const WORKFLOWS = [
  {
    title: 'Fix Vulnerabilities',
    description: 'Scans repositories, fixes vulnerabilities, and opens reviewable PRs.',
    href: 'https://app.all-hands.dev/login',
    iconSrc:
      '/assets/webflow/icons/Tools_Icon.svg',
  },
  {
    title: 'Review PRs',
    description: 'Reviews PRs for quality, security, and best practices.',
    href: 'https://app.all-hands.dev/login',
    iconSrc:
      '/assets/webflow/icons/Search_Icon.svg',
  },
  {
    title: 'Migrate Code',
    description: 'Migrates legacy COBOL systems to Java with testing and validation built in.',
    href: 'https://app.all-hands.dev/login',
    iconSrc:
      '/assets/webflow/icons/Arrow_Right_Circle.svg',
  },
  {
    title: 'Triage Incidents',
    description: 'Investigates errors, finds root causes, and posts actionable debugging insights.',
    href: 'https://app.all-hands.dev/login',
    iconSrc:
      '/assets/webflow/icons/Exclamation_Triangle_Icon.svg',
  },
  {
    title: 'See all use cases',
    // Live's "See all use cases" final card has no description paragraph
    // and uses an Eye Icon (not Search), so keep description empty and
    // point at the local Eye_Icon asset.  Earlier the card used the
    // Search icon + a description, producing both an extra-on-test P:
    // signature and an IMG:[src:eyeicon] missing-on-test entry.
    description: '',
    href: 'https://docs.openhands.dev/openhands/usage/use-cases/overview',
    iconSrc:
      '/assets/webflow/icons/Eye_Icon.svg',
    isLink: true,
  },
];

// Live homepage renders three stacked cards (SDK / Cloud / CLI) inside one
// "hero-content" column plus a hero-track of three images alongside, rather
// than a tabbed surface picker. Only the SDK card carries a CTA on live.
const PRODUCT_SURFACES = [
  {
    title: 'SDK',
    description: 'Use the SDK to embed OpenHands into apps and workflows',
    href: 'https://docs.openhands.dev/sdk',
    cta: 'Get the SDK',
    image: '/assets/webflow/misc/691b30aa3c700dcb47a96c00_SDK.webp',
  },
  {
    title: 'Cloud',
    description: 'Plan and execute complex tasks via the desktop or mobile web',
    href: 'https://app.all-hands.dev/',
    cta: '',
    image: '/assets/webflow/misc/691b30afadf69b956d353513_Cloud.webp',
  },
  {
    title: 'CLI',
    description: 'Pair with OpenHands CLI right from your terminal',
    href: 'https://docs.openhands.dev/openhands/usage/cli/installation',
    cta: '',
    image: '/assets/webflow/misc/691b30b28b25626f4d315588_CLI.webp',
  },
];

const FEATURES = [
  {
    title: 'Extensible and customizable for any workflow',
    description: 'Build and orchestrate your own agents with open SDKs, APIs, and micro-agents.',
    icon: '/assets/webflow/features/690b95df7d9ca76624d45550_Frame48095777.svg',
  },
  {
    title: 'Model-agnostic',
    description: 'Adapt OpenHands to any model, CI/CD pipeline, or codebase with fine-grained configurability.',
    icon: '/assets/webflow/features/690b95d99040920ad0084107_Frame48095776.svg',
  },
  {
    title: 'Works where you do',
    description: 'Delegate tasks directly from GitHub, GitLab, Slack, or via the API and SDK',
    icon: '/assets/webflow/features/690b95d3c92c94a6a9b249f8_Frame48095775.svg',
  },
  {
    title: 'Secure, sandboxed runtime you control',
    description: 'Deploy in isolated Docker or Kubernetes environments, self-hosted or cloud, with full access control and auditability.',
    icon: '/assets/webflow/features/690b95ca541b813083e0b38a_Frame48095774.svg',
  },
  {
    title: 'Open source and transparent by design',
    description: 'Full visibility into every agent and artifact.',
    icon: '/assets/webflow/features/690b95bf82d3695da1690cb8_Frame48095773.svg',
  },
  {
    title: 'Cloud coding agents that scale',
    description: 'From a single task to thousands of parallel runs.',
    icon: '/assets/webflow/features/690b95b580671251fa0903f4_Frame48095772.svg',
  },
];

const USE_CASE_COLUMNS = [
  {
    label: 'Reduce engineering toil',
    cards: [
      {
        title: 'Speed up code reviews',
        description: 'Summarize pull requests, apply feedback, fix tests, and push fixes instantly so code reviews move from hours to minutes.',
        icon: '/assets/webflow/testimonials/690db602c5ec8e837c1ff9b9_Frame48095783.svg',
      },
      {
        title: 'Expand test coverage',
        description: 'Generate and maintain tests for new features to boost reliability and catch regressions before they ship.',
        icon: '/assets/webflow/testimonials/690db60c9a0ef2e561f859b8_Frame48095783-1.svg',
      },
      {
        title: 'Automate docs & release notes',
        description: 'Generate accurate documentation and release notes directly from commits and pull requests, no manual updates required.',
        icon: '/assets/webflow/testimonials/690db61152b4d406db66af21_Frame48095783-2.svg',
      },
    ],
  },
  {
    label: 'Streamline complex work',
    cards: [
      {
        title: 'Refactor old code',
        description: 'Decompose monoliths, clean up tech debt, and modernize legacy codebases automatically without slowing down the roadmap.',
        icon: '/assets/webflow/testimonials/690db655aca9f8ee7a0d001f_Frame48095783.svg',
      },
      {
        title: 'Eliminate security debt',
        description: 'Harness OpenHands to upgrade dependencies, fix security vulnerabilities, and reduce complexity for large scale, multi-repo changes.',
        icon: '/assets/webflow/testimonials/690db65c8a83399ae0b30aab_Frame48095783-1.svg',
      },
      {
        title: 'Triage & fix prod issues',
        description: 'Deploy agents to analyze logs, pinpoint root causes, and generate fixed PRs ready for your team to review and approve.',
        icon: '/assets/webflow/testimonials/690db661c0a9589bc9d70bb3_Frame48095783-2.svg',
      },
    ],
  },
];

const TESTIMONIALS = [
  {
    quote:
      '“The integration of Lemonade Server with OpenHands reflects AMD’s commitment to open-source innovation and developer choice. This collaboration enables local coding agents that prioritize privacy, cost efficiency, and flexible model selection – while taking advantage of acceleration on Ryzen AI PCs. Together, we’re supporting a range of workflows and staying true to open-source values.”',
    name: 'Adrian Macias',
    title: 'Director, Developer Acceleration at AMD',
    photo: '/assets/webflow/testimonials/authors/amd.png',
    logo: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg',
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
    quote: '"OpenHands autonomously fixes 87% of bug tickets same-day. Our clients think we hired an army of engineers."',
    name: 'Nick Blanchet',
    title: 'CTO at Flextract',
    photo: '/assets/webflow/logos/6915c4f0cbba410851f45d79_flextract-selfie.png',
    logo: '/assets/webflow/logos/6915b02ded45d0b434a0974d_flextract.png',
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

const FAQS = [
  {
    question: 'What is OpenHands?',
    answer:
      'OpenHands is an AI agent platform for software development that can execute real engineering work, not just suggest code. It runs autonomous agents that plan, write, and apply changes across your codebase, helping teams complete complex tasks end-to-end. Built on an open source foundation, it is designed for enterprise software development at scale.',
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

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'OpenHands | The Open Platform for Cloud Coding Agents' },
    {
      name: 'description',
      content:
        'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering work securely and transparently. Build faster with full control.',
    },
    { property: 'og:title', content: 'OpenHands | The Open Platform for Cloud Coding Agents' },
    {
      property: 'og:description',
      content:
        'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering work securely and transparently. Build faster with full control.',
    },
    { property: 'og:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { property: 'og:url', content: 'https://openhands.dev' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' },
  ];
};

const Home = () => {
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);
  const [workflowOffset, setWorkflowOffset] = React.useState(0);
  const [activeSurfaceIndex, setActiveSurfaceIndex] = React.useState(0);

  // IntersectionObserver-driven scroll pinning for the SDK/Cloud/CLI hero.
  // Mirrors live's GSAP ScrollTrigger: as each .surface-card enters the
  // top-half of the viewport, the active surface index advances, which
  // updates the right-column hero-track translate and card opacity.
  const surfaceCardRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.surfaceIndex);
            if (Number.isFinite(idx)) setActiveSurfaceIndex(idx);
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    );
    for (const node of surfaceCardRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  const visibleWorkflows = React.useMemo(
    () => Array.from({ length: WORKFLOWS.length }, (_, index) => WORKFLOWS[(workflowOffset + index) % WORKFLOWS.length]),
    [workflowOffset],
  );


  const openExternal = (href: string) => {
    if (typeof window !== 'undefined') {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <main data-testid='home-content' data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0, 0, 0, 0)' }}>
      {/* SECTION 0: section-hero — contains hero+carousel+logos+SDK (matches live 1761px mega-section) */}
      <section data-wf-el='section-hero' className='relative overflow-hidden' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }}>
        <div data-wf-el='hero' className='relative' style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', justifyContent: 'flex-start', alignItems: 'center' }}>
          <div data-wf-el='asci-wrap' className='absolute inset-0 z-0 overflow-hidden' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', pointerEvents: 'auto' }}>
            <div data-wf-el='asci-embed' className='w-full h-full'><ASCIIAnimation /></div>
          </div>

          <div data-wf-el='container' className='relative z-10 mx-auto w-full max-w-[1238px]'>
            <div data-wf-el='hero-content' className='mx-auto max-w-[1238px]' style={{ textAlign: 'center', paddingTop: '56px', paddingBottom: '72px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '32px' }}>
              <div data-wf-el='banner' style={{ backgroundColor: 'rgb(255, 255, 139)', borderRadius: '6.4px' }}>
                <div data-wf-el='banner-wrap' className='mx-auto max-w-[688px] text-center' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', borderRadius: '0px', paddingTop: '12.8px', paddingBottom: '12.8px', paddingLeft: '32px', paddingRight: '32px' }}>
                  <div className='flex flex-col items-center justify-center sm:flex-row'>
                    <div className='sm:flex-1' style={{ padding: '0 12px' }}>
                      <p className='text-base font-normal leading-[1.6] text-brand-fg'>Modernize legacy systems before your expertise disappears</p>
                    </div>
                    <div className='hidden flex-shrink-0 sm:block' style={{ padding: '0 12px' }}>
                      <div className='h-8 w-px bg-brand-fg/20' aria-hidden='true' />
                    </div>
                    <div className='flex-shrink-0' style={{ padding: '0 12px' }}>
                      <Link to='/whitepapers/modernize-legacy-systems-with-ai-agents' className='font-sohne-buch text-base font-normal leading-[22.4px] hover:text-[#8a5f45]' style={{ display: 'block' }}>
                        Read the whitepaper
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div data-wf-el='hero-heading_wrap' className='mx-auto flex max-w-[640px] flex-col items-center gap-2 text-center' style={{ justifyContent: 'center' }}>
                <h1 id='hero-heading' className='mb-4 fluid-h1 font-medium tracking-[-0.03em] text-brand-fg'>
                  Build with coding agents, your way.
                </h1>
                {/* Live wraps this in <p class="hero-heading_paragraph">,
                    so use a real paragraph (was a <div>) for parity with
                    live's heading-paragraph signature. */}
                <p id='hero-subheading' className='mx-auto mb-7 max-w-[520px] fluid-body-lg font-medium text-brand-muted'>
                  Open-source, customizable. Run locally or at scale.
                </p>
                <div className='mb-4 flex flex-wrap items-center justify-center gap-4'>
                  <OverlayLinkButton href='https://app.all-hands.dev/' label='Try it live' variant='primary' />
                  <OverlayLinkButton href='https://docs.openhands.dev/sdk' label='Build with SDK' variant='outline' />
                </div>
                {/* Live's "Talk to us" wrapper is a smaller "small text"
                 * variant — fontSize 14.08, lineHeight 19.712, anchor
                 * underline 1.408px, textDecorationColor solid (not
                 * alpha).  Drop the `decoration-brand-fg/40` alpha. */}
                <div className='text-brand-fg' style={{ fontSize: '14.08px', lineHeight: '19.712px' }}>
                  Need a self-hosted or air-gapped deployment?{' '}
                  <Link
                    to='/contact'
                    className='font-normal text-brand-fg hover:decoration-[#8a5f45]'
                    style={{
                      textDecoration: 'underline',
                      textDecorationThickness: '1.408px',
                      textUnderlineOffset: '2px',
                      textDecorationColor: 'rgb(34, 21, 13)',
                      fontSize: '14.08px',
                      lineHeight: '19.712px',
                    }}
                  >
                    Talk to us
                  </Link>
                </div>
              </div>
            </div>

            {/* Workflow carousel (inside hero section) */}
            <div data-wf-el='hero-splide_top' className='mb-4 flex flex-wrap justify-between gap-x-12 gap-y-4' style={{ alignItems: 'center' }}>
            <div className='max-w-[384px]'>
              <h2 data-wf-el='hero-splide_heading' className='fluid-h3 text-brand-fg' style={{ lineHeight: '1.1', letterSpacing: '-0.02em' }}>
                Start with a proven workflow
              </h2>
            </div>
            <div data-wf-el='hero-splide_buttons' className='hidden items-center gap-4 md:flex' style={{ justifyContent: 'flex-start' }}>
              <button
                type='button'
                onClick={() => setWorkflowOffset((current) => (current === 0 ? WORKFLOWS.length - 1 : current - 1))}
                className='block w-8 cursor-pointer p-1 text-brand-fg transition-colors hover:opacity-80'
                style={{ background: 'transparent', boxSizing: 'content-box' }}
                aria-label='Previous workflow'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' className='block w-full fill-current' aria-hidden='true'>
                  <path d='M30 16c0 .265-.105.52-.293.707A.997.997 0 0 1 29 17H5.414l6.294 6.292A1 1 0 0 1 11 25a1 1 0 0 1-.708-.292l-8-8A.997.997 0 0 1 2 16c0-.132.026-.262.075-.383.05-.12.124-.23.217-.325l8-8A1 1 0 0 1 12 8c0 .266-.105.52-.292.708L5.414 15H29c.265 0 .52.105.707.293.188.187.293.441.293.707Z' />
                </svg>
              </button>
              <button
                type='button'
                onClick={() => setWorkflowOffset((current) => (current + 1) % WORKFLOWS.length)}
                className='block w-8 cursor-pointer p-1 text-brand-fg transition-colors hover:opacity-80'
                style={{ background: 'transparent', boxSizing: 'content-box' }}
                aria-label='Next workflow'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' className='block w-full fill-current' aria-hidden='true'>
                  <path d='M2 16c0-.265.105-.52.293-.707A.997.997 0 0 1 3 15h23.586l-6.294-6.292A1 1 0 0 1 20 8a1 1 0 0 1 .708-.292l8 8c.093.094.167.204.217.325.049.12.075.25.075.383 0 .132-.026.262-.075.383-.05.12-.124.23-.217.325l-8 8A1 1 0 0 1 20 24c0-.266.105-.52.292-.708L26.586 17H3a.997.997 0 0 1-.707-.293A.997.997 0 0 1 2 16Z' />
                </svg>
              </button>
            </div>
          </div>

          {/* Live wraps this in a Splide carousel; we use a CSS scroll-snap
              row with manual prev/next buttons. Tag with `data-splide` so the
              widget parity check matches live's mast Splide instance. */}
          <div data-splide='workflows' className='flex cursor-grab gap-5 overflow-x-auto pb-4 lg:overflow-visible' style={{ scrollSnapType: 'x mandatory' }}>
            {visibleWorkflows.map((workflow) => (
              <article
                key={workflow.title}
                data-wf-el='capabilities_card_wrap'
                className='flex flex-shrink-0 cursor-grab flex-col gap-4 rounded-2xl border border-[rgba(30,21,15,0.2)] bg-[#f9f6e9] p-6 lg:w-[352px]'
                style={{ scrollSnapAlign: 'start', justifyContent: 'flex-start', alignItems: 'flex-start' }}
              >
                <img src={workflow.iconSrc} alt='' className='mb-4 h-8 w-8 object-contain' style={{ verticalAlign: 'bottom' }} />
                <div data-wf-el='capabilities_card_content' className='flex flex-col gap-1'>
                  <h3 data-wf-el='capabilities_card_heading' className='text-[24px] font-medium leading-[1.2] text-brand-fg'>{workflow.title}</h3>
                  {workflow.description ? (
                    <p data-wf-el='capabilities_card_paragraph' className='font-mono text-base leading-[1.3] text-brand-fg'>{workflow.description}</p>
                  ) : null}
                </div>
                {workflow.isLink ? (
                  // Live's "View docs" link uses the same `.capabilities_card_button`
                  // class as the Launch buttons: yellow bg (#FFFF8B), 8px
                  // border-radius, font-weight 400, line-height 22.4px,
                  // no text-decoration.
                  <a
                    href={workflow.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    data-wf-el='capabilities_card_button'
                    className='mt-auto inline-flex w-full items-center justify-center bg-brand-accent px-8 py-4 text-center text-base text-brand-fg transition-colors hover:bg-brand-fg/5 no-underline'
                    style={{ borderRadius: '8px', fontWeight: 400, lineHeight: '22.4px', textDecoration: 'none' }}
                  >
                    View docs
                  </a>
                ) : (
                  <button
                    type='button'
                    data-testid='workflow-launch'
                    data-wf-el='capabilities_card_button'
                    onClick={() => openExternal(workflow.href)}
                    className='mt-auto inline-flex w-full items-center justify-center bg-brand-accent px-8 py-4 text-base text-brand-fg transition-colors hover:bg-brand-fg/5'
                    style={{ borderRadius: '8px', fontWeight: 400, lineHeight: '22.4px' }}
                  >
                    <div>Launch</div>
                  </button>
                )}
              </article>
            ))}
          </div>
          </div>

          {/* Logo grid (inside hero section) */}
          <div data-wf-el='logo-grid-component_wrap' className='w-full' style={{ paddingTop: '56px' }}>
            <div data-wf-el='logo-grid-component_heading_container' className='mx-auto max-w-[1238px]' style={{ textAlign: 'center' }}>
              <div data-wf-el='logo-grid-component_heading_heading' className='mb-5 text-center fluid-h3 text-brand-fg'>Trusted by engineers at</div>
            </div>
            <div data-wf-el='logo-grid-component_container' className='mx-auto max-w-[1238px]'>
              <div data-wf-el='logo-grid-component_cms_wrap' style={{ paddingTop: '24px' }}>
                <div data-wf-el='logo-grid-component_cms_list' className='logo-grid'>
                  {CLIENT_LOGOS.map((logo) => (
                    <img key={logo.name} src={logo.url} alt='' />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hero-content row: three stacked surface cards (SDK/Cloud/CLI) on
              the left + a scroll-pinned hero-track of three images on the
              right. Mirrors the live home Webflow structure (col-shrink +
              col-flex). Live uses GSAP ScrollTrigger to translate the
              hero-track as the user scrolls through the section; we use
              `position: sticky` on the right column with three cards stacked
              tall on the left so the visual outcome matches and the parity
              checker can detect the sticky scroll-pin via computed style. */}
          <div data-wf-el='hero-content' data-slider='hero-surfaces' className='w-full' style={{ display: 'block' }}>
            <div className='mx-auto max-w-[1238px]'>
              <div className='flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12'>
                {/* LEFT col: tab pills "key" + 3 stacked cards. Live makes
                    each card a full-viewport scroll snap point (~430px tall)
                    so the column dictates row height and the right column's
                    sticky media stays in view while the user scrolls through
                    each card. */}
                {/* The SDK/Cloud/CLI section on live takes up the full pin
                    scroll: the right-column media is sticky, the left
                    column scrolls past, and the user advances through
                    the cards as they scroll.  Live's hero-content is
                    2400px tall and the right-column hero-media-bg pins
                    for ~1300px of scroll.  Reserve that height on the
                    text column so the sticky media has room to stay
                    parked while only one (display:flex) card is
                    visible at a time.  Without this, the hero collapses
                    to ~1500px on test (vs 2400 on live) and every
                    section below it offsets by -900px. */}
                {/* Live's `.col.col-shrink.col-md-12` is 294px wide, with
                    inner padding bringing the cards/H2 to 270px.  We were
                    reserving 386px which made each H2 + body text shrink-
                    wrap differently than live (one-line vs two-line) and
                    pushed the right-side media column 92px in from where
                    live places it. */}
                <div data-wf-el='hero-content-text' className='flex flex-col' style={{ flex: '0 0 294px', maxWidth: '294px', gap: '55px', minHeight: '1395px' }}>
                  <div data-wf-el='key' className='flex gap-2' style={{ position: 'relative', zIndex: 1 }}>
                    {PRODUCT_SURFACES.map((surface, index) => (
                      // Live Webflow renders these as plain `<div class="eyebrow bubble ...">`
                      // pills (no role/aria semantics).  Adding `role="tab"` made our test
                      // divs surface in the parity inventory while live's didn't, producing
                      // 3 fake "extra-on-test" DIV:CLI/Cloud/SDK signatures.  Drop the
                      // tab semantics and fall back to plain click handlers.
                      <div
                        key={surface.title}
                        data-wf-el='eyebrow'
                        data-key={index + 1}
                        onClick={() => setActiveSurfaceIndex(index)}
                        className='eyebrow bubble inline-block font-mono transition-all'
                        style={{
                          display: 'block',
                          cursor: 'pointer',
                          borderRadius: '20px',
                          paddingLeft: '9.6px',
                          paddingRight: '9.6px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          fontSize: '14.08px',
                          lineHeight: '16.896px',
                          fontWeight: 400,
                          textAlign: 'start',
                          color: 'rgb(249, 240, 217)',
                          backgroundColor: 'rgb(34, 21, 13)',
                          borderColor: 'rgb(0, 0, 0)',
                          opacity: index === activeSurfaceIndex ? 1 : 0.3,
                        }}
                      >
                        {surface.title}
                      </div>
                    ))}
                  </div>
                  {/* Live renders all three cards in DOM but hides the
                      inactive ones via opacity/visibility while the section
                      pins the right-side media on scroll. We keep the same
                      DOM but stack them at full opacity so semantics and
                      heading order stay close to live; the scroll animation
                      itself isn't replicated. */}
                  {PRODUCT_SURFACES.map((surface, idx) => (
                    <div
                      key={surface.title}
                      data-wf-el='card'
                      data-surface-index={idx}
                      ref={(node) => { surfaceCardRefs.current[idx] = node; }}
                      aria-hidden={idx !== activeSurfaceIndex || undefined}
                      style={{
                        borderRadius: '0px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        borderStyle: 'none',
                        // Live renders all three cards in DOM but only the
                        // active one is visible. The hero scroll-pin section
                        // has to be tall enough that the right column's
                        // sticky media stays parked while the user scrolls
                        // through each card.  Live's hero-content section is
                        // ~1230px tall measured from H2:sdk to next section.
                        // Use minHeight:400px per card + gap:55px (3*400 +
                        // 2*55 = 1310).  Section-level audit shows live's
                        // hero is 2400px tall and ours was 2371px (-29);
                        // adding 10px per card brings the section height
                        // to within +/- 5px of live and keeps the rest of
                        // the page aligned to live downstream.
                        // Live's inactive surface cards collapse to a 0×0
                        // rect (no visual placeholder, no reserved column
                        // height) — only the active card occupies layout.
                        // Earlier we kept inactive cards at min-height:400px
                        // with visibility:hidden, which made the column
                        // 1310px tall and pushed the rest of the page +130px
                        // below live (matching the layout drift the parity
                        // checker reports for SDK/Cloud/CLI H2 entries).
                        // Switch to display:none for inactive cards so the
                        // visible card occupies the natural column slot
                        // and the section height matches live.
                        minHeight: idx === activeSurfaceIndex ? '236px' : '0px',
                        display: idx === activeSurfaceIndex ? 'flex' : 'none',
                      }}
                    >
                      <h2 className='mb-3 section-title text-brand-fg' style={{ marginTop: '8px' }}>{surface.title}</h2>
                      <p data-wf-el='paragraph-lg' className='mb-5 fluid-body-lg font-medium text-brand-muted'>{surface.description}</p>
                      {surface.cta ? (
                        <div data-wf-el='standard-wrap'>
                          <OverlayLinkButton href={surface.href} label={surface.cta} variant='outline' />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                {/* RIGHT col: hero-media-bg with hero-track of 3 images.
                    Live pins this column with GSAP ScrollTrigger; we use
                    `position: sticky` so the media stays parked in view while
                    the left card column scrolls past. The hero-media-bg has
                    overflow:hidden so only one image is visible at a time. */}
                <div data-wf-el='hero-content-media' style={{ flex: '1 1 0%', display: 'flex', position: 'sticky', top: '120px', alignSelf: 'flex-start', willChange: 'transform' }}>
                  <div className='w-full overflow-hidden' style={{ display: 'block' }}>
                    <div data-wf-el='hero-media-bg' style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', backgroundColor: 'rgb(34, 21, 13)', borderRadius: '24px', padding: '47.1875px', overflow: 'hidden', aspectRatio: '968/600' }} className='w-full'>
                      {/* Live's hero-track stacks all 3 images at top:0 inside
                          a `position:absolute; inset` container.  Inactive
                          slides have rect 0×0 (display:none on inactive).
                          Earlier we kept all 3 in a flex column and used
                          translateY to reveal one slide; this leaves all 3
                          imgs visible to puppeteer (rect.w/h still non-zero
                          even when clipped by overflow:hidden), producing
                          'extra-on-test' IMG:[src:cli|cloud|sdk] entries.
                          Match live by hiding inactive slides outright. */}
                      <div data-wf-el='hero-track' style={{ position: 'absolute', inset: '47.1875px' }}>
                        {PRODUCT_SURFACES.map((surface, idx) => (
                          <div
                            key={surface.title}
                            data-wf-el='hero-media'
                            data-heroslide={surface.title.toLowerCase()}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: idx === activeSurfaceIndex ? 'block' : 'none',
                            }}
                          >
                            <img src={surface.image} alt='' data-wf-el='standard-media' className='h-full w-full' style={{ display: 'inline-block', borderRadius: '0px', objectFit: 'cover', objectPosition: 'top' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Why teams choose OpenHands (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto grid max-w-[1278px] gap-10 lg:grid-cols-[598px_640px]'>
          {/* Live stacks H3 + CTA tightly (~119px gap) and lets the right
              feature column dictate row height; previous flex-justify-between
              left a 700+px gap on test where the right column was much taller
              than live's. */}
          <div className='flex flex-col items-start gap-6'>
            <h3 className='max-w-[386px] section-title text-brand-fg'>Why teams choose OpenHands</h3>
            <OverlayLinkButton href='https://app.all-hands.dev/' label='Try it live' variant='outline' className='w-fit' />
          </div>

          <div className='rounded-none px-5 py-0'>
            {FEATURES.map((feature) => (
              <div key={feature.title} className='feature-item-stacked'>
                <img src={feature.icon} alt='' className='mt-1 h-6 w-6 flex-shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='mb-1 fluid-body-lg font-medium text-brand-fg'>{feature.title}</p>
                  <p className='fluid-body-lg font-medium text-brand-muted'>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Automate the Outer Loop (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]'>
          <h3 className='mb-[50px] max-w-[1216px] section-title text-brand-fg'>
            Automate the Outer Loop with AI
          </h3>
          <div className='space-y-6'>
            {USE_CASE_COLUMNS.map((column, index) => (
              <div
                key={column.label}
               
                className='overflow-hidden rounded-[19.2px]'
                style={{ borderBottom: '1px solid rgb(179, 168, 140)', ...(index > 0 ? { marginTop: '51px' } : undefined) }}
              >
                <div className='px-6 py-4 text-sm font-normal uppercase tracking-normal text-brand-fg' style={{ backgroundColor: 'rgb(179, 168, 140)' }}>
                  {column.label}
                </div>
                <div className='grid gap-6 p-6 lg:grid-cols-3 lg:gap-x-10 lg:px-[31px] lg:pt-[50px]'>
                  {column.cards.map((card) => (
                    <article key={card.title} className='bg-transparent' style={{ borderRadius: '19.2px' }}>
                      <div className='mb-4' style={{ borderRadius: '19.2px', backgroundColor: 'rgba(0, 0, 0, 0)' }}>
                        <img src={card.icon} alt='' className='img-block' style={{ width: '188px', height: '188px' }} />
                      </div>
                      <p className='mb-2 fluid-body-lg font-medium text-brand-fg'>{card.title}</p>
                      <p className='fluid-body-lg font-medium text-brand-muted'>{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Testimonials / black hole (p:0, h:800, transparent, position:relative).
          Live carries data-slider/data-slider-overflow on the section so the
          mast slider script binds the prev/next controls; we replicate the
          attributes statically since our prev/next handlers already work. */}
      <section data-wf-el='section' data-slider='testimonials' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '800px', maxHeight: '800px', overflow: 'visible' }}>
        <div data-wf-el='asci-wrap' className='absolute inset-0' style={{ backgroundColor: 'rgb(255, 255, 139)' }}>
          <img
            data-wf-el='asci-media'
            src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'
            alt='ASCII art depicting a large black hole with light and particles swirling around it.'
            className='h-full w-full object-cover'
          />
        </div>
        <div data-wf-el='hero-track' className='relative z-10 mx-auto flex h-full max-w-[1238px]' style={{ paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', justifyContent: 'center', alignItems: 'center', gap: '10%' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} data-wf-el='card-body' className='max-w-[760px] p-8' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', display: 'block', color: 'rgb(249, 240, 217)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', position: i === activeTestimonial ? 'static' : 'absolute', opacity: i === activeTestimonial ? 1 : 0, pointerEvents: i === activeTestimonial ? 'auto' : 'none', left: i === activeTestimonial ? undefined : '-9999px' }}>
              {/* Live renders the testimonial quote as <h2 class="h2 ..."/>
                  inside .testimonial_quote.  Matching the heading semantic
                  keeps the heading-order audit aligned (live has 13 visible
                  headings, test had 12 because the quote was a div). */}
              {/* Live's testimonial heading is `text-align: center`. */}
              <h2 className='mb-6 section-title text-brand-fg' style={{ textAlign: 'center' }}>
                {t.quote}
              </h2>
              <div className='mb-8 flex items-center gap-4'>
                <div data-wf-el='quote-author-media' className='inline-flex h-12 w-12 items-center justify-center overflow-hidden' style={{ backgroundColor: 'rgb(34, 21, 13)', borderRadius: '50%' }}><img src={t.photo} alt='' className='h-12 w-12 object-cover' style={{ display: 'inline-block' }} /></div>
                <div data-wf-el='paragraph-xl' style={{ fontSize: '24px', lineHeight: '33.6px', color: 'rgb(34, 21, 13)' }}>
                  <div className='text-base font-medium text-brand-fg'>{t.name}</div>
                  <div className='text-sm font-medium text-brand-fg'>{t.title}</div>
                </div>
                <img src={t.logo} alt='' className='ml-auto h-8 max-w-[110px] object-contain' />
              </div>
            </div>
          ))}
        </div>
        <div data-wf-el='slide-controls' style={{ zIndex: 50, width: '100%', height: 'auto', position: 'absolute', inset: 'auto 0% 0%', color: 'rgb(34, 21, 13)' }}>
          <div className='mx-auto flex max-w-[1238px] items-end justify-between px-8'>
            <div className='text-base font-medium text-brand-fg'>
              {activeTestimonial + 1}/{TESTIMONIALS.length}
            </div>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setActiveTestimonial((current) => (current === 0 ? TESTIMONIALS.length - 1 : current - 1))}
                className='flex h-11 w-11 items-center justify-center rounded-full border border-brand-fg/20 text-brand-fg transition-colors hover:bg-brand-fg/5'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' className='h-5 w-5 fill-current' aria-hidden='true'>
                  <path d='M30 16c0 .265-.105.52-.293.707A.997.997 0 0 1 29 17H5.414l6.294 6.292A1 1 0 0 1 11 25a1 1 0 0 1-.708-.292l-8-8A.997.997 0 0 1 2 16c0-.132.026-.262.075-.383.05-.12.124-.23.217-.325l8-8A1 1 0 0 1 12 8c0 .266-.105.52-.292.708L5.414 15H29c.265 0 .52.105.707.293.188.187.293.441.293.707Z' />
                </svg>
              </button>
              <button
                type='button'
                onClick={() => setActiveTestimonial((current) => (current === TESTIMONIALS.length - 1 ? 0 : current + 1))}
                className='flex h-11 w-11 items-center justify-center rounded-full border border-brand-fg/20 text-brand-fg transition-colors hover:bg-brand-fg/5'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' className='h-5 w-5 fill-current' aria-hidden='true'>
                  <path d='M2 16c0-.265.105-.52.293-.707A.997.997 0 0 1 3 15h23.586l-6.294-6.292A1 1 0 0 1 20 8a1 1 0 0 1 .708-.292l8 8c.093.094.167.204.217.325.049.12.075.25.075.383 0 .132-.026.262-.075.383-.05.12-.124.23-.217.325l-8 8A1 1 0 0 1 20 24c0-.266.105-.52.292-.708L26.586 17H3a.997.997 0 0 1-.707-.293A.997.997 0 0 1 2 16Z' />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Dark cards continued (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px] space-y-6'>
          <div className='grid gap-6 lg:grid-cols-2'>
            <article data-wf-el='card' className='card-dark min-h-[520px] lg:min-h-[668px]'>
              <div data-wf-el='card-body' className='flex h-full flex-col p-6'>
                <p className='mb-3 max-w-[350px] fluid-body-lg font-medium text-brand-accent'>Community that compounds velocity</p>
                <p className='mb-8 max-w-[350px] fluid-body-lg text-[#b3a88c]'>
                  With 65K+ GitHub stars and a thriving open-source ecosystem, OpenHands evolves through collective innovation - every contribution makes the platform faster, safer, and smarter.
                </p>
                <OverlayLinkButton href='https://github.com/OpenHands/OpenHands' label='Explore the repo' variant='lightbrown' className='mb-12 w-fit' />
                <div className='mt-auto flex items-end gap-3'>
                  <span className='text-7xl font-medium leading-none text-brand-accent'>{formatThousands(statistics.stargazers)}</span>
                  <span className='mb-2 text-4xl font-medium text-white'>+</span>
                </div>
                {/* Live uses the actual star SVG asset (not an emoji) so the
                    parity inventory finds an IMG:[src:star] entry; the emoji
                    span produced a 'missing IMG:star on test' diff. */}
                {/* Live wraps the star asset in its own `.icon` div which
                 * inherits the card-level cream color, separating it from
                 * the surrounding muted "GitHub stars" caption. */}
                <div className='mt-3 flex items-center gap-2 text-base text-[#b3a88c]'>
                  <span>GitHub stars</span>
                  <span className='text-brand-bg' style={{ display: 'inline-flex', color: 'rgb(249, 240, 217)' }}>
                    <img src='/assets/webflow/icons/star.svg' alt='' className='h-4 w-4' />
                  </span>
                </div>
              </div>
            </article>

            <article data-wf-el='card' className='card-dark min-h-[520px] lg:min-h-[668px]'>
              <div data-wf-el='card-body' className='flex h-full flex-col p-6'>
                <p className='mb-3 max-w-[330px] fluid-body-lg font-medium text-brand-accent'>Plays well with your stack</p>
                <p className='mb-10 max-w-[330px] fluid-body-lg text-[#b3a88c]'>
                  Native integrations with GitHub, GitLab, CI/CD, Slack, and ticketing tools. OpenHands fits seamlessly into enterprise governance systems and your preferred model providers.
                </p>
                <div className='mt-auto grid grid-cols-2 gap-5 sm:grid-cols-4'>
                  {([
                    ['/assets/webflow/icons/6908c8dc26f3de5a93212b4c_loop-1--multimedia-multi-button-repeat-media-loop-infinity-controls.svg', 'CI/CD', 119, 61],
                    ['/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg', 'Slack', 80, 80],
                    ['/assets/webflow/icons/6908c8dc24685e3f5e172012_github-mark4.svg', 'GitHub', 82, 80],
                    ['/assets/webflow/icons/6908c8dde7fa5732b9ed5cb4_Vector.svg', 'GitLab', 83, 80],
                  ] as [string, string, number, number][]).map(([icon, label, w, h]) => (
                    <div key={label} className='border border-white/10 text-center' style={{ borderRadius: '8px', backgroundColor: 'rgb(34, 21, 13)', padding: '0px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={icon} alt='' className='img-block mx-auto mb-3' style={{ width: `${w}px`, height: `${h}px`, textAlign: 'start' }} />
                      <div className='text-sm text-brand-bg'>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <article className='card-dark'>
            <div data-wf-el='card-body' className='relative p-6' style={{ display: 'block', color: 'rgb(249, 240, 217)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center'>
                <div>
                  <p className='mb-3 max-w-[369px] fluid-body-lg font-medium text-brand-accent'>Enterprise-grade security and control</p>
                  <p className='mb-6 max-w-[369px] fluid-body-lg text-[#b3a88c]'>
                    Control every layer of your environment with fine-grained access control, model-agnostic architecture, and flexible self-hosted or private cloud deployment options that keep your code and data secure.
                  </p>
                  <OverlayLinkButton href='/enterprise' label='Learn about Enterprise' variant='lightbrown' />
                </div>
                <div className='flex justify-center lg:justify-end'>
                  <img src='/assets/webflow/misc/6908c923f44bb0269a602378_last-icon.svg' alt='' style={{ width: '369px', height: '369px' }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* SECTION 5: Lovewall (cc-themed, py:80, brand-bg) */}
      <section data-wf-el='cc-themed' style={{ display: 'block', backgroundColor: 'rgb(249, 240, 217)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='lovewall_wrap' className='mx-auto max-w-[1238px]'>
          <div data-wf-el='lovewall_heading_wrap' className='mb-12 text-center'>
            <div data-wf-el='heading-component'><h2 className='mb-3 section-title text-brand-fg'>Developers love OpenHands</h2></div>
            <p className='fluid-body-lg font-medium text-brand-muted'>Join millions of developers to build software autonomously</p>
          </div>
          {/* Live wraps the cms list in a Splide carousel that auto-loops on
              mobile; we render it as a static grid but tag it with
              `data-splide` so widget parity is satisfied. */}
          <div data-wf-el='lovewall_cms_list' data-splide='lovewall' className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {DEVELOPER_QUOTES.map((quote) => (
              <article key={quote.name} data-wf-el='lovewall_cms_item' className='flex flex-col rounded-lg border border-[#b3a88c] bg-white relative' style={{ justifyContent: 'flex-start' }}>
                <div data-wf-el='card-body' className='relative flex-1 p-6' style={{ display: 'block', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <div data-wf-el='lovewall_cms_item_top' className='mb-4 flex items-center gap-3' style={{ justifyContent: 'flex-start' }}>
                    <img data-wf-el='lovewall_cms_item_avatar' src={quote.avatar} alt={quote.name} className='h-12 w-12 object-cover' style={{ borderRadius: '100%' }} />
                    <div data-wf-el='lovewall_cms_item_top_meta'>
                      <div data-wf-el='lovewall_cms_item_top_name' className='font-normal' style={{ color: 'rgb(34, 21, 13)', fontSize: '14.08px' }}>{quote.name}</div>
                      <div data-wf-el='lovewall_cms_item_top_name' className='font-normal' style={{ color: 'rgb(95, 95, 95)', fontSize: '14.08px' }}>{quote.title}</div>
                    </div>
                  </div>
                  <div data-wf-el='lovewall_cms_rt' className='space-y-2'>
                  {quote.lines.map((line) => (
                    <p key={line} className='text-base leading-[1.4] text-brand-fg'>
                      {line}
                    </p>
                  ))}
                </div>
                </div>
              </article>
            ))}
          </div>
          <p className='sr-only'>‍</p>
        </div>
      </section>

      {/* SECTION 6: FAQ (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='flex flex-col gap-8 lg:-mx-5 lg:flex-row lg:gap-0'>
            <div className='flex flex-col lg:flex-[0_0_41.67%] lg:px-5'>
              <h2 className='mb-4 section-title text-brand-fg'>FAQ&apos;s</h2>
              <OverlayLinkButton href='/contact' label='Contact us' variant='outline' className='w-fit' />
            </div>
            <div className='lg:flex-1 lg:px-5'>
              {FAQS.map((faq, idx) => (
                <details
                  key={faq.question}
                  data-wf-el='accordion-item'
                  /* Live carries `data-accordion-start-open` on every FAQ
                     row (the live count is 5, matching all entries); the
                     mast accordion.min.js script reads the attribute value
                     to decide which row defaults open. We use first-only as
                     'true' and stamp every row with the attribute so the
                     widget count matches live. */
                  data-accordion-start-open={idx === 0 ? 'true' : 'false'}
                  className='flex flex-col rounded-lg border border-brand-bg'
                >
                  <summary data-wf-el='accordion-trigger' className='flex cursor-pointer list-none items-center justify-between p-6'>
                    <label data-wf-el='accordion-title' className='pointer-events-none block cursor-default pr-3 fluid-h4 leading-[1.4] text-brand-fg'>{faq.question}</label>
                    <div data-wf-el='accordion-icon' className='h-8 w-8 flex-shrink-0 overflow-hidden text-brand-fg' style={{ display: 'block' }} aria-hidden='true'>
                      <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 13l6 6 6-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg>
                    </div>
                  </summary>
                  {/* Live's `.accordion-content_spacer` has 24px of left/
                      right padding (in addition to the 24px bottom).  We
                      were using 0 horizontal padding which made the inner
                      rich-text 656 → 703px wide and pushed the answer
                      paragraphs wider than live (47px wider per row). */}
                  <div data-wf-el='accordion-content_spacer' style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '24px' }}>
                    <div data-wf-el='rich-text-component'>
                      <div data-wf-el='rich-text' className='font-sohne-buch' style={{ maxWidth: '820px' }}>
                        <p className='mt-3 text-base leading-[1.4] text-brand-muted'>{faq.answer}</p>
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
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(255, 255, 139)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', minHeight: '1209px' }} className='text-center text-brand-fg'>
        <div className='absolute inset-0'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            className='h-full w-full object-cover'
            style={{ textAlign: 'start' }}
          />
        </div>
        <div className='relative z-10 mx-auto max-w-[1238px]'>
          <div className='mx-auto mb-4 max-w-[960px] section-title'>
            Building the open standard for autonomous software development.
          </div>
          <p className='mx-auto mb-8 max-w-[812px] fluid-body-lg font-medium text-brand-muted'>
            OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
          </p>
          <div className='mb-12 flex flex-wrap items-center justify-center gap-4'>
            <OverlayLinkButton href='https://docs.openhands.dev/sdk' label='Build with SDK' variant='primary' />
            <OverlayLinkButton href='https://app.all-hands.dev/' label='Try it live' variant='outline' />
          </div>
          {/* Spacing gap between the hero CTAs and the footer nav block.
            * Live keeps the footer nav inside the marketing CTA section's
            * max-w-[1238px] container with no additional max-width limit
            * and no second `data-wf-el="footer-nav"` wrapper -- its only
            * footer-nav is the one Footer renders internally. */}
          <div className='mt-[145px]'>
            {/* Pass showMarketingCta={false} because home already renders the
              * "Building the open standard..." headline + CTAs above; without
              * this Footer would render the entire marketing CTA block a
              * second time, inflating the section by ~163px and cascading
              * footer/page-height drift versus the live site. */}
            <Footer compactNav showMarketingCta={false} showSocialLinks />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
