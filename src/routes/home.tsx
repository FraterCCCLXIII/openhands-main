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
    icon: '🛡️',
  },
  {
    title: 'Review PRs',
    description: 'Reviews PRs for quality, security, and best practices.',
    href: 'https://app.all-hands.dev/login',
    icon: '🔎',
  },
  {
    title: 'Migrate Code',
    description: 'Migrates legacy COBOL systems to Java with testing and validation built in.',
    href: 'https://app.all-hands.dev/login',
    icon: '➡️',
  },
  {
    title: 'Triage Incidents',
    description: 'Investigates errors, finds root causes, and posts actionable debugging insights.',
    href: 'https://app.all-hands.dev/login',
    icon: '🚨',
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
    title: 'Cloud',
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
        'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering tasks securely in sandboxed environments.',
    },
    { property: 'og:title', content: 'OpenHands | The Open Platform for Cloud Coding Agents' },
    {
      property: 'og:description',
      content:
        'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering tasks securely in sandboxed environments.',
    },
    { property: 'og:image', content: '/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' },
  ];
};

const Home = () => {
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  return (
    <main data-testid='home-content'>
      <section className='relative overflow-hidden bg-brand-bg px-6 pb-16 pt-10 lg:px-10 lg:pb-24'>
        <div className='absolute inset-0 opacity-[0.08] pointer-events-none'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            className='h-full w-full object-cover'
          />
        </div>

        <div className='relative z-10 mx-auto max-w-[1220px]'>
          <div className='mx-auto mb-10 max-w-[780px] rounded-none border border-brand-fg/15 bg-white/70 px-5 py-4 text-center backdrop-blur-sm'>
            <p className='mb-2 text-sm font-medium text-brand-muted'>Modernize legacy systems before your expertise disappears</p>
            <Link to='/whitepapers/modernize-legacy-systems-with-ai-agents' className='text-base font-medium hover:text-[#8a5f45]'>
              Read the whitepaper
            </Link>
          </div>

          <div className='mx-auto max-w-[860px] text-center'>
            <h1 className='mb-4 text-[44px] font-medium leading-[0.98] tracking-[-0.04em] text-brand-fg md:text-[56px]'>
              Build with coding agents, your way.
            </h1>
            <p className='mx-auto mb-8 max-w-[690px] text-lg leading-[1.45] text-brand-muted'>
              Open-source, customizable. Run locally or at scale.
            </p>
            <div className='mb-4 flex flex-wrap items-center justify-center gap-4'>
              <a href='https://app.all-hands.dev/' target='_blank' rel='noopener noreferrer' className='btn btn-primary'>
                Try it live
              </a>
              <a href='https://docs.openhands.dev/sdk' target='_blank' rel='noopener noreferrer' className='btn btn-outline'>
                Build with SDK
              </a>
            </div>
            <p className='text-base text-brand-muted'>
              Need a self-hosted or air-gapped deployment?{' '}
              <Link to='/contact' className='font-medium text-brand-fg hover:text-[#8a5f45]'>
                Talk to us
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className='bg-brand-bg px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto max-w-[1220px]'>
          <div className='mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <h2 className='mb-3 text-[32px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg'>
                Start with a proven workflow
              </h2>
              <p className='max-w-[640px] text-lg text-brand-muted'>
                Launch repeatable coding-agent workflows for the highest-value engineering tasks first.
              </p>
            </div>
            <a
              href='https://docs.openhands.dev/openhands/usage/use-cases/overview'
              target='_blank'
              rel='noopener noreferrer'
              className='btn btn-outline'
            >
              View docs
            </a>
          </div>

          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
            {WORKFLOWS.map((workflow) => (
              <article key={workflow.title} className='rounded-none border border-brand-fg/15 bg-white/70 p-6 shadow-[0_18px_60px_rgba(34,21,13,0.05)]'>
                <div className='mb-5 flex h-12 w-12 items-center justify-center rounded-none bg-brand-accent text-2xl'>
                  <span aria-hidden='true'>{workflow.icon}</span>
                </div>
                <h3 className='mb-3 text-[24px] font-medium leading-[1.2] text-brand-fg'>{workflow.title}</h3>
                <p className='mb-6 text-base leading-[1.5] text-brand-muted'>{workflow.description}</p>
                <a href={workflow.href} target='_blank' rel='noopener noreferrer' className='text-base font-medium hover:text-[#8a5f45]'>
                  Launch
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-brand-bg px-6 pb-16 lg:px-10 lg:pb-24'>
        <div className='mx-auto max-w-[1220px]'>
          <p className='mb-8 text-center text-base font-medium text-brand-fg'>Trusted by engineers at</p>
          <div className='logo-grid'>
            {CLIENT_LOGOS.concat(CLIENT_LOGOS).map((logo, index) => (
              <img key={`${logo.name}-${index}`} src={logo.url} alt={logo.name} />
            ))}
          </div>
        </div>
      </section>

      <section className='bg-brand-bg px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto grid max-w-[1220px] gap-6 lg:grid-cols-3'>
          {PRODUCT_SURFACES.map((surface) => (
            <article key={surface.title} className='overflow-hidden rounded-none border border-brand-fg/15 bg-white/70 shadow-[0_18px_60px_rgba(34,21,13,0.05)]'>
              <div className='border-b border-brand-fg/10 px-6 py-6'>
                <h2 className='mb-3 text-[44px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg'>{surface.title}</h2>
                <p className='mb-5 text-base leading-[1.5] text-brand-muted'>{surface.description}</p>
                <a href={surface.href} target='_blank' rel='noopener noreferrer' className='btn btn-outline inline-flex rounded-none'>
                  {surface.cta}
                </a>
              </div>
              <div className='bg-[#efe6d1] p-4'>
                <img src={surface.image} alt={surface.title} className='h-[280px] w-full object-cover' />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className='bg-brand-bg px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto grid max-w-[1220px] gap-10 lg:grid-cols-[0.9fr_1.1fr]'>
          <div className='flex flex-col justify-between gap-8'>
            <div>
              <h3 className='mb-4 text-[44px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg'>
                Why teams choose OpenHands
              </h3>
              <p className='max-w-[360px] text-lg text-brand-muted'>
                Open source flexibility, secure execution, and model choice for real engineering work.
              </p>
            </div>
            <a href='https://app.all-hands.dev/' target='_blank' rel='noopener noreferrer' className='btn btn-primary w-fit'>
              Try it live
            </a>
          </div>

          <div className='rounded-none border border-brand-fg/15 bg-white/70 px-5'>
            {FEATURES.map((feature) => (
              <div key={feature.title} className='feature-item-stacked'>
                <img src={feature.icon} alt='' className='mt-1 h-8 w-8 flex-shrink-0' />
                <div>
                  <p className='mb-1 text-[20px] font-medium leading-[1.25] text-brand-fg'>{feature.title}</p>
                  <p className='text-base leading-[1.5] text-brand-muted'>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-brand-bg px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto max-w-[1220px]'>
          <h3 className='mb-10 text-[44px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg'>
            Automate the Outer Loop with AI
          </h3>
          <div className='grid gap-6 lg:grid-cols-2'>
            {USE_CASE_COLUMNS.map((column) => (
              <div key={column.label} className='rounded-none border border-brand-fg/15 bg-[#efe6d1] p-7'>
                <p className='mb-6 text-sm font-medium uppercase tracking-[0.12em] text-brand-muted'>{column.label}</p>
                <div className='space-y-4'>
                  {column.cards.map((card) => (
                    <article key={card.title} className='rounded-none bg-white/70 p-5'>
                      <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-none bg-brand-fg'>
                        <img src={card.icon} alt='' className='h-8 w-8' />
                      </div>
                      <p className='mb-2 text-[20px] font-medium leading-[1.25] text-brand-fg'>{card.title}</p>
                      <p className='text-base leading-[1.55] text-brand-muted'>{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='overflow-hidden bg-brand-accent px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto grid max-w-[1220px] gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center'>
          <div>
            <img
              src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'
              alt='ASCII art depicting a large black hole with light and particles swirling around it.'
              className='w-full object-contain'
            />
          </div>
          <div>
            <h2 className='mb-6 text-[44px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg'>
              {TESTIMONIALS[activeTestimonial].quote}
            </h2>
            <div className='mb-8 flex items-center gap-4'>
              <img
                src={TESTIMONIALS[activeTestimonial].photo}
                alt={TESTIMONIALS[activeTestimonial].name}
                className='h-14 w-14 object-cover'
                style={{ borderRadius: '100%' }}
              />
              <div>
                <p className='text-base font-medium text-brand-fg'>{TESTIMONIALS[activeTestimonial].name}</p>
                <p className='text-sm text-brand-muted'>{TESTIMONIALS[activeTestimonial].title}</p>
              </div>
              <img src={TESTIMONIALS[activeTestimonial].logo} alt='' className='ml-auto h-8 max-w-[110px] object-contain' />
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-base font-medium text-brand-fg'>
                {activeTestimonial + 1}/{TESTIMONIALS.length}
              </span>
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => setActiveTestimonial((current) => (current === 0 ? TESTIMONIALS.length - 1 : current - 1))}
                  className='flex h-11 w-11 items-center justify-center rounded-none border border-brand-fg/20 hover:bg-brand-fg/5'
                  aria-label='Previous testimonial'
                >
                  ←
                </button>
                <button
                  type='button'
                  onClick={() => setActiveTestimonial((current) => (current === TESTIMONIALS.length - 1 ? 0 : current + 1))}
                  className='flex h-11 w-11 items-center justify-center rounded-none border border-brand-fg/20 hover:bg-brand-fg/5'
                  aria-label='Next testimonial'
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='bg-brand-bg px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto max-w-[1220px] space-y-6'>
          <div className='grid gap-6 lg:grid-cols-2'>
            <article className='card-dark min-h-[520px] rounded-none p-8'>
              <p className='mb-3 text-lg font-medium text-brand-accent'>Community that compounds velocity</p>
              <p className='mb-8 max-w-[510px] text-lg leading-[1.55] text-white/75'>
                With 65K+ GitHub stars and a thriving open-source ecosystem, OpenHands evolves through collective innovation - every contribution makes the platform faster, safer, and smarter.
              </p>
              <a href='https://github.com/OpenHands/OpenHands' target='_blank' rel='noopener noreferrer' className='btn mb-12 inline-flex rounded-none border border-brand-bg/40 bg-transparent text-brand-bg hover:bg-brand-bg/10'>
                Explore the repo
              </a>
              <div className='mt-auto flex items-end gap-3'>
                <span className='text-7xl font-medium leading-none text-brand-accent'>{formatThousands(statistics.stargazers)}</span>
                <span className='mb-2 text-4xl font-medium text-white'>+</span>
              </div>
              <div className='mt-3 flex items-center gap-2 text-base text-white/70'>
                <span>GitHub stars</span>
                <span aria-hidden='true'>⭐</span>
              </div>
            </article>

            <article className='card-dark min-h-[520px] rounded-none p-8'>
              <p className='mb-3 text-lg font-medium text-brand-accent'>Plays well with your stack</p>
              <p className='mb-10 max-w-[520px] text-lg leading-[1.55] text-white/75'>
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
                    <img src={icon} alt={label} className='mx-auto mb-3 h-8 w-auto' />
                    <span className='text-sm text-white/70'>{label}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className='card-dark rounded-none p-8'>
            <div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center'>
              <div>
                <p className='mb-3 text-lg font-medium text-brand-accent'>Enterprise-grade security and control</p>
                <p className='mb-6 max-w-[680px] text-lg leading-[1.55] text-white/75'>
                  Control every layer of your environment with fine-grained access control, model-agnostic architecture, and flexible self-hosted or private cloud deployment options that keep your code and data secure.
                </p>
                <Link to='/enterprise' className='btn inline-flex rounded-none border border-brand-bg/40 bg-transparent text-brand-bg hover:bg-brand-bg/10'>
                  Learn about Enterprise
                </Link>
              </div>
              <div className='flex justify-center lg:justify-end'>
                <img src='/assets/webflow/misc/6908c923f44bb0269a602378_last-icon.svg' alt='' className='h-32 w-32' />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className='bg-brand-bg px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto max-w-[1220px]'>
          <div className='mb-12 text-center'>
            <h2 className='mb-3 text-[44px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg'>Developers love OpenHands</h2>
            <p className='text-lg text-brand-muted'>Join millions of developers to build software autonomously</p>
          </div>
          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
            {DEVELOPER_QUOTES.map((quote) => (
              <article key={quote.name} className='rounded-none border border-brand-fg/12 bg-white/80 p-5 shadow-[0_18px_60px_rgba(34,21,13,0.04)]'>
                <div className='mb-4 flex items-center gap-3'>
                  <img src={quote.avatar} alt={quote.name} className='h-11 w-11 object-cover' style={{ borderRadius: '100%' }} />
                  <div>
                    <p className='text-sm font-medium text-brand-fg'>{quote.name}</p>
                    <p className='text-xs text-brand-muted'>{quote.title}</p>
                  </div>
                </div>
                <div className='space-y-2'>
                  {quote.lines.map((line) => (
                    <p key={line} className='text-sm leading-[1.6] text-brand-fg'>
                      {line}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className='sr-only'>‍</p>
        </div>
      </section>

      <section className='bg-brand-bg px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto max-w-[1080px] rounded-none border border-brand-fg/12 bg-white/70 p-7 md:p-10'>
          <div className='mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h2 className='mb-3 text-[44px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg'>FAQ&apos;s</h2>
              <p className='text-lg text-brand-muted'>Answers for teams evaluating autonomous software-development agents.</p>
            </div>
            <Link to='/contact' className='btn btn-outline w-fit rounded-none'>
              Contact us
            </Link>
          </div>
          <div className='space-y-4'>
            {FAQS.map((faq) => (
              <details key={faq.question} className='border-t border-brand-fg/12 pt-4 last:border-b last:pb-4'>
                <summary className='cursor-pointer list-none'>
                  <label className='cursor-pointer text-[24px] font-medium leading-[1.4] text-brand-fg'>{faq.question}</label>
                </summary>
                <p className='mt-3 max-w-[860px] text-base leading-[1.65] text-brand-muted'>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className='relative overflow-hidden bg-brand-accent px-6 py-16 text-center text-brand-fg lg:px-10 lg:py-24'>
        <div className='absolute inset-0 pointer-events-none opacity-20'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            className='h-full w-full object-cover'
          />
        </div>
        <div className='relative z-10 mx-auto max-w-[1238px]'>
          <h2 className='mx-auto mb-4 max-w-[960px] text-[44px] font-medium leading-[1.05] tracking-[-0.04em]'>
            Building the open standard for autonomous software development.
          </h2>
          <p className='mx-auto mb-8 max-w-[900px] text-lg leading-[1.5] text-brand-muted'>
            OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
          </p>
          <div className='mb-12 flex flex-wrap items-center justify-center gap-4'>
            <a href='https://docs.openhands.dev/sdk' target='_blank' rel='noopener noreferrer' className='btn btn-outline'>
              Build with SDK
            </a>
            <a href='https://app.all-hands.dev/' target='_blank' rel='noopener noreferrer' className='btn btn-primary'>
              Try it live
            </a>
          </div>
          <Footer />
        </div>
      </section>
    </main>
  );
};

export default Home;
