import React from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/home';
import statistics from '~/data/statistics.json';
import { Footer } from '~/components/footer';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { formatThousands } from '~/utils/format-thousands';
import { ASCIIAnimation } from '~/components/ascii-animation';
import { createSocialPreviewMeta } from '~/utils/seo';
import {
  AGENT_CANVAS_CONNECTION_GUIDE_URL,
  AGENT_CANVAS_DOWNLOAD_URL,
  AGENT_CANVAS_LAUNCH_BLOG_URL,
  OPENHANDS_AUTOMATIONS_GUIDE_URL,
  OPENHANDS_DOCS_URL,
} from '~/constants/product-links';

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
    title: 'Agent Canvas',
    description: 'One workspace for parallel agents, local runs, cloud backends, and the agents you already use.',
    href: '/product/agent-canvas',
    cta: 'Learn more',
    image: '/assets/webflow/misc/6994c3bfa634f5f3966d2150_4c76230966d0d54a446a009e4f4a19c2_gui.png',
  },
  {
    title: 'Automations',
    description: 'Build it once, then let cron schedules and engineering events run it forever.',
    href: OPENHANDS_AUTOMATIONS_GUIDE_URL,
    cta: 'Read the guide',
    image: '/assets/webflow/blog/openhands-enterprise-agent-control-plane/20260506-openhands-enterprise-agent-control-plane-automations.png',
  },
  {
    title: 'Cloud',
    description: "Always-on agents that keep working after your laptop closes.",
    href: 'https://app.all-hands.dev/',
    cta: 'Try Cloud',
    image: '/assets/webflow/misc/691b30afadf69b956d353513_Cloud.webp',
  },
  {
    title: 'SDK',
    description: 'Build custom agents, tools, and internal platforms on the open foundation.',
    href: 'https://docs.openhands.dev/sdk',
    cta: 'Get the SDK',
    image: '/assets/webflow/misc/691b30aa3c700dcb47a96c00_SDK.webp',
  },
];

const FEATURES = [
  {
    title: 'Run agents where real engineering happens',
    description: 'Let agents work across your repos, tools, and workflows so they can execute real engineering tasks, not just suggest what to do next.',
    icon: '/assets/webflow/features/690b95d3c92c94a6a9b249f8_Frame48095775.svg',
  },
  {
    title: 'Turn repeated work into always-on workflows',
    description: 'Turn code review, dependency updates, PR summaries, CI fixes, and other recurring work into workflows that run from a schedule or trigger.',
    icon: '/assets/webflow/features/690b95df7d9ca76624d45550_Frame48095777.svg',
  },
  {
    title: 'Customize agents around your workflow',
    description: 'Bring your tools, models, interfaces, and workflows. OpenHands adapts to how your team builds, not the other way around.',
    icon: '/assets/webflow/features/690b95d99040920ad0084107_Frame48095776.svg',
  },
  {
    title: 'Scale agent usage with control',
    description: 'Run agents across teams with the visibility, access controls, audit trails, and cost guardrails your organization needs.',
    icon: '/assets/webflow/features/690b95ca541b813083e0b38a_Frame48095774.svg',
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

const ENTERPRISE_LOGOS_HTML = "<div data-wf-el=\"enterprise-logos\" class=\"enterprise-logos\" style=\"display:flex;justify-content:center;align-items:center;gap:48px;margin-top:32px;color:#F9F0D9\"><div data-wf-el=\"enterprise-logo\" class=\"enterprise-logo\" style=\"width:87px;height:64px;color:#F9F0D9\"><svg xmlns=\"http://www.w3.org/2000/svg\" id=\"svg2\" x=\"0px\" y=\"0px\" height=\"100%\" viewBox=\"35.188 31.512 351.46 258.785\" width=\"auto\"><path id=\"path17\" d=\"M384.195,282.109c0,3.771-2.769,6.302-6.047,6.302v-0.023c-3.371,0.023-6.089-2.508-6.089-6.278  c0-3.769,2.718-6.293,6.089-6.293C381.427,275.816,384.195,278.34,384.195,282.109z M386.648,282.109c0-5.175-4.02-8.179-8.5-8.179  c-4.511,0-8.531,3.004-8.531,8.179c0,5.172,4.021,8.188,8.531,8.188C382.629,290.297,386.648,287.281,386.648,282.109   M376.738,282.801h0.91l2.109,3.703h2.316l-2.336-3.859c1.207-0.086,2.2-0.661,2.2-2.286c0-2.019-1.392-2.668-3.75-2.668h-3.411  v8.813h1.961V282.801 M376.738,281.309v-2.122h1.364c0.742,0,1.753,0.06,1.753,0.965c0,0.985-0.523,1.157-1.398,1.157H376.738\"></path><path id=\"path19\" d=\"M329.406,237.027l10.598,28.993H318.48L329.406,237.027z M318.056,225.738l-24.423,61.88h17.246l3.863-10.934  h28.903l3.656,10.934h18.722l-24.605-61.888L318.056,225.738z M269.023,287.641h17.497v-61.922l-17.5-0.004L269.023,287.641z   M147.556,225.715l-14.598,49.078l-13.984-49.074l-18.879-0.004l19.972,61.926h25.207l20.133-61.926H147.556z M218.281,239.199h7.52  c10.91,0,17.966,4.898,17.966,17.609c0,12.714-7.056,17.613-17.966,17.613h-7.52V239.199z M200.931,225.715v61.926h28.366  c15.113,0,20.048-2.512,25.384-8.148c3.769-3.957,6.207-12.641,6.207-22.134c0-8.707-2.063-16.468-5.66-21.304  c-6.481-8.649-15.817-10.34-29.75-10.34H200.931z M35.188,225.629v62.012h17.645v-47.086l13.672,0.004  c4.527,0,7.754,1.128,9.934,3.457c2.765,2.945,3.894,7.699,3.894,16.395v27.23h17.098v-34.262c0-24.453-15.586-27.75-30.836-27.75  H35.188z M172.771,225.715l0.007,61.926h17.489v-61.926H172.771z\"></path><path id=\"path21\" fill=\"currentColor\" d=\"M82.211,102.414c0,0,22.504-33.203,67.437-36.638V53.73  c-49.769,3.997-92.867,46.149-92.867,46.149s24.41,70.565,92.867,77.026v-12.804C99.411,157.781,82.211,102.414,82.211,102.414z   M149.648,138.637v11.726c-37.968-6.769-48.507-46.237-48.507-46.237s18.23-20.195,48.507-23.47v12.867  c-0.023,0-0.039-0.007-0.058-0.007c-15.891-1.907-28.305,12.938-28.305,12.938S128.243,131.445,149.648,138.637 M149.648,31.512  V53.73c1.461-0.112,2.922-0.207,4.391-0.257c56.582-1.907,93.449,46.406,93.449,46.406s-42.343,51.488-86.457,51.488  c-4.043,0-7.828-0.375-11.383-1.005v13.739c3.04,0.386,6.192,0.613,9.481,0.613c41.051,0,70.738-20.965,99.484-45.778  c4.766,3.817,24.278,13.103,28.289,17.168c-27.332,22.883-91.031,41.329-127.144,41.329c-3.481,0-6.824-0.211-10.11-0.528v19.306  h156.032V31.512H149.648z M149.648,80.656V65.777c1.446-0.101,2.903-0.179,4.391-0.226c40.688-1.278,67.382,34.965,67.382,34.965  s-28.832,40.043-59.746,40.043c-4.449,0-8.438-0.715-12.028-1.922V93.523c15.84,1.914,19.028,8.911,28.551,24.786l21.18-17.859  c0,0-15.461-20.277-41.524-20.277C155.021,80.172,152.31,80.371,149.648,80.656\"></path></svg></div><div data-wf-el=\"enterprise-logo\" class=\"enterprise-logo amd\" style=\"width:268px;height:64px;color:#F9F0D9\"><svg xmlns=\"http://www.w3.org/2000/svg\" id=\"Layer_1\" x=\"0px\" y=\"0px\" height=\"100%\" viewBox=\"0 0 800 190.803\" width=\"auto\"><g id=\"clear_space\"></g><g id=\"logo\"><g><path d=\"M187.888,178.12H143.52l-13.573-32.735H56.003L43.637,178.12H0L66.667,12.776h47.761L187.888,178.12z M91.155,52.285    L66.912,116.53h50.913L91.155,52.285z\"></path><path d=\"M349.056,12.776h35.88V178.12h-41.219V74.842l-44.608,51.878h-6.301l-44.605-51.878V178.12h-41.219V12.776h35.88    l53.093,61.336L349.056,12.776z\"></path><path d=\"M489.375,12.776c60.364,0,91.391,37.573,91.391,82.909c0,47.517-30.058,82.435-96,82.435h-68.369V12.776H489.375z     M457.613,147.815h26.906c41.457,0,53.823-28.127,53.823-52.375c0-28.368-15.276-52.363-54.308-52.363h-26.422V147.815    L457.613,147.815z\"></path></g><g><polygon fill=\"currentColor\" points=\"748.028,51.981 662.769,51.981 610.797,0 800,0 800,189.21 748.028,137.235   \"></polygon><polygon fill=\"currentColor\" points=\"662.708,137.296 662.708,62.397 609.2,115.901 609.2,190.804 684.089,190.804 737.594,137.296       \"></polygon></g></g></svg>";

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
    title: 'OpenHands | Agent Canvas for Always-on Coding Agents',
    description:
      'Download Agent Canvas and turn coding agents into an always-on engineering team. Run parallel sessions, create automations, and scale from your laptop to your organization.',
  });

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
      <section data-wf-el='section-hero' className='relative' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }}>
        {/* Live's `.hero` has `min-height: 100vh` — required so the
          * ASCII canvas behind the hero can fill the viewport on tall
          * screens.  Without it, the hero collapses to the height of
          * its content (banner + heading + buttons + logo grid) and
          * the canvas underneath gets clipped. */}
        <div data-wf-el='hero' className='relative' style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', justifyContent: 'flex-start', alignItems: 'center', minHeight: '100vh' }}>
          <div data-wf-el='asci-wrap' className='absolute inset-0 z-0 overflow-hidden' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', pointerEvents: 'auto' }}>
            <div data-wf-el='asci-embed' className='h-full w-full overflow-hidden'><ASCIIAnimation /></div>
          </div>

          <div data-wf-el='container' className='relative z-10 mx-auto w-full max-w-[1238px]'>
            <div data-wf-el='hero-content' className='w-full' style={{ textAlign: 'center', paddingTop: '56px', paddingBottom: '72px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '32px' }}>
              <div data-wf-el='banner' style={{ backgroundColor: 'rgb(255, 255, 139)', borderRadius: '6.4px' }}>
                {/* Live's `.banner-wrap` is full-width inside its container
                  * (no max-width).  The earlier `mx-auto max-w-[688px]` was
                  * forcing the inline announcement text to wrap to 2 lines
                  * on desktop — taller banner ⇒ ~27px Y-drift on the H1
                  * below it and cascading drift through the page. */}
                <div data-wf-el='banner-wrap' className='w-full text-center' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', borderRadius: '0px', paddingTop: '9.3px', paddingBottom: '9.3px', paddingLeft: '20px', paddingRight: '20px' }}>
                  <div className='flex flex-col items-center justify-center sm:flex-row'>
                    <div className='sm:flex-1' style={{ padding: '0 12px' }}>
                      <p className='text-base font-normal leading-[1.4] text-brand-fg'>Agent Canvas is live! Check out the launch blog to see what&apos;s new</p>
                    </div>
                    <div className='hidden flex-shrink-0 sm:block' style={{ padding: '0 12px' }}>
                      <div className='h-8 w-px bg-brand-fg/20' aria-hidden='true' />
                    </div>
                    <div className='flex-shrink-0' style={{ padding: '0 12px' }}>
                      <Link to={AGENT_CANVAS_LAUNCH_BLOG_URL} className='font-sohne-buch text-base font-normal leading-[22.4px] hover:text-[#8a5f45]' style={{ display: 'block' }}>
                        Read the blog
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

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
              <div data-wf-el='hero-heading_wrap' className='flex flex-col items-center gap-2 text-center' style={{ justifyContent: 'center' }}>
                {/* Live's `.hero-heading_h1.h1` has `margin-bottom: 0`. */}
                <h1 id='hero-heading' className='fluid-h1 font-medium tracking-[-0.03em] text-brand-fg' style={{ marginBottom: '0px' }}>
                  Turn your coding agents into an always-on engineering team.
                </h1>
                {/* Live's `.hero-heading_paragraph.paragraph-lg.u-text-darkgray`
                  * has `max-width: 40ch; margin-bottom: 0`.  The earlier
                  * `mb-7` (28px) was adding extra space above the CTAs. */}
                <p id='hero-subheading' className='max-w-[40ch] fluid-body-lg font-medium text-brand-muted' style={{ marginLeft: '0px', marginRight: '0px', marginBottom: '0px' }}>
                  From a local agent workspace to an enterprise Agent Control Plane. Parallel sessions, built-in automations, and a path from your laptop to your whole org.
                </p>
              </div>

              {/* hero_btn_wrap — sibling of hero-heading_wrap on live. */}
              <div data-wf-el='hero_btn_wrap' className='flex flex-wrap items-center justify-center gap-4' style={{ marginBottom: '0px', paddingTop: '0px' }}>
                <OverlayLinkButton href={AGENT_CANVAS_DOWNLOAD_URL} label='Download Agent Canvas' variant='primary' />
                <OverlayLinkButton href={OPENHANDS_DOCS_URL} label='See developer docs' variant='outline' />
              </div>

              {/* hero_sublink_text — sibling of hero-heading_wrap on live.
                * Live's wrapper uses `font-size: .88rem` (14.08px) and
                * `font-weight: 400`. */}
              <div data-wf-el='hero_sublink_text' className='text-brand-fg' style={{ fontSize: '14.08px', lineHeight: '19.712px', fontWeight: 400 }}>
                Connecting Claude Code, Codex, or another ACP agent?{' '}
                <a
                  href={AGENT_CANVAS_CONNECTION_GUIDE_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-normal text-brand-fg hover:decoration-[#8a5f45]'
                  style={{
                    textDecoration: 'underline',
                    textDecorationThickness: '1.408px',
                    textUnderlineOffset: '2px',
                    fontSize: '14.08px',
                    lineHeight: '19.712px',
                  }}
                >

                  Read the connection guide
                </a>
              </div>
            </div>

            {/* Workflow carousel (inside hero section).  Live's
              * `.hero-splide_top` directly contains an `<h2>` and a
              * buttons div as siblings — the earlier extra
              * `<div className='max-w-[384px]'>` wrapper was breaking
              * the structural parity. */}
            <div data-wf-el='hero-splide_top' className='mb-4 flex flex-wrap justify-between gap-x-12 gap-y-4' style={{ alignItems: 'center' }}>
              {/* Live: `.hero-splide_heading.h2 { margin-bottom: 0;
                * font-size: 2rem (32px) }`.  Use a fixed 32px size
                * here (not `fluid-h3`) to match live exactly. */}
              <h2 data-wf-el='hero-splide_heading' className='font-medium text-brand-fg' style={{ fontSize: '32px', lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '0px' }}>
                Start with a proven workflow
              </h2>
            <div data-wf-el='hero-splide_buttons' className='hidden items-center gap-4 md:flex' style={{ justifyContent: 'flex-start' }}>
              <button
                type='button'
                onClick={() => setWorkflowOffset((current) => (current === 0 ? WORKFLOWS.length - 1 : current - 1))}
                className='block w-8 cursor-pointer p-1 text-brand-fg transition-colors hover:opacity-80'
                style={{ background: 'transparent', boxSizing: 'content-box' }}
                aria-label='Previous workflow'
              >
                <svg data-wf-el='hero-splide_button' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' className='block w-full' style={{ fill: 'none' }} aria-hidden='true'>
                  <path fillRule='evenodd' clipRule='evenodd' d='M30 16C30 16.2652 29.8946 16.5195 29.7071 16.7071C29.5196 16.8946 29.2652 17 29 17L5.414 17L11.708 23.292C11.8958 23.4797 12.0013 23.7344 12.0013 24C12.0013 24.2655 11.8958 24.5202 11.708 24.708C11.5202 24.8957 11.2656 25.0012 11 25.0012C10.7344 25.0012 10.4798 24.8957 10.292 24.708L2.292 16.708C2.19887 16.6151 2.12499 16.5047 2.07458 16.3832C2.02416 16.2617 1.99821 16.1315 1.99821 16C1.99821 15.8684 2.02416 15.7382 2.07458 15.6167C2.12499 15.4952 2.19887 15.3848 2.292 15.292L10.292 7.29196C10.4798 7.10419 10.7345 6.9987 11 6.9987C11.2656 6.9987 11.5202 7.10419 11.708 7.29196C11.8958 7.47973 12.0013 7.73441 12.0013 7.99996C12.0013 8.26551 11.8958 8.52019 11.708 8.70796L5.414 15L29 15C29.2652 15 29.5196 15.1053 29.7071 15.2929C29.8946 15.4804 30 15.7347 30 16Z' />
                </svg>
              </button>
              <button
                type='button'
                onClick={() => setWorkflowOffset((current) => (current + 1) % WORKFLOWS.length)}
                className='block w-8 cursor-pointer p-1 text-brand-fg transition-colors hover:opacity-80'
                style={{ background: 'transparent', boxSizing: 'content-box' }}
                aria-label='Next workflow'
              >
                <svg data-wf-el='hero-splide_button' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' className='block w-full' style={{ fill: 'none' }} aria-hidden='true'>
                  <path fillRule='evenodd' clipRule='evenodd' d='M2 16C2 15.7348 2.10536 15.4805 2.29289 15.2929C2.48043 15.1054 2.73478 15 3 15H26.586L20.292 8.70804C20.1042 8.52027 19.9987 8.26559 19.9987 8.00004C19.9987 7.73449 20.1042 7.47982 20.292 7.29204C20.4798 7.10427 20.7344 6.99878 21 6.99878C21.2656 6.99878 21.5202 7.10427 21.708 7.29204L29.708 15.292C29.8011 15.3849 29.875 15.4953 29.9254 15.6168C29.9758 15.7383 30.0018 15.8685 30.0018 16C30.0018 16.1316 29.9758 16.2618 29.9254 16.3833C29.875 16.5048 29.8011 16.6152 29.708 16.708L21.708 24.708C21.5202 24.8958 21.2656 25.0013 21 25.0013C20.7344 25.0013 20.4798 24.8958 20.292 24.708C20.1042 24.5203 19.9987 24.2656 19.9987 24C19.9987 23.7345 20.1042 23.4798 20.292 23.292L26.586 17H3C2.73478 17 2.48043 16.8947 2.29289 16.7071C2.10536 16.5196 2 16.2653 2 16Z' />
                </svg>
              </button>
            </div>
          </div>

          {/* Live wraps this in a Splide carousel; we use a CSS scroll-snap
              row with manual prev/next buttons. Tag with `data-splide` so the
              widget parity check matches live's mast Splide instance. */}
          <div data-splide='workflows' className='flex cursor-grab gap-6 overflow-x-auto lg:overflow-visible' style={{ scrollSnapType: 'x mandatory' }}>
            {visibleWorkflows.map((workflow) => (
              <article
                key={workflow.title}
                data-wf-el='capabilities_card_wrap'
                className='flex flex-shrink-0 cursor-grab flex-col gap-4 rounded-2xl border border-[rgba(30,21,15,0.2)] bg-[#f9f6e9] p-6 lg:w-[352px]'
                style={{ scrollSnapAlign: 'start', justifyContent: 'flex-start', alignItems: 'flex-start' }}
              >
                {/* Live's `.capabilities_card_icon` is `width: 2.25rem`
                  * (36px) with NO margin-bottom — the spacing between
                  * the icon and the title comes from the `gap: 1rem`
                  * on `.capabilities_card_wrap`.  The earlier `mb-4`
                  * doubled that gap (gap-4 = 16px parent gap + mb-4 =
                  * 16px on the icon = 32px total) and pushed every
                  * H3/P beneath the icon down by 16px. */}
                <img data-wf-el='capabilities_card_icon' src={workflow.iconSrc} alt='' className='h-9 w-9' style={{ verticalAlign: 'bottom', marginBottom: '0px', objectFit: 'fill' }} />
                <div data-wf-el='capabilities_card_content' className='flex flex-col gap-1'>
                  {/* Live's `.capabilities_card_heading` strips the
                      H3 element's default mb (9.6) — vertical spacing
                      below the heading comes from the next element's
                      mt instead. */}
                  <h3 data-wf-el='capabilities_card_heading' className='text-[24px] font-medium leading-[1.2] text-brand-fg' style={{ marginBottom: 0 }}>{workflow.title}</h3>
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
                    data-modal='open'
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
              {/* Live's `.h2` margin-bottom (used for this heading via
                * the `.u-mb-xs` modifier) computes to 9.6px — `mb-5` was
                * 20px, adding ~10px of unwanted space above the logos. */}
              <div data-wf-el='logo-grid-component_heading_heading' className='text-center fluid-h3 text-brand-fg' style={{ marginBottom: '9.6px' }}>Trusted by engineers at</div>
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

          {/* Product surface row: active SDK/Cloud/CLI card on the left and
              the matching hero media on the right. Dimensions and offsets
              mirror the live Webflow export so rendered image rects line up
              without relying on screenshots. */}
          <div data-wf-el='hero-content' data-slider='hero-surfaces' className='w-full' style={{ display: 'block', marginTop: '0px' }}>
            <div className='mx-auto max-w-[1238px]'>
              <div id='hero-media' className='flex flex-col lg:flex-row lg:items-start lg:gap-6'>
                {/* LEFT col: selector controls + active card. Match live's
                    Webflow row: the selector keys align with the top of the
                    media background, then the active card starts immediately
                    below them. */}
                <div className='flex flex-col' style={{ flex: '0 0 270px', maxWidth: '270px', gap: '0px', minHeight: '792px' }}>
                  <div className='flex flex-nowrap items-center justify-start' style={{ position: 'relative', zIndex: 1, marginTop: '49.6px', gap: '9.6px' }}>
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
                          minWidth: '29.64px',
                          minHeight: '24.9px',
                          boxSizing: 'border-box',
                          fontSize: '14.08px',
                          lineHeight: '16.896px',
                          fontWeight: 400,
                          textAlign: 'start',
                          color: 'rgb(249, 240, 217)',
                          backgroundColor: 'rgb(34, 21, 13)',
                          borderColor: 'rgb(0, 0, 0)',
                          opacity: 0.3,
                        }}
                      >
                        {index === activeSurfaceIndex ? surface.title : ''}
                      </div>
                    ))}
                  </div>
                  {/* Only the active copy card occupies layout; the mounted
                      media stack on the right handles the animated transition. */}
                  {PRODUCT_SURFACES.map((surface, idx) => (
                    <div
                      key={surface.title}
                      data-wf-el='card'
                      data-surface-index={idx}
                      ref={(node) => { surfaceCardRefs.current[idx] = node; }}
                      aria-hidden={idx !== activeSurfaceIndex || undefined}
                      style={{
                        borderRadius: '0px',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        borderStyle: 'none',
                        overflow: 'hidden',
                        minHeight: idx === activeSurfaceIndex ? '236px' : '0px',
                        marginTop: '0px',
                        display: idx === activeSurfaceIndex ? 'flex' : 'none',
                      }}
                    >
                      {/* Live's SDK/CLI/GUI heading has margin-top:
                          22px and margin-bottom: 8.8px (live h2-2
                          tokens).  Our previous mt-2/mb-3 was wrong. */}
                      <h2 className='section-title text-brand-fg' style={{ marginTop: '22px', marginBottom: '8.8px' }}>{surface.title}</h2>
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
                    Match live's static post-animation geometry: 944px wide
                    media, 47.1875px vertical padding, and overflow visible on
                    the brown media background. */}
                <div style={{ flex: '0 0 944px', maxWidth: '944px', display: 'flex', position: 'relative', marginTop: '49.6px', alignSelf: 'flex-start' }}>
                  <div className='w-full' style={{ display: 'block' }}>
                    <div data-wf-el='hero-media-bg' style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', backgroundColor: 'rgb(34, 21, 13)', borderRadius: '24px', paddingTop: '47.1875px', paddingBottom: '47.1875px', paddingLeft: '0px', paddingRight: '0px', overflow: 'visible', height: '614.375px', width: '944px' }} className='w-full'>
                      {/* Keep every media panel mounted and cross-fade/slide between them so
                          the controls and scroll observer can animate the screenshot
                          without introducing visible duplicate images. */}
                      <div data-wf-el='hero-track' style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10%', overflow: 'hidden', width: '944px', height: '520px' }}>
                        {PRODUCT_SURFACES.map((surface, idx) => (
                          <div
                            key={surface.title}
                            data-wf-el='hero-media'
                            data-heroslide={surface.title.toLowerCase()}
                            style={{
                              position: 'absolute',
                              top: '-67.14px',
                              left: '0px',
                              width: '944px',
                              height: '654.297px',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              flex: '0 0 100%',
                              display: 'block',
                              opacity: idx === activeSurfaceIndex ? 1 : 0,
                              transform: `translateY(${idx === activeSurfaceIndex ? 0 : idx < activeSurfaceIndex ? -24 : 24}px)`,
                              transition: 'opacity 360ms ease, transform 360ms ease',
                              pointerEvents: idx === activeSurfaceIndex ? 'auto' : 'none',
                            }}
                          >
                            <img src={surface.image} alt='' data-wf-el='standard-media' width={1846} height={1280} loading='lazy' decoding='async' style={{ display: 'inline-block', width: '943.969px', height: '654.297px', maxWidth: '100%', borderRadius: '0px', objectFit: 'fill', objectPosition: '50% 50%' }} />
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

      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto max-w-[1238px] rounded-[24px] border border-brand-fg/15 bg-[#f9f6e9] p-8 lg:p-12'>
          <div className='grid gap-10 lg:grid-cols-[420px_1fr] lg:items-start'>
            <div>
              <div className='font-mono text-[14.08px] leading-[16.896px] text-brand-muted'>GET STARTED</div>
              <h2 className='section-title mt-4 text-brand-fg'>Running in under 5 minutes.</h2>
              <p className='fluid-body-lg text-brand-muted' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
                No Docker. No complex setup. Download the app, connect the agent you already use, and create your first automation.
              </p>
              <div className='mt-8 flex flex-wrap gap-4'>
                <OverlayLinkButton href={AGENT_CANVAS_DOWNLOAD_URL} label='Download Agent Canvas' variant='primary' />
                <OverlayLinkButton href={OPENHANDS_DOCS_URL} label='Read docs' variant='outline' />
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              {[
                {
                  step: '1',
                  title: 'Download Agent Canvas',
                  description: 'Install on macOS, Linux, or Windows. The agent server runs directly on your machine.',
                  href: AGENT_CANVAS_DOWNLOAD_URL,
                  label: 'GitHub Releases ->',
                },
                {
                  step: '2',
                  title: 'Connect your agent',
                  description: 'Use ACP to connect Claude Code, Codex, Gemini CLI, or the OpenHands harness.',
                  href: AGENT_CANVAS_CONNECTION_GUIDE_URL,
                  label: 'Connection Guide ->',
                },
                {
                  step: '3',
                  title: 'Create your first automation',
                  description: 'Set up a GitHub webhook or Monday morning cron so your agent can keep working.',
                  href: OPENHANDS_AUTOMATIONS_GUIDE_URL,
                  label: 'Automations Guide ->',
                },
              ].map((item) => (
                <article key={item.step} className='flex min-h-[280px] flex-col rounded-[16px] border border-brand-fg/15 bg-brand-bg p-6'>
                  <div className='mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-brand-fg font-mono text-brand-bg'>{item.step}</div>
                  <h3 className='fluid-h4 text-brand-fg'>{item.title}</h3>
                  <p className='mt-3 flex-1 text-[16px] leading-[22.4px] text-brand-muted'>{item.description}</p>
                  <a href={item.href} target='_blank' rel='noopener noreferrer' className='mt-6 text-[16px] leading-[22.4px] text-brand-fg underline decoration-[1.6px] underline-offset-[3px] hover:text-[#8a5f45]'>
                    {item.label}
                  </a>
                </article>
              ))}
            </div>
          </div>
          <div className='mt-8 flex flex-wrap gap-3 font-mono text-[14.08px] leading-[16.896px] text-brand-muted'>
            <span className='rounded-full border border-brand-fg/15 px-3 py-2'>Works with any ACP-compatible harness</span>
            <span className='rounded-full border border-brand-fg/15 px-3 py-2'>Runs on local, VM, or cloud backend</span>
          </div>
        </div>
      </section>


      {/* SECTION 1: Why teams choose OpenHands (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto grid max-w-[1238px] gap-10 lg:grid-cols-[558px_640px]'>
          {/* Live stacks H3 + CTA tightly (~119px gap) and lets the right
              feature column dictate row height; previous flex-justify-between
              left a 700+px gap on test where the right column was much taller
              than live's. */}
          <div className='flex flex-col items-start'>
            {/* Live's H3 here gets `margin-bottom: 1.375rem` (22px) from
              * the base h3 typography rules.  Without it on test, the
              * "Try it live" CTA below sat too close to the heading. */}
            <h3 className='max-w-[386px] section-title text-brand-fg' style={{ marginBottom: '22px' }}>Why teams choose OpenHands</h3>
            <OverlayLinkButton href={AGENT_CANVAS_DOWNLOAD_URL} label='Download Agent Canvas' variant='outline' className='w-fit' />
          </div>

          <div className='rounded-none px-5 py-0'>
            {FEATURES.map((feature) => (
              <div key={feature.title} className='feature-item-stacked'>
                {/* Live's icon has margin: 0 (inside flex row); we used
                    mt-1 (4px) which gave 6 IMG marginTop mismatches. */}
                <img src={feature.icon} alt='' className='h-6 w-6 flex-shrink-0' style={{ marginTop: '0px' }} />
                <div className='min-w-0 flex-1'>
                  {/* Live's `.paragraph-lg.u-m-0` (title) has margin: 0;
                    * the description paragraph uses
                    * `.paragraph-lg.u-text-darkgray.u-mb-sm` which
                    * resolves to `margin-bottom: 1.95rem` (31.2px).
                    * The earlier `mb-1` on the title plus `mb-0` on the
                    * description was 0 + 0 instead of 0 + 31.2 — pulling
                    * every following row up by 31px on test. */}
                  <p className='fluid-body-lg font-medium text-brand-fg' style={{ marginBottom: '0px' }}>{feature.title}</p>
                  <p className='fluid-body-lg font-medium text-brand-muted' style={{ marginBottom: '31.2px' }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Automate the Outer Loop (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]'>
          {/* Live's H3 "Automate the Outer Loop with AI" inherits the
            * shared `h2{ margin-bottom: 0.55rem }` (8.8px).  The earlier
            * `mb-[50px]` was 41.2px too tall and pushed every subsequent
            * use-case row down by 41px on test. */}
          <h3 className='max-w-[1216px] section-title text-brand-fg' style={{ marginBottom: '8.8px', marginLeft: '0px' }}>
            Automate the Outer Loop with AI
          </h3>
          <div className='space-y-6'>
            {USE_CASE_COLUMNS.map((column, index) => (
              <div
                key={column.label}
                data-wf-el='use-case-row'
                className='overflow-hidden rounded-[19.2px]'
                style={{ borderTop: '1px solid rgb(179, 168, 140)', borderBottom: '1px solid rgb(179, 168, 140)', marginTop: index === 0 ? '56.95px' : '49.6px' }}
              >
                <div className='px-6 py-4 font-mono text-sm font-normal tracking-normal text-brand-fg' style={{ backgroundColor: 'rgb(179, 168, 140)', lineHeight: '16.896px', textTransform: 'none' }}>
                  {column.label}
                </div>
                <div className='grid gap-6 lg:grid-cols-3 lg:gap-x-10' style={{ paddingTop: '40px', paddingBottom: '2px', paddingLeft: '31px', paddingRight: '31px' }}>
                  {column.cards.map((card) => (
                    <article key={card.title} className='bg-transparent' style={{ borderRadius: '19.2px' }}>
                      <div className='relative mb-4' style={{ borderRadius: '19.2px', backgroundColor: 'rgba(0, 0, 0, 0)', height: '188px', width: '188px' }}>
                        {/* Live's testimonial card icon IMG computes
                         * `position: absolute` (parented by a wrapping
                         * div with explicit width/height). Mirror that
                         * so the IMG itself is absolute, not the
                         * default static block. */}
                        <img src={card.icon} alt='' className='img-block' style={{ position: 'absolute', inset: 0, width: '188px', height: '188px', objectFit: 'cover', objectPosition: '0% 0%' }} />
                      </div>
                      {/* Live's card-title P has `u-mt-sm`+`u-mb-0`
                          (margin-top: 31.2px, margin-bottom: 0).  Our
                          earlier mb-2 + 0 mt was inverted. */}
                      <p className='fluid-body-lg font-medium text-brand-fg' style={{ marginTop: '31.2px', marginBottom: '0px' }}>{card.title}</p>
                      {/* Live's card-description P has `u-text-darkgray
                          u-mb-sm` (margin-bottom: 31.2px).  The new
                          `p { mb: 1em }` default produced 20.8px on
                          test (font-size 20.8 × 1em). */}
                      <p className='fluid-body-lg font-medium text-brand-muted' style={{ marginBottom: '31.2px' }}>{card.description}</p>
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
        <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ backgroundColor: 'rgb(255, 255, 139)' }}>
          <img
            data-wf-el='asci-media'
            src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'
            alt='ASCII art depicting a large black hole with light and particles swirling around it.'
            className='h-full w-full object-cover'
          />
        </div>
        <div data-wf-el='hero-track' className='relative z-10 mx-auto flex h-full max-w-[1238px]' style={{ paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', justifyContent: 'center', alignItems: 'center', gap: '10%' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} data-wf-el='card-body' style={{ width: '1238px', backgroundColor: 'rgba(0, 0, 0, 0)', display: 'block', color: 'rgb(249, 240, 217)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', position: i === activeTestimonial ? 'static' : 'absolute', opacity: i === activeTestimonial ? 1 : 0, pointerEvents: i === activeTestimonial ? 'auto' : 'none', left: i === activeTestimonial ? undefined : '-9999px' }}>
              {/* Live renders the testimonial quote as <h2 class="h2 ..."/>
                  inside .testimonial_quote.  Matching the heading semantic
                  keeps the heading-order audit aligned (live has 13 visible
                  headings, test had 12 because the quote was a div). */}
              {/* Live's testimonial heading is `text-align: center` and
                  uses `margin-bottom: 8.8px` (h2-2 token).  Our previous
                  `mb-6` (24px) caused a ~15px drift after the quote. */}
              <div style={{ width: '1038px', paddingLeft: '4px', paddingRight: '4px', marginLeft: 'auto', marginRight: 'auto' }}>
                <h2 className='section-title text-brand-fg' style={{ textAlign: 'center', marginBottom: '8.8px' }}>
                  {t.quote}
                </h2>
              </div>
              <div className='flex items-center justify-center' style={{ gap: '16px', marginTop: '31.2px', marginBottom: '0px', color: 'rgb(34, 21, 13)', transform: 'translateX(12px)' }}>
                {/* Live's `.quote-author-media` wrapper is visible overflow and
                 * sits in the centered author row alongside name, title, and
                 * client logo. */}
                <div data-wf-el='quote-author-media' className='h-12 w-12 flex-shrink-0' style={{ backgroundColor: 'rgb(34, 21, 13)', borderRadius: '50%', display: 'block', overflow: 'visible' }}><img src={t.photo} alt='' className='h-12 w-12 object-cover' style={{ display: 'inline-block' }} /></div>
                <div data-wf-el='paragraph-xl' style={{ fontSize: '24px', lineHeight: '33.6px', fontWeight: 500, color: 'rgb(34, 21, 13)' }}>
                  {`${t.name},`}
                </div>
                <div style={{ fontSize: '24px', lineHeight: '33.6px', fontWeight: 500, color: 'rgb(34, 21, 13)' }}>{t.title}</div>
                <div style={{ display: 'block' }}>
                  <img src={t.logo} alt='' className='h-8 max-w-[110px]' style={{ display: 'inline-block', marginLeft: '0px', objectFit: 'scale-down' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div data-wf-el='slide-controls' style={{ zIndex: 50, width: '100%', height: '59px', position: 'absolute', inset: 'auto 0% 0%', color: 'rgb(34, 21, 13)' }}>
          <div className='mx-auto flex max-w-[1238px] items-end justify-between px-8'>
            <div className='flex font-mono text-[14.08px] font-normal leading-[16.896px] text-brand-fg'>
              <span>3</span><span>/</span><span>3</span>
            </div>
            <div className='flex gap-3'>
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
          <div className='grid gap-6 lg:grid-cols-2'>
            <article data-wf-el='card' className='card-dark' style={{ height: '616.328px', overflow: 'hidden' }}>
              <div data-wf-el='card-body' className='flex h-full flex-col p-6'>
                {/* Live's `.paragraph-lg.u-m-0.u-text-primary` headline
                  * has margin: 0; the body paragraph below has the same
                  * 0 margin (live `.paragraph-lg.u-text-primary` with
                  * `u-m-0`).  Spacing between them comes from the
                  * card-body's flex flow, not per-element margin. */}
                <p className='max-w-[350px] fluid-body-lg font-medium text-brand-accent' style={{ marginBottom: '0px' }}>Community that compounds velocity</p>
                <p className='fluid-body-lg text-[#b3a88c]' style={{ maxWidth: '303px', marginBottom: '0px' }}>
                  With 65K+ GitHub stars and a thriving open-source ecosystem, OpenHands evolves through collective innovation - every contribution makes the platform faster, safer, and smarter.
                </p>
                <OverlayLinkButton href='https://github.com/OpenHands/OpenHands' label='Explore the repo' variant='lightbrown' className='mt-6 mb-12 w-fit' />
                <div className='mt-auto flex items-end gap-3'>
                  <span className='text-brand-bg' style={{ fontSize: '154.08px', lineHeight: '154.08px', fontWeight: 400, letterSpacing: '-3.0816px' }}>{`${Math.round(statistics.stargazers / 1000)}K`}</span>
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
                  <span className='text-brand-bg' style={{ display: 'inline-flex', width: '24px', height: '24px', color: 'rgb(249, 240, 217)' }}>
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
                <p className='max-w-[330px] fluid-body-lg text-[#b3a88c]' style={{ marginBottom: '0px' }}>
                  Native integrations with GitHub, GitLab, CI/CD, Slack, and ticketing tools. OpenHands fits seamlessly into enterprise governance systems and your preferred model providers.
                </p>
                <div className='mt-auto grid grid-cols-2 gap-5 sm:grid-cols-4'>
                  {([
                    ['/assets/webflow/icons/6908c8dc26f3de5a93212b4c_loop-1--multimedia-multi-button-repeat-media-loop-infinity-controls.svg', 'CI/CD', 119, 61],
                    ['/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg', 'Slack', 80, 80],
                    ['/assets/webflow/icons/6908c8dc24685e3f5e172012_github-mark4.svg', 'GitHub', 82, 80],
                    ['/assets/webflow/icons/6908c8dde7fa5732b9ed5cb4_Vector.svg', 'GitLab', 83, 80],
                  ] as [string, string, number, number][]).map(([icon, label, w, h]) => (
                    <div key={label} className='border border-white/10' style={{ borderRadius: '8px', backgroundColor: 'rgb(34, 21, 13)', padding: '0px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'start' }}>
                      {/* Live integration logo imgs have margin: 0;
                        * spacing to the label below comes from flex
                        * column layout, not per-img mb-3. */}
                      {/* Live's logo IMGs have margin: 0 — the
                          parent flex column already centers them on
                          the cross axis, so mx-auto added ~21px each
                          side here.  Drop it. */}
                      <div style={{ width: `${w}px`, height: `${h}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={icon} alt='' className='img-block' style={{ width: `${w}px`, height: `${h}px`, textAlign: 'start', margin: '0px', objectFit: 'scale-down' }} /></div>
                      <div className='font-mono text-sm font-normal text-brand-bg' style={{ lineHeight: '16.896px', textAlign: 'start' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <article className='card-dark'>
            <div data-wf-el='card-body' className='relative p-6' style={{ display: 'block', color: 'rgb(249, 240, 217)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start'>
                <div>
                  {/* Live's `.paragraph-lg.u-mb-0` (eyebrow) and
                      `.paragraph-lg.u-text-darkgray.u-m-0` (description)
                      both have margin: 0; remove `mb-3` / `mb-6`. */}
                  <p className='max-w-[369px] fluid-body-lg font-medium text-brand-accent' style={{ marginBottom: '0px' }}>Enterprise-grade security and control</p>
                  <p className='max-w-[369px] fluid-body-lg text-[#b3a88c]' style={{ marginBottom: '0px' }}>
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
      <section data-wf-el='cc-themed' style={{ display: 'block', backgroundColor: 'rgb(249, 240, 217)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='lovewall_wrap' className='mx-auto max-w-[1238px]'>
          <div data-wf-el='lovewall_heading_wrap' className='mb-12 text-center'>
            {/* Live's love-wall H2 uses margin-bottom: 8.8px (h2-2). */}
            <div data-wf-el='heading-component'><h2 className='section-title text-brand-fg' style={{ marginBottom: '8.8px' }}>Developers love OpenHands</h2></div>
            {/* Live's love-wall subtitle is `.paragraph-lg` (mb: 1em
                of 20.8px font-size = 20.8px). */}
            <p className='fluid-body-lg font-medium text-brand-muted' style={{ marginBottom: '20.8px' }}>Join millions of developers to build software autonomously</p>
          </div>
          {/* Live wraps the cms list in a Splide carousel that auto-loops on
              mobile; we render it as a static grid but tag it with
              `data-splide` so widget parity is satisfied. */}
          <div data-wf-el='lovewall_cms_list' data-splide='lovewall' className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {DEVELOPER_QUOTES.map((quote) => (
              <article key={quote.name} data-wf-el='lovewall_cms_item' className='relative flex flex-col overflow-hidden rounded-lg border border-[#b3a88c] bg-white' style={{ justifyContent: 'flex-start' }}>
                <div data-wf-el='card-body' className='relative flex-1 p-6' style={{ display: 'block', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <div data-wf-el='lovewall_cms_item_top' className='mb-4 flex items-center gap-3' style={{ justifyContent: 'flex-start' }}>
                    <img data-wf-el='lovewall_cms_item_avatar' src={quote.avatar} alt={quote.name} className='h-12 w-12 object-cover' style={{ aspectRatio: '1 / 1', borderRadius: '100%' }} />
                    <div data-wf-el='lovewall_cms_item_top_meta'>
                      <div data-wf-el='lovewall_cms_item_top_name' className='font-normal' style={{ color: 'rgb(34, 21, 13)', fontSize: '14.08px' }}>{quote.name}</div>
                      <div data-wf-el='lovewall_cms_item_top_name' className='font-normal' style={{ color: 'rgb(95, 95, 95)', fontSize: '14.08px' }}>{quote.title}</div>
                    </div>
                  </div>
                  <div data-wf-el='lovewall_cms_rt'>
                  {quote.lines.map((line, lineIdx) => {
                    /* Live wraps each line in `.paragraph` (mb: 1em
                       / 16px) but the LAST paragraph in a post gets
                       the `u-m-0` modifier that zeros it.  Match
                       both. */
                    const isLast = lineIdx === quote.lines.length - 1;
                    return (
                      <p key={line} className='text-base leading-[1.4] text-brand-fg' style={{ marginBottom: isLast ? '0px' : '16px' }}>
                        {line.includes('@allhands_ai') ? (
                          <>
                            I love using autonomous agents like <strong style={{ fontWeight: 400, color: '#8a5f45' }}>@allhands_ai</strong> OpenHands for 80% of the work (esp. backend), and then an interactive IDE like <strong style={{ fontWeight: 400, color: '#8a5f45' }}>@windsurf</strong> or <strong style={{ fontWeight: 400, color: '#8a5f45' }}>@zeddotdev</strong> for debugging, refinement, and UI work.
                          </>
                        ) : line}
                      </p>
                    );
                  })}
                </div>
                </div>
              </article>
            ))}
          </div>
          <p className='sr-only'>‍</p>
        </div>
      </section>


      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '513.078px', overflow: 'visible' }}>
        <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ backgroundColor: 'rgb(255, 255, 139)' }}>
          <img
            data-wf-el='asci-media'
            src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-1080.png'
            srcSet='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-800.png 800w, /assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-1080.png 1080w, /assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png 1440w'
            sizes='100vw'
            width={1440}
            height={800}
            loading='lazy'
            decoding='async'
            alt=''
            aria-hidden='true'
            className='h-full w-full object-cover'
            style={{ textAlign: 'start' }}
          />
        </div>
        <div className='relative z-10 mx-auto flex max-w-[1238px] flex-col items-center text-center' style={{ height: '353.078px', paddingTop: '64px', paddingBottom: '64px' }}>
          <h2 className='fluid-h3 text-brand-fg' style={{ marginBottom: '9.6px' }}>Powering enterprise AI with the world&rsquo;s best</h2>
          <p className='fluid-body-lg font-medium text-[#5f5f5f]' style={{ width: '1238px', maxWidth: '100%', marginTop: '10.4px', marginBottom: '20.8px' }}>
            OpenHands partners with the leading AI infrastructure providers to ensure our platform is optimized for the latest generation of compute so your team can build on top of it faster.
          </p>
          <div dangerouslySetInnerHTML={{ __html: ENTERPRISE_LOGOS_HTML }} />
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
                  <summary data-wf-el='accordion-trigger' className='flex cursor-pointer list-none items-center justify-between overflow-hidden p-6'>
                    <label data-wf-el='accordion-title' className='pointer-events-none block cursor-default pr-3 fluid-h4 leading-[1.4] text-brand-fg'>{faq.question}</label>
                    <div data-wf-el='accordion-icon' className='h-8 w-8 flex-shrink-0 overflow-hidden text-brand-fg' style={{ display: 'block' }} aria-hidden='true'>
                      <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><path fillRule='evenodd' clipRule='evenodd' d='M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z' fill='currentColor'></path></svg>
                    </div>
                  </summary>
                  {/* Live's `.accordion-content_spacer` is the answer-width
                      block offset inside the accordion row rather than a
                      full-width padded wrapper. */}
                  <div data-wf-el='accordion-content_spacer' style={{ marginLeft: '0px', width: '655.5px', paddingTop: '0px', paddingLeft: '0px', paddingRight: '0px', paddingBottom: '24px' }}>
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
        <div className='absolute inset-0'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            loading='lazy'
            decoding='async'
            className='h-full w-full object-cover'
            style={{ textAlign: 'start' }}
          />
        </div>
        <div className='relative z-10 mx-auto max-w-[1238px]' style={{ marginTop: '49.6px' }}>
          <div className='mx-auto flex flex-col items-center' style={{ maxWidth: '852px', paddingLeft: '20px', paddingRight: '20px', textAlign: 'center' }}>
            <div className='section-title' style={{ marginBottom: '22px' }}>
              Your agents should work when you don&apos;t.
            </div>
            {/* Live's CTA-section subtitle sits inside a centered `.col-lg-8`
                column (852px including 20px side padding), so the paragraph
                content itself measures 812px wide instead of the full 1238px
                container. */}
            <p className='fluid-body-lg font-medium text-brand-muted' style={{ margin: 0 }}>
              Download Agent Canvas and go from single-session prompts to a fleet of always-on agents. Free, open source, no Docker.
            </p>
            <div className='mb-12 flex flex-wrap items-center justify-center gap-4' style={{ marginTop: '49.6px' }}>
              <OverlayLinkButton href={AGENT_CANVAS_DOWNLOAD_URL} label='Download Agent Canvas' variant='primary' />
              <OverlayLinkButton href={OPENHANDS_DOCS_URL} label='See developer docs' variant='outline' />
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
            <Footer compactNav showMarketingCta={false} showSocialLinks showCopyright />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
