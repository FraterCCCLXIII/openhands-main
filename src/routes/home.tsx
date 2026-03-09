import statistics from '~/data/statistics.json';
import contributors from '~/data/contributors.json';
import { ContributorGrid } from '~/components/contributor-grid';
import { Footer } from '~/components/footer';
import { formatThousands } from '~/utils/format-thousands';
import { formatContributorCount } from '~/utils/format-contributor-count';
import { useGitHubModal } from '~/contexts/github-modal-context';
import React, { Suspense, lazy } from 'react';
import GitHubLogo from '~/svgs/github-logo.svg?react';
import GitHubLogoBlack from '~/svgs/github-logo-black.svg?react';
import { Link } from 'react-router';
import type { Route } from './+types/home';
import { UseCaseCarousel } from '~/components/use-case-carousel';

// Lazy load the ASCII animation for performance
const ASCIIAnimation = lazy(() => import('~/components/ascii-animation'));

// Client logos from Webflow
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

// Product features from Webflow CMS
const FEATURES = [
  { title: 'Extensible and customizable for any workflow', description: 'Build and orchestrate your own agents with open SDKs, APIs, and micro-agents.', icon: '/assets/webflow/features/690b95df7d9ca76624d45550_Frame48095777.svg' },
  { title: 'Model-agnostic', description: 'Adapt OpenHands to any model, CI/CD pipeline, or codebase with fine-grained configurability.', icon: '/assets/webflow/features/690b95d99040920ad0084107_Frame48095776.svg' },
  { title: 'Works where you do', description: 'Delegate tasks directly from GitHub, GitLab, Slack, or via the API and SDK', icon: '/assets/webflow/features/690b95d3c92c94a6a9b249f8_Frame48095775.svg' },
  { title: 'Secure, sandboxed runtime you control', description: 'Deploy in isolated Docker or Kubernetes environments, self-hosted or cloud, with full access control and auditability.', icon: '/assets/webflow/features/690b95ca541b813083e0b38a_Frame48095774.svg' },
  { title: 'Open source and transparent by design', description: 'Full visibility into every agent and artifact.', icon: '/assets/webflow/features/690b95bf82d3695da1690cb8_Frame48095773.svg' },
  { title: 'Cloud coding agents that scale', description: 'From a single task to thousands of parallel runs.', icon: '/assets/webflow/features/690b95b580671251fa0903f4_Frame48095772.svg' },
];

// Use cases from Webflow CMS
const USE_CASES_REDUCE = [
  { title: 'Speed up code reviews', description: 'Summarize pull requests, apply feedback, fix tests, and push fixes instantly so code reviews move from hours to minutes.', icon: '/assets/webflow/testimonials/690db602c5ec8e837c1ff9b9_Frame48095783.svg' },
  { title: 'Expand test coverage', description: 'Generate and maintain tests for new features to boost reliability and catch regressions before they ship.', icon: '/assets/webflow/testimonials/690db60c9a0ef2e561f859b8_Frame48095783-1.svg' },
  { title: 'Automate docs & release notes', description: 'Generate accurate documentation and release notes directly from commits and pull requests, no manual updates required.', icon: '/assets/webflow/testimonials/690db61152b4d406db66af21_Frame48095783-2.svg' },
];

const USE_CASES_STREAMLINE = [
  { title: 'Refactor old code', description: 'Decompose monoliths, clean up tech debt, and modernize legacy codebases automatically without slowing down the roadmap.', icon: '/assets/webflow/testimonials/690db655aca9f8ee7a0d001f_Frame48095783.svg' },
  { title: 'Eliminate security debt', description: 'Harness OpenHands to upgrade dependencies, fix security vulnerabilities, and reduce complexity for large scale, multi-repo changes.', icon: '/assets/webflow/testimonials/690db65c8a83399ae0b30aab_Frame48095783-1.svg' },
  { title: 'Triage & fix prod issues', description: 'Deploy agents to analyze logs, pinpoint root causes, and generate fixed PRs ready for your team to review and approve.', icon: '/assets/webflow/testimonials/690db661c0a9589bc9d70bb3_Frame48095783-2.svg' },
];

// Testimonials from Webflow CMS
const TESTIMONIALS = [
  {
    quote: "The integration of Lemonade Server with OpenHands reflects AMD's commitment to open-source innovation and developer choice. This collaboration enables local coding agents that prioritize privacy, cost efficiency, and flexible model selection – while taking advantage of acceleration on Ryzen AI PCs. Together, we're supporting a range of workflows and staying true to open-source values.",
    name: 'Adrian Macias',
    title: 'Director, Developer Acceleration at AMD',
    logo: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg',
    photo: '/assets/webflow/testimonials/authors/amd.png',
  },
  {
    quote: "OpenHands was the only solution that let us prompt an autonomous coding agent remotely at scale, not just on a laptop or inside a narrow CI template.",
    name: 'Sina Pakazad',
    title: 'VP of Data Science at C3',
    logo: '/assets/webflow/logos/69137ec5a6f77dd174e557ce_C3ai_logo1.svg',
    photo: '/assets/webflow/testimonials/authors/c3.png',
  },
  {
    quote: "OpenHands autonomously fixes 87% of bug tickets same-day. Our clients think we hired an army of engineers.",
    name: 'Nick Blanchet',
    title: 'CTO at Flextract',
    logo: '/assets/webflow/logos/6915b02ded45d0b434a0974d_flextract.png',
    photo: '/assets/webflow/testimonials/authors/flextract.png',
  },
];

// Social proof tweets from Webflow CMS - "Developers love OpenHands"
const DEVELOPER_TWEETS = [
  {
    name: 'Dan Kempe',
    handle: '@danielkempe',
    avatar: '/assets/webflow/avatars/69783c9c4f51d7fb8f0ec4da_hAlMtLep_400x400.jpeg',
    content: 'OpenHands raised $18.8M to build cloud coding agents that solve 87% of bug tickets same day. This is what AI coding tools should be. Not another chat interface. Actual autonomous problem solving that ships to production.',
    url: 'https://x.com/danielkempe/status/2009643859043594394',
  },
  {
    name: 'Esteban Puerta',
    handle: '@Esteban_Puerta9',
    avatar: '/assets/webflow/avatars/69783c9c29335a4e5f25171c_XdPDMFhM_400x400.jpeg',
    content: "At this point, there isn't much of a need to roll your own especially when claude code SDK and openhands sdk are offering nice API's to utilize them. This is where it gets interesting.",
    url: 'https://x.com/Esteban_Puerta9/status/2008257988356911231',
  },
  {
    name: 'Leonardo Gonzalez',
    handle: '@archimagos',
    avatar: '/assets/webflow/avatars/69783c9c901a7c70a903b9c5_v7Pqyx4B_400x400.jpeg',
    content: 'I love using autonomous agents like @allhands_ai OpenHands for 80% of the work (esp. backend), and then an interactive IDE like @windsurf or @zeddotdev for debugging, refinement, and UI work. It saves tons of my time and saves a lot of money too with the right models/plans.',
    url: 'https://x.com/archimagos/status/1968386148121862626',
  },
  {
    name: 'Wil - e/acc',
    handle: '@wilfullyapt',
    avatar: '/assets/webflow/avatars/69783c9ceee8b37f4ea0de9d_7pG3i1Kf_400x400.jpeg',
    content: "I fvkn love vibe coding with OpenHands. It's not like your editor is doing things for you, it's like an idiot internal that literally knows all the book stuff. OpenHands commit, my tweaks, rinse and repeat. Phenomenal!!",
    url: 'https://x.com/wilfullyapt/status/1906124164337197058',
  },
  {
    name: 'Christian Genco',
    handle: '@cgenco',
    avatar: '/assets/webflow/avatars/69783c9cc7c27cc7bedeac33_40ETg5qV_400x400.jpeg',
    content: "I haven't tried Devin yet but I freakin' love OpenHands. I prefer having more control over how it's working. Also that general workflow is the future. Just opening GitHub issues and the AI figures it out and writes tests and then pushes a PR is magical.",
    url: 'https://x.com/cgenco/status/1887551887001424102',
  },
  {
    name: 'Fisherman',
    handle: '@Rybens92',
    avatar: '/assets/webflow/avatars/69783c9c26731c8116dd7b63_VCfb1w94_400x400.jpeg',
    content: 'Unpopular opinion, but still a very good alternative - @OpenHandsDev',
    url: 'https://x.com/Rybens92/status/2008218093856976948',
  },
  {
    name: 'Nour Eddine Hamaidi',
    handle: '@NOOROU',
    avatar: '/assets/webflow/avatars/69783c9c63f057bd2835f7dd_i-ehEnWR_400x400.jpeg',
    content: 'Just tested a long session it did good with @OpenHandsDev',
    url: 'https://x.com/NOOROU/status/2006419963599630419',
  },
  {
    name: 'Chris Kennedy',
    handle: '@c3K',
    avatar: '/assets/webflow/avatars/69783c9da42038611de27929_987pKt6O_400x400.jpeg',
    content: "I recommend trying @OpenHandsDev if you haven't already",
    url: 'https://x.com/c3K/status/2002808616290812268',
  },
];

// Footer social links
const SOCIAL_LINKS = [
  { name: 'Slack', url: 'https://openhands.dev/joinslack', icon: '/assets/webflow/misc/6908d21b2270590dedae7f30_Frame48095725.svg' },
  { name: 'X', url: 'https://x.com/OpenHandsDev', icon: '/assets/webflow/misc/6908d21bd2a1305f4f77161b_Frame48095723.svg' },
  { name: 'GitHub', url: 'https://github.com/OpenHands/OpenHands', icon: '/assets/webflow/misc/6908d21a36dee3e7147b3d21_Frame48095724.svg' },
];

// Code examples for each tab
const TAB_CODE = {
  sdk: `import os

from openhands.sdk import LLM, Agent, Conversation, Tool
from openhands.tools.file_editor import FileEditorTool
from openhands.tools.task_tracker import TaskTrackerTool
from openhands.tools.terminal import TerminalTool

llm = LLM(
    model="anthropic/claude-sonnet-4-5-20250929",
    api_key=os.getenv('LLM_API_KEY'),
)

agent = Agent(
    llm=llm,
    tools=[
        Tool(name=TerminalTool.name),
        Tool(name=FileEditorTool.name),
        Tool(name=TaskTrackerTool.name),
    ],
)

cwd = os.getcwd()`,
  cloud: `// OpenHands Cloud - Web Interface

Navigate to: https://app.all-hands.dev

1. Sign in with your account
2. Create a new workspace
3. Describe your task in natural language
4. Watch the agent work in real-time
5. Review and approve changes

// Access via API
curl -X POST https://api.all-hands.dev/v1/tasks \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{"prompt": "Fix the bug in auth.py"}'`,
  cli: `# Install OpenHands CLI
pip install openhands-ai

# Start an interactive session
openhands chat

# Run a one-shot task
openhands run "Add unit tests for utils.py"

# Work on a specific repository
openhands --repo ./my-project chat

# Use with specific model
openhands --model claude-sonnet-4 chat`,
};

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'OpenHands | The Open Platform for Cloud Coding Agents' },
    { name: 'description', content: 'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering tasks securely in sandboxed environments.' },
    { property: 'og:title', content: 'OpenHands | The Open Platform for Cloud Coding Agents' },
    { property: 'og:description', content: 'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering tasks securely in sandboxed environments.' },
    { property: 'og:image', content: '/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' },
  ];
};

const Home = () => {
  const { openGitHubModal } = useGitHubModal();
  const [activeTab, setActiveTab] = React.useState<'sdk' | 'cloud' | 'cli'>('sdk');
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  return (
    <main data-testid='home-content'>
      {/* ASCII Background Container - Extends across Hero + Trust Logos + SDK Tabs sections */}
      {/* On openhands.dev this is ~1400px tall */}
      <div className='relative'>
        {/* Animated ASCII Art Background - spans multiple sections */}
        {/* ASCII container - opacity is on the pre element itself, not the container */}
        <div className='absolute inset-0 pointer-events-none' style={{ minHeight: '1400px' }}>
          <Suspense fallback={
            <img 
              src='/assets/webflow/backgrounds/ascii-pattern.svg' 
              alt='' 
              className='w-full h-full object-cover'
            />
          }>
            <ASCIIAnimation />
          </Suspense>
        </div>
        
        {/* Hero Section */}
        {/* Combined Hero + Trust Logos + SDK section to match live site structure */}
        {/* Live site has no padding on section - spacing from internal elements */}
        <section className='relative overflow-hidden'>
          {/* Hero - 64px offset from section top to match live site */}
          <div className='relative z-10 max-w-4xl mx-auto px-10 text-center pt-16'>
            {/* Floating Banner - matching openhands.dev structure */}
            <div className='inline-block bg-brand-accent mb-8' style={{ borderRadius: '0.4rem' }}>
              <div className='flex items-center gap-3 px-6 py-3.5 text-sm'>
                <span className="whitespace-nowrap">Introducing the OpenHands Index, a live leaderboard for language models on real software engineering tasks.</span>
                <span className='hidden sm:block w-px h-4 bg-brand-fg/30'></span>
                <Link to='/blog/openhands-index' className='font-semibold hover:underline whitespace-nowrap'>
                  Read More
                </Link>
              </div>
            </div>

            <h1 className='mb-6' style={{ 
              fontSize: 'clamp(2rem, 1.5rem + 2vw, 2.75rem)', 
              lineHeight: '1.1', 
              fontWeight: 500, 
              letterSpacing: '-0.03em' 
            }}>
              The open platform for cloud coding agents.
            </h1>
            
            {/* Use Case Carousel */}
            <UseCaseCarousel />
          </div>

          {/* Trust Logos - part of hero section */}
          <div className='max-w-5xl mx-auto px-10 py-12 mt-12'>
            <p className='text-center text-lg font-semibold mb-8'>Trusted by engineers at</p>
            <div className='logo-grid'>
              {CLIENT_LOGOS.map((logo) => (
                <img key={logo.name} src={logo.url} alt={logo.name} />
              ))}
            </div>
          </div>

          {/* SDK Showcase - part of hero section */}
          {/* Live site uses 1/4 to 3/4 split: text ~294px, code ~968px */}
          {/* Live site has no vertical padding on SDK container */}
          <div className='max-w-[1262px] mx-auto px-10 mt-8 grid lg:grid-cols-[294px_1fr] gap-16 items-center'>
            <div className='max-w-[270px]'>
              <div className='flex gap-2 mb-6'>
                {(['sdk', 'cloud', 'cli'] as const).map((tab, idx) => (
                  <button
                    key={tab}
                    data-key={String(idx + 1)}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === tab ? 'bg-brand-fg text-brand-bg' : 'bg-brand-fg/10 hover:bg-brand-fg/20'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
              {/* Render all tab content for SEO/SSR parity with Webflow - use sr-only for non-active */}
              {/* SDK Tab */}
              <div className={activeTab !== 'sdk' ? 'sr-only' : ''}>
                <h2 className='text-[44px] font-bold mb-4'>SDK</h2>
                <p className='text-lg text-brand-muted mb-6'>Use the SDK to embed OpenHands into apps and workflows</p>
                <Link to='https://docs.openhands.dev/sdk' className='btn btn-outline'>Get the SDK</Link>
              </div>
              {/* Cloud Tab */}
              <div className={activeTab !== 'cloud' ? 'sr-only' : ''}>
                <h2 className='text-[44px] font-bold mb-4'>Cloud</h2>
                <p className='text-lg text-brand-muted mb-6'>Plan and execute complex tasks via the desktop or mobile web</p>
                <Link to='https://app.all-hands.dev' className='btn btn-outline'>Try it live</Link>
              </div>
              {/* CLI Tab */}
              <div className={activeTab !== 'cli' ? 'sr-only' : ''}>
                <h2 className='text-[44px] font-bold mb-4'>CLI</h2>
                <p className='text-lg text-brand-muted mb-6'>Pair with OpenHands CLI right from your terminal</p>
                <div className='flex gap-3 flex-wrap'>
                  <Link to='https://pypi.org/project/openhands-ai/' className='btn btn-outline'>Download CLI</Link>
                  <Link to='https://github.com/OpenHands/OpenHands/releases' className='btn btn-outline'>Download Web UI</Link>
                </div>
              </div>
            </div>
            <div className='code-window'>
              <div className='code-header'>
                <span className='code-dot bg-red-500'></span>
                <span className='code-dot bg-yellow-500'></span>
                <span className='code-dot bg-green-500'></span>
                <span className='ml-auto text-xs text-white/50'>OpenHands</span>
              </div>
              <pre className='p-5 text-sm text-card-text overflow-x-auto font-mono leading-relaxed'>
                <code>{TAB_CODE[activeTab]}</code>
              </pre>
            </div>
          </div>
        </section>

      {/* Why Teams Choose - side-by-side layout matching live site */}
      {/* Live site: left col ~426px (title+CTA), right col ~639px (features stacked) */}
      <section className='py-20'>
        <div className='max-w-[1278px] mx-auto px-10'>
          <div className='flex flex-col lg:flex-row justify-between gap-8'>
            {/* Left column: title + CTA */}
            <div className='lg:w-[33%] flex flex-col justify-between'>
              <h3 className='section-title max-w-sm mb-8'>Why teams choose OpenHands</h3>
              <Link to='https://app.all-hands.dev' className='btn btn-outline w-fit'>Try it live</Link>
            </div>
            {/* Right column: features stacked vertically */}
            <div className='lg:w-[50%] flex flex-col'>
              {FEATURES.map((feature) => (
                <div key={feature.title} className='feature-item-stacked'>
                  <img src={feature.icon} alt='' className='w-8 h-8 flex-shrink-0' />
                  <div>
                    <p className='font-semibold mb-1'>{feature.title}</p>
                    <p className='text-sm text-brand-muted'>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </div>{/* End ASCII Background Container */}

      {/* Automate Section - full width, inner constrained */}
      {/* Use Cases - matches openhands.dev layout: icons in dark boxes, text outside */}
      <section className='py-20'>
        <div className='max-w-5xl mx-auto px-10'>
          {/* First row - no container background, just grid of cards */}
          <div className='grid md:grid-cols-3 gap-6 mb-8'>
            {USE_CASES_REDUCE.map((uc) => (
              <div key={uc.title}>
                <div className='bg-card-bg rounded-lg p-6 mb-4 flex items-center justify-center'>
                  <img src={uc.icon} alt='' className='w-[140px] h-[140px]' />
                </div>
                <h3 className='font-semibold text-lg mb-2'>{uc.title}</h3>
                <p className='text-sm text-brand-muted'>{uc.description}</p>
              </div>
            ))}
          </div>

          {/* Second row - with tan container like live site */}
          <div className='use-case-block'>
            <div className='use-case-label'>Streamline complex work</div>
            <div className='grid md:grid-cols-3 gap-6'>
              {USE_CASES_STREAMLINE.map((uc) => (
                <div key={uc.title}>
                  <div className='bg-card-bg rounded-lg p-6 mb-4 flex items-center justify-center'>
                    <img src={uc.icon} alt='' className='w-[140px] h-[140px]' />
                  </div>
                  <h3 className='font-semibold text-lg mb-2'>{uc.title}</h3>
                  <p className='text-sm text-brand-muted'>{uc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - match openhands.dev styling: yellow bg, author photo, arrow nav */}
      <section className='bg-brand-accent py-20 relative overflow-hidden'>
        {/* ASCII art background pattern */}
        <div className='absolute inset-0 opacity-30 pointer-events-none' style={{
          backgroundImage: 'url(/assets/webflow/backgrounds/ascii-pattern.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className='max-w-4xl mx-auto px-10 text-center relative z-10'>
          {/* Render all testimonial H2s - use sr-only for non-active to maintain SSR parity while hiding visually */}
          {TESTIMONIALS.map((testimonial, idx) => (
            <h2 
              key={idx}
              className={`testimonial-quote mb-8 ${idx !== activeTestimonial ? 'sr-only' : ''}`}
            >
              "{testimonial.quote}"
            </h2>
          ))}
          <div className='flex flex-wrap items-center justify-center gap-4 mb-8'>
            {/* Author photo */}
            <div className='w-12 h-12 rounded-full overflow-hidden bg-brand-fg flex-shrink-0'>
              <img
                src={TESTIMONIALS[activeTestimonial].photo}
                alt={TESTIMONIALS[activeTestimonial].name}
                className='w-full h-full object-cover'
              />
            </div>
            <div className='text-left'>
              <span className='font-semibold text-lg'>{TESTIMONIALS[activeTestimonial].name},</span>
              <span className='text-lg ml-2'>{TESTIMONIALS[activeTestimonial].title}</span>
            </div>
            <div className='w-px h-6 bg-brand-fg/30 hidden sm:block' />
            <img src={TESTIMONIALS[activeTestimonial].logo} alt='' className='h-8' />
          </div>
          {/* Arrow navigation like live site */}
          <div className='flex items-center justify-between mt-8'>
            <div className='text-sm'>
              {String(activeTestimonial + 1).padStart(2, '0')}/{String(TESTIMONIALS.length).padStart(2, '0')}
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => setActiveTestimonial(prev => prev === 0 ? TESTIMONIALS.length - 1 : prev - 1)}
                className='w-10 h-10 rounded-full border border-brand-fg/30 flex items-center justify-center hover:bg-brand-fg/10 transition-colors'
                aria-label='Previous testimonial'
              >
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <path d='M15 18l-6-6 6-6' />
                </svg>
              </button>
              <button
                onClick={() => setActiveTestimonial(prev => prev === TESTIMONIALS.length - 1 ? 0 : prev + 1)}
                className='w-10 h-10 rounded-full border border-brand-fg/30 flex items-center justify-center hover:bg-brand-fg/10 transition-colors'
                aria-label='Next testimonial'
              >
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <path d='M9 18l6-6-6-6' />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Cards Section - full width */}
      <section className='py-20'>
        <div className='max-w-6xl mx-auto px-10'>
          <div className='grid lg:grid-cols-2 gap-6 mb-6'>
            {/* Community velocity card - live h=616px */}
            <div className='card-dark p-8 min-h-[616px]'>
              <p className='text-brand-accent font-medium mb-2'>Community that compounds velocity</p>
              <p className='text-white/70 mb-6'>
                With {formatThousands(statistics.stargazers)}+ GitHub stars and a thriving open-source ecosystem, OpenHands evolves through collective innovation - every contribution makes the platform faster, safer, and smarter.
              </p>
              <Link to='https://github.com/OpenHands/OpenHands' className='btn btn-outline-light mb-8'>
                Explore the repo
              </Link>
              <div className='flex items-end justify-end gap-2'>
                <span className='text-6xl font-bold text-brand-accent'>{formatThousands(statistics.stargazers)}</span>
                <span className='text-2xl font-bold text-white'>+</span>
              </div>
              <div className='flex items-center justify-end gap-2 mt-2'>
                <span className='text-sm text-white/60'>GitHub stars</span>
                <span className='text-brand-accent'>⭐</span>
              </div>
            </div>
            {/* Integrations card - live h=616px */}
            <div className='card-dark p-8 flex flex-col justify-between min-h-[616px]'>
              <div>
                <p className='text-brand-accent font-medium mb-2'>Plays well with your stack</p>
                <p className='text-white/70 mb-6'>
                  Native integrations with GitHub, GitLab, CI/CD, Slack, and ticketing tools. OpenHands fits seamlessly into enterprise governance systems and your preferred model providers.
                </p>
              </div>
              <div className='grid grid-cols-4 gap-4 mt-auto'>
                <div className='text-center'>
                  <img src='/assets/webflow/icons/6908c8dc26f3de5a93212b4c_loop-1--multimedia-multi-button-repeat-media-loop-infinity-controls.svg' alt='CI/CD' className='h-8 mx-auto mb-2' />
                  <span className='text-xs text-white/60'>CI/CD</span>
                </div>
                <div className='text-center'>
                  <img src='/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg' alt='Slack' className='h-8 mx-auto mb-2' />
                  <span className='text-xs text-white/60'>Slack</span>
                </div>
                <div className='text-center'>
                  <img src='/assets/webflow/icons/6908c8dc24685e3f5e172012_github-mark4.svg' alt='GitHub' className='h-8 mx-auto mb-2' />
                  <span className='text-xs text-white/60'>GitHub</span>
                </div>
                <div className='text-center'>
                  <img src='/assets/webflow/icons/6908c8dde7fa5732b9ed5cb4_Vector.svg' alt='GitLab' className='h-8 mx-auto mb-2' />
                  <span className='text-xs text-white/60'>GitLab</span>
                </div>
              </div>
            </div>
          </div>
          {/* Enterprise security card - live h=419px */}
          <div className='card-dark p-8 min-h-[419px]'>
            <div className='grid lg:grid-cols-2 gap-8 items-center'>
              <div>
                <p className='text-brand-accent font-medium mb-2'>Enterprise-grade security and control</p>
                <p className='text-white/70 mb-6'>
                  Control every layer of your environment with fine-grained access control, model-agnostic architecture, and flexible self-hosted or private cloud deployment options that keep your code and data secure.
                </p>
                <Link to='/enterprise' className='btn btn-outline-light'>
                  Learn about Enterprise
                </Link>
              </div>
              <div className='flex justify-center'>
                <img src='/assets/webflow/misc/6908c923f44bb0269a602378_last-icon.svg' alt='Security' className='h-32' />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developers Love OpenHands Section - full width */}
      <section className='py-20 bg-brand-bg'>
        <div className='max-w-6xl mx-auto px-10'>
          <div className='text-center mb-12'>
            <h2 className='section-title'>Developers love OpenHands</h2>
            <p className='text-brand-muted'>Join millions of developers to build software autonomously</p>
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {DEVELOPER_TWEETS.map((tweet) => (
              <a
                key={tweet.handle}
                href={tweet.url}
                target='_blank'
                rel='noopener noreferrer'
                className='card bg-white p-4 hover:shadow-lg transition-shadow block'
              >
                <div className='flex items-center gap-3 mb-3'>
                  <img src={tweet.avatar} alt={tweet.name} className='w-10 h-10 rounded-full' />
                  <div>
                    <p className='font-semibold text-sm'>{tweet.name}</p>
                    <p className='text-xs text-brand-muted'>{tweet.handle}</p>
                  </div>
                </div>
                <p className='text-sm text-brand-fg'>{tweet.content}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA Section - full width */}
      <section className='py-20 bg-brand-accent text-brand-fg text-center relative overflow-hidden'>
        {/* ASCII Art Background */}
        <div className='absolute inset-0 pointer-events-none opacity-20'>
          <img 
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg' 
            alt='' 
            className='w-full h-full object-cover'
          />
        </div>
        <div className='max-w-3xl mx-auto relative z-10'>
          <p className='text-3xl lg:text-4xl font-bold mb-4'>
            Building the open standard for autonomous software development.
          </p>
          <p className='text-brand-fg/70 mb-8'>
            OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
          </p>
          <div className='flex gap-4 justify-center flex-wrap mb-12'>
            <Link to='https://docs.openhands.dev/sdk' className='btn btn-primary btn-lg'>
              Build with SDK
            </Link>
            <Link to='https://app.all-hands.dev' className='btn btn-outline-light btn-lg'>
              Try it live
            </Link>
          </div>
          {/* Social Links */}
          <div className='flex justify-center gap-4 mb-8'>
            {SOCIAL_LINKS.map((link) => (
              <a key={link.name} href={link.url} target='_blank' rel='noopener noreferrer' className='w-12 h-12 rounded-full border border-brand-fg/20 flex items-center justify-center hover:bg-brand-fg/10 transition-colors'>
                <img src={link.icon} alt={link.name} className='h-6 w-6' />
              </a>
            ))}
          </div>
          {/* Footer Nav - inside CTA section to match live site */}
          <Footer />
        </div>
      </section>
    </main>
  );
};

export default Home;
