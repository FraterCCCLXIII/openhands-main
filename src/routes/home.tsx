import React from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/home';
import statistics from '~/data/statistics.json';
import { Footer } from '~/components/footer';
import { formatThousands } from '~/utils/format-thousands';

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
    description: 'Explore more workflows and integrations to automate your development process.',
    href: 'https://docs.openhands.dev/openhands/usage/use-cases/overview',
    iconSrc:
      '/assets/webflow/icons/Search_Icon.svg',
    isLink: true,
  },
];

const PRODUCT_SURFACES = [
  {
    title: 'SDK',
    description: 'Use the SDK to embed OpenHands into apps and workflows',
    href: 'https://docs.openhands.dev/sdk',
    cta: 'Get the SDK',
    image: '/assets/webflow/misc/691b30aa3c700dcb47a96c00_SDK.webp',
  },
  {
    title: 'Web GUI',
    description: 'Plan and execute complex tasks via the desktop or mobile web',
    href: 'https://app.all-hands.dev/',
    cta: 'Try it live',
    image: '/assets/webflow/misc/691b30afadf69b956d353513_Cloud.webp',
  },
  {
    title: 'CLI',
    description: 'Pair with OpenHands CLI right from your terminal',
    href: 'https://docs.openhands.dev/openhands/usage/cli/installation',
    cta: 'Download CLI',
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
    avatar: '/assets/webflow/avatars/695ea0cc5a2ba2d770edc8db_OpenHands_Social_Avatar_copy.png',
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

  const visibleWorkflows = React.useMemo(
    () => Array.from({ length: WORKFLOWS.length }, (_, index) => WORKFLOWS[(workflowOffset + index) % WORKFLOWS.length]),
    [workflowOffset],
  );

  const activeSurface = PRODUCT_SURFACES[activeSurfaceIndex];
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
          <div data-wf-el='asci-wrap' className='absolute inset-0 pointer-events-none' style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}>
            <img
              src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
              alt=''
              className='h-full w-full object-cover'
            />
          </div>

          <div data-wf-el='container' className='relative z-10 mx-auto w-full max-w-[1238px]'>
            <div data-wf-el='hero-content' className='mx-auto max-w-[1238px]' style={{ textAlign: 'center', paddingTop: '56px', paddingBottom: '72px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '32px' }}>
              <div data-wf-el='banner-wrap' className='mx-auto max-w-[688px] text-center' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', borderRadius: '0px', paddingTop: '12.8px', paddingBottom: '12.8px', paddingLeft: '32px', paddingRight: '32px' }}>
                <div>
                  <div className='flex flex-col items-center justify-center sm:flex-row'>
                    <div className='sm:flex-1' style={{ padding: '0 12px' }}>
                      <p className='text-sm font-normal leading-[1.6] text-brand-fg'>Modernize legacy systems before your expertise disappears</p>
                    </div>
                    <div className='hidden flex-shrink-0 sm:block' style={{ padding: '0 12px' }}>
                      <div className='h-8 w-px bg-brand-fg/20' aria-hidden='true' />
                    </div>
                    <div className='flex-shrink-0' style={{ padding: '0 12px' }}>
                      <Link to='/whitepapers/modernize-legacy-systems-with-ai-agents' className='font-sohne-buch text-base font-normal leading-[22.4px] hover:text-[#8a5f45]'>
                        Read the whitepaper
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div data-wf-el='hero-heading_wrap' className='mx-auto flex max-w-[640px] flex-col items-center gap-2 text-center' style={{ justifyContent: 'center' }}>
                <h1 className='mb-4 text-[44px] font-medium leading-[0.96] tracking-[-0.03em] text-brand-fg md:text-[56px]'>
                  Build with coding agents, your way.
                </h1>
                <div className='mx-auto mb-7 max-w-[520px] text-lg font-medium leading-[1.45] text-brand-muted lg:text-[20.8px] lg:leading-[1.2]'>
                  Open-source, customizable. Run locally or at scale.
                </div>
                <div data-wf-el='hero_btn_wrap' className='mb-4 flex flex-wrap items-center justify-center gap-4'>
                  <span className='btn-wrap'>
                    <a href='https://app.all-hands.dev/' target='_blank' rel='noopener noreferrer' className='btn btn-primary'>
                      Try it live
                    </a>
                  </span>
                  <span className='btn-wrap'>
                    <a href='https://docs.openhands.dev/sdk' target='_blank' rel='noopener noreferrer' className='btn btn-outline'>
                      Build with SDK
                    </a>
                  </span>
                </div>
                <div data-wf-el='hero_sublink_text' className='text-base text-brand-fg'>
                  Need a self-hosted or air-gapped deployment?{' '}
                  <Link to='/contact' className='font-normal text-brand-fg underline decoration-brand-fg/40 underline-offset-2 hover:decoration-brand-fg'>Talk to us</Link>
                </div>
              </div>
            </div>

            {/* Workflow carousel (inside hero section) */}
            <div data-wf-el='hero-splide_top' className='mb-5 flex justify-between gap-4' style={{ alignItems: 'center' }}>
            <div className='max-w-[384px]'>
              <h2 data-wf-el='hero-splide_heading' className='text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
                Start with a proven workflow
              </h2>
            </div>
            <div data-wf-el='hero-splide_buttons' className='hidden items-center gap-4 md:flex' style={{ justifyContent: 'flex-start' }}>
              <button
                type='button'
                onClick={() => setWorkflowOffset((current) => (current === 0 ? WORKFLOWS.length - 1 : current - 1))}
                className='flex h-11 w-11 items-center justify-center rounded-full border border-brand-fg/20 text-brand-fg transition-colors hover:bg-brand-fg/5'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' className='h-5 w-5 fill-current' aria-hidden='true'>
                  <path d='M30 16c0 .265-.105.52-.293.707A.997.997 0 0 1 29 17H5.414l6.294 6.292A1 1 0 0 1 11 25a1 1 0 0 1-.708-.292l-8-8A.997.997 0 0 1 2 16c0-.132.026-.262.075-.383.05-.12.124-.23.217-.325l8-8A1 1 0 0 1 12 8c0 .266-.105.52-.292.708L5.414 15H29c.265 0 .52.105.707.293.188.187.293.441.293.707Z' />
                </svg>
              </button>
              <button
                type='button'
                onClick={() => setWorkflowOffset((current) => (current + 1) % WORKFLOWS.length)}
                className='flex h-11 w-11 items-center justify-center rounded-full border border-brand-fg/20 text-brand-fg transition-colors hover:bg-brand-fg/5'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' className='h-5 w-5 fill-current' aria-hidden='true'>
                  <path d='M2 16c0-.265.105-.52.293-.707A.997.997 0 0 1 3 15h23.586l-6.294-6.292A1 1 0 0 1 20 8a1 1 0 0 1 .708-.292l8 8c.093.094.167.204.217.325.049.12.075.25.075.383 0 .132-.026.262-.075.383-.05.12-.124.23-.217.325l-8 8A1 1 0 0 1 20 24c0-.266.105-.52.292-.708L26.586 17H3a.997.997 0 0 1-.707-.293A.997.997 0 0 1 2 16Z' />
                </svg>
              </button>
            </div>
          </div>

          <div className='flex cursor-grab gap-5 overflow-x-auto pb-4 lg:overflow-visible' style={{ scrollSnapType: 'x mandatory' }}>
            {visibleWorkflows.map((workflow) => (
              <article
                key={workflow.title}
                data-wf-el='capabilities_card_wrap'
                className='flex min-w-[300px] flex-shrink-0 cursor-grab flex-col gap-4 rounded-2xl border border-[rgba(30,21,15,0.2)] bg-[#f9f6e9] p-6 lg:w-[352px]'
                style={{ scrollSnapAlign: 'start', justifyContent: 'flex-start', alignItems: 'flex-start' }}
              >
                <img data-wf-el='capabilities_card_icon' src={workflow.iconSrc} alt='' className='mb-4 h-8 w-8 object-contain' />
                <div data-wf-el='capabilities_card_content' className='flex flex-col gap-1'>
                  <h3 data-wf-el='capabilities_card_heading' className='text-[24px] font-medium leading-[1.2] text-brand-fg'>{workflow.title}</h3>
                  <p data-wf-el='capabilities_card_paragraph' className='mb-5 font-mono text-sm leading-[1.5] text-brand-fg'>{workflow.description}</p>
                </div>
                {workflow.isLink ? (
                  <a
                    href={workflow.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-outline mt-auto text-center'
                  >
                    View docs
                  </a>
                ) : (
                  <div className='relative mt-auto inline-flex w-full items-center justify-center bg-brand-accent px-5 py-3 text-base font-medium text-brand-fg' style={{ borderRadius: 'var(--btn-border-radius)' }}>
                    <div aria-hidden='true'>Launch</div>
                    <button
                      type='button'
                      aria-label={`Launch ${workflow.title}`}
                      data-testid='workflow-launch'
                      onClick={() => openExternal(workflow.href)}
                      className='absolute inset-0 transition-colors hover:bg-brand-fg/5'
                      style={{ borderRadius: 'var(--btn-border-radius)' }}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
          </div>

          {/* Logo grid (inside hero section) */}
          <div data-wf-el='logo-grid-component_wrap' className='w-full' style={{ paddingTop: '56px' }}>
            <div data-wf-el='logo-grid-component_heading_container' className='mx-auto max-w-[1238px]' style={{ textAlign: 'center' }}>
              <div data-wf-el='logo-grid-component_heading_heading' className='mb-5 text-center text-[32px] font-medium leading-[1.2] text-brand-fg'>Trusted by engineers at</div>
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

          {/* SDK collection (inside hero section) */}
          <div data-wf-el='standard-collection' className='w-full' style={{ display: 'block' }}>
          <div data-wf-el='card' style={{ borderRadius: '8px', display: 'block', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div className='mb-3 flex gap-2 font-mono' role='tablist' style={{ lineHeight: '16.896px' }}>
              {PRODUCT_SURFACES.map((surface, index) => (
                <div
                  key={surface.title}
                  data-wf-el='eyebrow'
                  role='tab'
                  tabIndex={0}
                  aria-selected={index === activeSurfaceIndex}
                  onClick={() => setActiveSurfaceIndex(index)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSurfaceIndex(index); } }}
                  className='inline-block text-sm font-medium transition-colors'
                  style={{
                    display: 'block',
                    cursor: 'pointer',
                    borderRadius: '20px',
                    paddingLeft: '9.6px',
                    paddingRight: '9.6px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    lineHeight: '16.896px',
                    textAlign: 'start',
                    color: 'rgb(249, 240, 217)',
                    backgroundColor: 'rgb(34, 21, 13)',
                    borderColor: 'rgb(0, 0, 0)',
                  }}
                >
                  {surface.title}
                </div>
              ))}
            </div>
            <div data-wf-el='standard-wrap' className='max-w-[270px]' style={{ borderRadius: '0px' }}>
              <h2 className='mb-3 text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>{activeSurface.title}</h2>
              <p data-wf-el='paragraph-lg' className='mb-5 max-w-[270px] text-lg font-medium leading-[1.5] text-brand-muted lg:text-[20.8px] lg:leading-[1.2]'>{activeSurface.description}</p>
              <span className='btn-wrap'>
                <a href={activeSurface.href} target='_blank' rel='noopener noreferrer' className='btn btn-outline border-none'>
                  {activeSurface.cta}
                </a>
              </span>
            </div>
          </div>
          <div data-wf-el='hero-media' className='overflow-hidden rounded-lg bg-[#efe6d1] lg:min-h-[1320px]'>
            <div data-wf-el='hero-media-bg' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', backgroundColor: 'rgb(34, 21, 13)', borderRadius: '24px', paddingTop: '47.1875px', paddingBottom: '47.1875px' }} className='h-full w-full'>
              <img src={activeSurface.image} alt='' className='h-full min-h-[620px] w-full object-cover object-top' />
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Why teams choose OpenHands (py:80, transparent) */}
      <section style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto grid max-w-[1278px] gap-10 lg:grid-cols-[598px_640px]'>
          <div className='flex flex-col justify-between gap-8'>
            <h3 className='max-w-[386px] text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>Why teams choose OpenHands</h3>
            <span className='btn-wrap w-fit'>
              <a href='https://app.all-hands.dev/' target='_blank' rel='noopener noreferrer' className='btn btn-primary'>
                Try it live
              </a>
            </span>
          </div>

          <div className='rounded-none border border-brand-fg/15 bg-white/70 px-5 py-0'>
            {FEATURES.map((feature) => (
              <div key={feature.title} className='feature-item-stacked'>
                <img src={feature.icon} alt='' className='mt-1 h-8 w-8 flex-shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='mb-1 text-[20px] font-medium leading-[1.25] text-brand-fg'>{feature.title}</p>
                  <p className='text-base font-medium leading-[1.5] text-brand-muted lg:text-[20.8px] lg:leading-[1.2]'>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Automate the Outer Loop (py:80, transparent) */}
      <section style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]'>
          <h3 className='mb-[217px] max-w-[1216px] text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
            Automate the Outer Loop with AI
          </h3>
          <div className='space-y-6'>
            {USE_CASE_COLUMNS.map((column, index) => (
              <div
                key={column.label}
               
                className='overflow-hidden rounded-[19.2px] border border-brand-fg/15'
                style={index > 0 ? { marginTop: '233px' } : undefined}
              >
                <div className='border-b border-brand-fg/15 px-6 py-4 text-sm font-normal uppercase tracking-normal text-brand-fg'>
                  {column.label}
                </div>
                <div className='grid gap-6 p-6 lg:grid-cols-3 lg:gap-x-10 lg:px-[31px] lg:pt-[50px]'>
                  {column.cards.map((card) => (
                    <article key={card.title} className='rounded-none bg-transparent'>
                      <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-none bg-white'>
                        <img src={card.icon} alt='' className='h-8 w-8' />
                      </div>
                      <p className='mb-2 text-[20px] font-medium leading-[1.25] text-brand-fg'>{card.title}</p>
                      <p className='text-base font-medium leading-[1.55] text-brand-muted lg:text-[20.8px] lg:leading-[1.2]'>{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Testimonials / black hole (p:0, h:800, transparent, position:relative) */}
      <section style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '800px', overflow: 'visible' }}>
        <div data-wf-el='asci-wrap' className='absolute inset-0' style={{ backgroundColor: 'rgb(255, 255, 139)' }}>
          <img
            data-wf-el='asci-media'
            src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'
            alt='ASCII art depicting a large black hole with light and particles swirling around it.'
            className='h-full w-full object-cover'
            style={{ display: 'inline-block' }}
          />
        </div>
        <div data-wf-el='hero-track' className='relative z-10 mx-auto flex h-full max-w-[1238px]' style={{ paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', justifyContent: 'center', alignItems: 'center', gap: '10%' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} data-wf-el='card-body' className='max-w-[760px] p-8' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', display: 'block', color: 'rgb(249, 240, 217)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', position: i === activeTestimonial ? 'static' : 'absolute', opacity: i === activeTestimonial ? 1 : 0, pointerEvents: i === activeTestimonial ? 'auto' : 'none', left: i === activeTestimonial ? undefined : '-9999px' }}>
              <h2 className='mb-6 text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
                {t.quote}
              </h2>
              <div className='mb-8 flex items-center gap-4'>
                <div data-wf-el='quote-author-media' style={{ backgroundColor: 'rgb(34, 21, 13)', borderRadius: '50%', color: 'rgb(34, 21, 13)' }}><img src={t.photo} alt='' className='h-12 w-12 object-cover' style={{ borderRadius: '100%' }} /></div>
                <div data-wf-el='paragraph-xl' style={{ fontSize: '24px', lineHeight: '33.6px', color: 'rgb(34, 21, 13)' }}>
                  <div className='text-base font-medium text-brand-fg'>{t.name}</div>
                  <div className='text-sm font-medium text-brand-fg'>{t.title}</div>
                </div>
                <img src={t.logo} alt='' className='ml-auto h-8 max-w-[110px] object-contain' />
              </div>
              <div data-wf-el='slide-controls' style={{ display: 'block', color: 'rgb(34, 21, 13)' }}>
                <div className='text-base font-medium text-brand-fg'>
                  {i + 1}/{TESTIMONIALS.length}
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
          ))}
        </div>
      </section>

      {/* SECTION 4: Dark cards continued (py:80, transparent) */}
      <section style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px] space-y-6'>
          <div className='grid gap-6 lg:grid-cols-2'>
            <article className='card-dark min-h-[520px] lg:min-h-[595px]'>
              <div className='flex h-full flex-col p-6'>
                <p className='mb-3 max-w-[350px] text-lg font-medium text-brand-accent lg:text-[20.8px] lg:leading-[1.2]'>Community that compounds velocity</p>
                <p className='mb-8 max-w-[350px] text-lg leading-[1.55] text-[#b3a88c] lg:text-[20.8px] lg:leading-[1.2]'>
                  With 65K+ GitHub stars and a thriving open-source ecosystem, OpenHands evolves through collective innovation - every contribution makes the platform faster, safer, and smarter.
                </p>
                <span className='btn-wrap-dark mb-12'>
                  <a href='https://github.com/OpenHands/OpenHands' target='_blank' rel='noopener noreferrer' className='btn border-none bg-transparent text-center text-brand-bg hover:bg-brand-bg/10'>
                    Explore the repo
                  </a>
                </span>
                <div className='mt-auto flex items-end gap-3'>
                  <span className='text-7xl font-medium leading-none text-brand-accent'>{formatThousands(statistics.stargazers)}</span>
                  <span className='mb-2 text-4xl font-medium text-white'>+</span>
                </div>
                <div className='mt-3 flex items-center gap-2 text-base text-[#b3a88c]'>
                  <span>GitHub stars</span>
                  <span aria-hidden='true'>⭐</span>
                </div>
              </div>
            </article>

            <article className='card-dark min-h-[520px] lg:min-h-[595px]'>
              <div className='flex h-full flex-col p-6'>
                <p className='mb-3 max-w-[330px] text-lg font-medium text-brand-accent lg:text-[20.8px] lg:leading-[1.2]'>Plays well with your stack</p>
                <p className='mb-10 max-w-[330px] text-lg leading-[1.55] text-[#b3a88c] lg:text-[20.8px] lg:leading-[1.2]'>
                  Native integrations with GitHub, GitLab, CI/CD, Slack, and ticketing tools. OpenHands fits seamlessly into enterprise governance systems and your preferred model providers.
                </p>
                <div className='grid grid-cols-2 gap-5 sm:grid-cols-4'>
                  {[
                    ['/assets/webflow/icons/6908c8dc26f3de5a93212b4c_loop-1--multimedia-multi-button-repeat-media-loop-infinity-controls.svg', 'CI/CD'],
                    ['/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg', 'Slack'],
                    ['/assets/webflow/icons/6908c8dc24685e3f5e172012_github-mark4.svg', 'GitHub'],
                    ['/assets/webflow/icons/6908c8dde7fa5732b9ed5cb4_Vector.svg', 'GitLab'],
                  ].map(([icon, label]) => (
                    <div key={label} className='rounded-none border border-white/10 bg-white/5 p-4 text-center'>
                      <img src={icon} alt='' className='mx-auto mb-3 h-8 w-auto' />
                      <div className='text-sm text-brand-bg'>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <article className='card-dark'>
            <div className='p-6'>
              <div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center'>
                <div>
                  <p className='mb-3 max-w-[369px] text-lg font-medium text-brand-accent lg:text-[20.8px] lg:leading-[1.2]'>Enterprise-grade security and control</p>
                  <p className='mb-6 max-w-[369px] text-lg leading-[1.55] text-[#b3a88c] lg:text-[20.8px] lg:leading-[1.2]'>
                    Control every layer of your environment with fine-grained access control, model-agnostic architecture, and flexible self-hosted or private cloud deployment options that keep your code and data secure.
                  </p>
                  <span className='btn-wrap-dark'>
                    <Link to='/enterprise' className='btn border-none bg-transparent text-center text-brand-bg hover:bg-brand-bg/10'>
                      Learn about Enterprise
                    </Link>
                  </span>
                </div>
                <div className='flex justify-center lg:justify-end'>
                  <img src='/assets/webflow/misc/6908c923f44bb0269a602378_last-icon.svg' alt='' className='h-32 w-32' />
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
            <div data-wf-el='heading-component'><h2 className='mb-3 text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>Developers love OpenHands</h2></div>
            <p className='text-lg font-medium text-brand-muted lg:text-[20.8px] lg:leading-[1.2]'>Join millions of developers to build software autonomously</p>
          </div>
          <div data-wf-el='lovewall_cms_list' className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {DEVELOPER_QUOTES.map((quote) => (
              <article key={quote.name} data-wf-el='lovewall_cms_item' className='flex flex-col rounded-lg border border-[#b3a88c] bg-white lg:min-h-[260px]' style={{ justifyContent: 'flex-start' }}>
                <div data-wf-el='card-body' className='flex-1 p-6' style={{ display: 'block', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
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
      <section data-wf-el='section-faq' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='flex flex-col gap-8 lg:-mx-5 lg:flex-row lg:gap-0'>
            <div className='flex flex-col lg:flex-[0_0_41.67%] lg:px-5'>
              <h2 className='mb-4 text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>FAQ&apos;s</h2>
              <span className='btn-wrap w-fit'>
                <Link to='/contact' className='btn btn-outline border-none'>
                  Contact us
                </Link>
              </span>
            </div>
            <div className='space-y-4 lg:flex-1 lg:px-5'>
              {FAQS.map((faq) => (
                <details key={faq.question} data-wf-el='accordion-item' className='flex flex-col rounded-lg border border-brand-bg'>
                  <summary data-wf-el='accordion-trigger' className='flex cursor-pointer list-none items-center justify-between p-6'>
                    <label data-wf-el='accordion-title' className='pointer-events-none block cursor-default pr-3 text-[24px] font-medium leading-[1.4] text-brand-fg'>{faq.question}</label>
                    <div data-wf-el='accordion-icon' className='h-8 w-8 flex-shrink-0 overflow-hidden text-brand-fg' style={{ display: 'block' }} aria-hidden='true'>
                      <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 13l6 6 6-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg>
                    </div>
                  </summary>
                  <div data-wf-el='accordion-content_spacer' style={{ paddingLeft: '0px', paddingRight: '0px', paddingBottom: '24px' }}>
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
      <section data-wf-el='section-cta' style={{ display: 'block', backgroundColor: 'rgb(255, 255, 139)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }} className='text-center text-brand-fg'>
        <div className='absolute inset-0 pointer-events-none opacity-20'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            className='h-full w-full object-cover'
          />
        </div>
        <div className='relative z-10 mx-auto max-w-[1238px]'>
          <div className='mx-auto mb-4 max-w-[960px] text-[44px] font-medium leading-[1.05] tracking-[-0.03em]'>
            Building the open standard for autonomous software development.
          </div>
          <p className='mx-auto mb-8 max-w-[812px] text-lg font-medium leading-[1.5] text-brand-muted lg:text-[20.8px] lg:leading-[1.2]'>
            OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
          </p>
          <div className='mb-12 flex flex-wrap items-center justify-center gap-4'>
            <span className='btn-wrap'>
              <a href='https://docs.openhands.dev/sdk' target='_blank' rel='noopener noreferrer' className='btn btn-outline'>
                Build with SDK
              </a>
            </span>
            <span className='btn-wrap'>
              <a href='https://app.all-hands.dev/' target='_blank' rel='noopener noreferrer' className='btn btn-primary'>
                Try it live
              </a>
            </span>
          </div>
          <div data-wf-el='footer-nav' className='mt-[145px]' style={{ textAlign: 'start', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Footer showSocialLinks compactNav />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
